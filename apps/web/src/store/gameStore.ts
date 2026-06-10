import { create }    from "zustand";
import { immer }     from "zustand/middleware/immer";
import type {
  GameState, PlayerState, EnemyState,
  BodyPartKey, CharacterClass,
} from "@fear/game-core/types";
import { auth, savesApi, gameApi, type SaveMeta } from "../api/client.js";

// ── Auth slice ────────────────────────────────────────
interface AuthSlice {
  userId:   string | null;
  username: string | null;
  authed:   boolean;
  login:    (email: string, password: string)                    => Promise<void>;
  register: (email: string, username: string, password: string)  => Promise<void>;
  logout:   ()                                                   => Promise<void>;
  checkMe:  ()                                                   => Promise<void>;
}

// ── Save-select slice ─────────────────────────────────
interface SavesSlice {
  saves:      SaveMeta[];
  loadSaves:  ()                                                        => Promise<void>;
  createSave: (slot: number, cls: CharacterClass)                      => Promise<void>;
  loadSave:   (saveId: string)                                          => Promise<void>;
  deleteSave: (saveId: string)                                          => Promise<void>;
}

// ── In-game slice ─────────────────────────────────────
interface GameSlice {
  saveId:    string | null;
  gameState: GameState | null;
  messages:  string[];
  combat:    { enemy: EnemyState; part: BodyPartKey; ablUsed: boolean } | null;
  showInv:   boolean;
  evModal:   string | null;   // event eid
  lvModal:   number | null;   // new level
  loading:   boolean;
  screen:    "menu" | "saves" | "game" | "dead" | "win";

  // Game actions
  move:          (dx: number, dy: number)         => Promise<void>;
  startCombat:   (enemy: EnemyState)              => void;
  combatAttack:  ()                               => Promise<void>;
  combatAbility: ()                               => Promise<void>;
  combatFlee:    ()                               => Promise<void>;
  selectPart:    (part: BodyPartKey)              => void;
  pickupItem:    (gid: string)                    => void;
  useItem:       (uid: string)                    => void;
  equipItem:     (uid: string, type: string)      => void;
  handleEvent:   (eid: string, choiceIdx: number) => void;
  levelUpChoice: (k: string)                      => Promise<void>;
  setShowInv:    (v: boolean)                     => void;
  addMessages:   (...m: string[])                 => void;
}

type Store = AuthSlice & SavesSlice & GameSlice;

