import type { GameState, PlayerState, CharacterClass } from "@fear/game-core/types";
import { CLASS_DEFS }    from "../data/definitions.js";
import { generateDungeon } from "./dungeon.js";
import { computeFOV }    from "./fov.js";

function uid() { return Math.random().toString(36).slice(2, 8); }

function makeParts(hp: number) {
  const mk = (f: number) => ({ hp: Math.ceil(hp * f), max: Math.ceil(hp * f), severed: false });
  return {
    head: mk(0.20), torso: mk(0.40),
    rightArm: mk(0.10), leftArm: mk(0.10),
    rightLeg: mk(0.10), leftLeg: mk(0.10),
  };
}

export function buildInitialState(
  cls:      CharacterClass,
  userId:   string,
  username: string,
): GameState {
  const c = CLASS_DEFS[cls];
  if (!c) throw new Error(`Unknown class: ${cls}`);

  const dungeon = generateDungeon(1);

  const player: PlayerState = {
    x: dungeon.spawn.x,
    y: dungeon.spawn.y,
    cls, name: c.name,

    hp: c.hp, maxHp: c.hp,
    atk: c.atk, def: c.def, agi: c.agi,

    hunger: c.hunger, fear: c.fear, torch: c.torch,
    parts:    makeParts(c.hp),
    statuses: [],

    floor: 1, steps: 0, xp: 0, level: 1,

    weapon: c.items.find((id: string) => {
      // Is this item a weapon?
      const WEAPON_IDS = ["sword","fine_sword","dagger","axe","war_axe","spear","club","flail","torch_wpn"];
      return WEAPON_IDS.includes(id);
    }) ?? null,
    armor:  null,
    helmet: null,

    abilityCD:     0,
    guarding:      false,
    backstabReady: false,
    studyBonus:    1,

    inv: c.items.map((iid: string) => ({ uid: uid(), iid })),
  };

  // Initial FOV
  const torchRadius = player.torch > 35 ? 6 : player.torch > 0 ? 3 : 2;
  const initialFOV  = computeFOV(dungeon.map as any, player.x, player.y, torchRadius);
  const seen        = Array.from(initialFOV);

  return { player, dungeon, floor: 1, seen };
}