export const useGameStore = create<Store>()(immer((set, get) => ({
  // ── Auth ─────────────────────────────────────────────
  userId: null, username: null, authed: false,

  checkMe: async () => {
    try {
      const r = await auth.me();
      set(s => { s.userId = r.userId; s.username = r.username; s.authed = true; });
    } catch {
      set(s => { s.authed = false; s.userId = null; s.username = null; });
    }
  },

  login: async (email, password) => {
    const r = await auth.login(email, password);
    set(s => { s.userId = r.userId; s.username = r.username; s.authed = true; s.screen = "saves"; });
    await get().loadSaves();
  },

  register: async (email, username, password) => {
    const r = await auth.register(email, username, password);
    set(s => { s.userId = r.userId; s.username = r.username; s.authed = true; s.screen = "saves"; });
  },

  logout: async () => {
    await auth.logout();
    set(s => { s.authed = false; s.userId = null; s.username = null; s.screen = "menu"; s.gameState = null; });
  },

  // ── Saves ─────────────────────────────────────────────
  saves: [],

  loadSaves: async () => {
    const r = await savesApi.list();
    set(s => { s.saves = r.saves; });
  },

  createSave: async (slot, cls) => {
    const r = await savesApi.create(slot, cls);
    set(s => { s.saveId = r.saveId; s.gameState = r.state; s.screen = "game"; s.messages = ["You descend into the dungeon.", "The torch flickers.", "Something stirs in the dark."]; });
  },

  loadSave: async (saveId) => {
    const r = await savesApi.load(saveId);
    set(s => { s.saveId = saveId; s.gameState = r.save.state; s.screen = "game"; s.messages = ["You continue your descent."]; });
  },

  deleteSave: async (saveId) => {
    await savesApi.delete(saveId);
    await get().loadSaves();
  },

  // ── In-game ───────────────────────────────────────────
  saveId: null, gameState: null, messages: [], combat: null,
  showInv: false, evModal: null, lvModal: null, loading: false,
  screen: "menu",

  addMessages: (...m) => set(s => { s.messages = [...s.messages.slice(-(10 - m.length)), ...m]; }),

  move: async (dx, dy) => {
    const { saveId, gameState, combat, showInv } = get();
    if (!saveId || !gameState || combat || showInv) return;

    set(s => { s.loading = true; });
    try {
      const r = await gameApi.action(saveId, { type: "MOVE", dx, dy } as any);
      get().addMessages(...r.messages);
      set(s => {
        s.gameState = r.state;
        s.loading   = false;
        if (r.dead) { s.screen = "dead"; }
        if (r.won)  { s.screen = "win";  }
        if (r.levelUp) { s.lvModal = r.levelUp; }
        // Check for event at new position
        const ev = r.state.dungeon.events.find(
          e => e.x === r.state.player.x && e.y === r.state.player.y && !e.done
        );
        if (ev) s.evModal = ev.eid;
      });
    } catch (e: any) {
      get().addMessages(`Error: ${e.message}`);
      set(s => { s.loading = false; });
    }
  },

  startCombat: (enemy) => set(s => {
    s.combat = { enemy: JSON.parse(JSON.stringify(enemy)), part: "torso", ablUsed: false };
  }),

  selectPart: (part) => set(s => { if (s.combat) s.combat.part = part; }),

  combatAttack: async () => {
    const { saveId, gameState, combat } = get();
    if (!saveId || !gameState || !combat) return;
    set(s => { s.loading = true; });
    try {
      const r = await gameApi.action(saveId, {
        type: "ATTACK", targetPart: combat.part, enemyEid: combat.enemy.eid,
      } as any);
      get().addMessages(...r.messages);
      set(s => {
        s.gameState = r.state;
        s.loading   = false;
        if (r.dead || r.won) { s.combat = null; }
        if (r.dead) s.screen = "dead";
        if (r.won)  s.screen = "win";
        if (r.levelUp) s.lvModal = r.levelUp;
        // Update combat enemy from new state
        if (s.combat && r.state) {
          const ne = r.state.dungeon.enemies.find(e => e.eid === s.combat!.enemy.eid);
          if (ne) s.combat.enemy = ne; else s.combat = null;
        }
      });
    } finally {
      set(s => { s.loading = false; });
    }
  },

  combatAbility: async () => {
    const { saveId, gameState, combat } = get();
    if (!saveId || !gameState || !combat) return;
    set(s => { s.loading = true; });
    try {
      const r = await gameApi.action(saveId, { type: "ABILITY", enemyEid: combat.enemy.eid } as any);
      get().addMessages(...r.messages);
      set(s => {
        s.gameState = r.state;
        s.loading   = false;
        if (r.dead) { s.combat = null; s.screen = "dead"; }
        if (s.combat && r.state) {
          const ne = r.state.dungeon.enemies.find(e => e.eid === s.combat!.enemy.eid);
          if (ne) s.combat.enemy = ne; else s.combat = null;
        }
        if (s.combat) s.combat.ablUsed = true;
      });
    } finally { set(s => { s.loading = false; }); }
  },

  combatFlee: async () => {
    const { saveId, gameState, combat } = get();
    if (!saveId || !gameState || !combat) return;
    const r = await gameApi.action(saveId, { type: "FLEE", enemyEid: combat.enemy.eid } as any);
    get().addMessages(...r.messages);
    set(s => { s.gameState = r.state; if (r.dead) { s.screen = "dead"; s.combat = null; } });
    // Fled successfully — detect by absence of damage msg
    if (!r.dead && r.messages.some(m => m.includes("break away"))) {
      set(s => { s.combat = null; });
    }
  },

  // Client-side item handling (checkpoint after)
  pickupItem: (gid) => {
    const { gameState, saveId } = get();
    if (!gameState || !saveId) return;
    const item = gameState.dungeon.gi.find(g => g.gid === gid);
    if (!item) return;
    set(s => {
      if (!s.gameState) return;
      s.gameState.dungeon.gi = s.gameState.dungeon.gi.filter(g => g.gid !== gid);
      s.gameState.player.inv.push({ uid: crypto.randomUUID(), iid: item.iid });
    });
    savesApi.checkpoint(saveId, get().gameState!, 0);
  },

  useItem: (uid) => {
    // Apply effect locally then checkpoint
    const { gameState, saveId } = get();
    if (!gameState || !saveId) return;
    // ... apply ITEM_DEFS effect locally (same logic as Phase 2 doUseItem)
    savesApi.checkpoint(saveId, get().gameState!, 0);
  },

  equipItem: (uid, type) => {
    const { saveId } = get();
    if (!saveId) return;
    set(s => {
      if (!s.gameState) return;
      const item = s.gameState.player.inv.find(i => i.uid === uid);
      if (!item) return;
      if (type === "WEAPON") s.gameState.player.weapon = item.iid;
      if (type === "ARMOR")  s.gameState.player.armor  = item.iid;
      if (type === "HELMET") s.gameState.player.helmet = item.iid;
    });
    savesApi.checkpoint(saveId, get().gameState!, 0);
  },

  handleEvent: (eid, choiceIdx) => {
    // Apply event effect locally then mark done
    set(s => {
      if (!s.gameState) return;
      const ev = s.gameState.dungeon.events.find(e => e.eid === eid);
      if (ev) ev.done = true;
      s.evModal = null;
    });
    savesApi.checkpoint(get().saveId!, get().gameState!, 0);
  },

  levelUpChoice: async (k) => {
    const { saveId } = get();
    if (!saveId) return;
    const r = await gameApi.action(saveId, { type: "LEVEL_UP_CHOICE", choice: k } as any);
    get().addMessages(...r.messages);
    set(s => { s.gameState = r.state; s.lvModal = null; });
  },

  setShowInv: (v) => set(s => { s.showInv = v; }),
})));
