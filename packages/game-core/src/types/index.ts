// ═══════════════════════════════════════════════════════
// CORE GAME TYPES  –  shared between frontend and API
// Both sides import from @fear/game-core/types
// ═══════════════════════════════════════════════════════

// ── Tile types ─────────────────────────────────────────
export type TileType = 0 | 1 | 2; // Wall | Floor | Stair
export type TileMap  = TileType[][];

// ── Body parts ─────────────────────────────────────────
export type BodyPartKey = "head" | "torso" | "rightArm" | "leftArm" | "rightLeg" | "leftLeg";

export interface BodyPart {
  hp:      number;
  max:     number;
  severed: boolean;
}

export type BodyPartMap = Record<BodyPartKey, BodyPart>;

// ── Status effects ─────────────────────────────────────
export type StatusType = "BLEEDING" | "POISONED" | "STUNNED" | "BURNING" | "WEAKENED" | "REGEN";

export interface StatusEffect {
  type: StatusType;
  dur:  number; // -1 = permanent
}

// ── Inventory ──────────────────────────────────────────
export type ItemType = "USE" | "WEAPON" | "ARMOR" | "HELMET" | "KEY" | "MISC";

export interface InventoryItem {
  uid: string;
  iid: string; // key into ITEMS definition map
}

// ── Character classes ──────────────────────────────────
export type CharacterClass = "soldier" | "rogue" | "scholar" | "outlander";

// ── Player state ───────────────────────────────────────
export interface PlayerState {
  x: number;
  y: number;
  cls:    CharacterClass;
  name:   string;

  // Base stats
  hp:     number;
  maxHp:  number;
  atk:    number;
  def:    number;
  agi:    number;

  // Survival
  hunger: number; // 0–100
  fear:   number; // 0–100  → 100 = mindbreak = death
  torch:  number; // steps of light remaining

  // Body
  parts:    BodyPartMap;
  statuses: StatusEffect[];

  // Progression
  floor: number;
  steps: number;
  xp:    number;
  level: number;

  // Equipment
  weapon:  string | null;
  armor:   string | null;
  helmet:  string | null;

  // Ability state
  abilityCD:      number;
  guarding:       boolean;
  backstabReady:  boolean;
  studyBonus:     number;

  // Inventory
  inv: InventoryItem[];
}

// ── Enemy state ────────────────────────────────────────
export interface EnemyState {
  eid:     string;
  type:    string;
  name:    string;
  ch:      string;
  col:     string;

  x: number;
  y: number;

  hp:     number;
  maxHp:  number;
  atk:    number;
  def:    number;
  agi:    number;
  fear:   number;
  xp:     number;

  parts:   BodyPartMap;
  buffDef: number;
  stunned: boolean;
  bleeding:boolean;

  // Boss-specific
  boss?:      boolean;
  bossPhase?: number;

  loot: Array<{ id: string; c: number }>;
}

// ── Ground item ────────────────────────────────────────
export interface GroundItem {
  gid: string;
  iid: string;
  x:   number;
  y:   number;
}

// ── Map event ──────────────────────────────────────────
export type EventType = "altar" | "well" | "corpse" | "inscription";

export interface MapEvent {
  eid:  string;
  type: EventType;
  x:    number;
  y:    number;
  done: boolean;
}

// ── Room ───────────────────────────────────────────────
export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Full dungeon state ─────────────────────────────────
export interface DungeonState {
  floor:   number;
  map:     TileMap;
  rooms:   Room[];
  spawn:   { x: number; y: number };
  stair:   { x: number; y: number };
  enemies: EnemyState[];
  gi:      GroundItem[];
  events:  MapEvent[];
  isBoss:  boolean;
}

// ── Full serialisable game state ───────────────────────
// This is what gets stored in the `state` JSONB column
export interface GameState {
  player:  PlayerState;
  dungeon: DungeonState;
  floor:   number;
  // Visited tile keys for fog-of-war ("x,y")
  seen:    string[];
  quests?: Record<string, any>;
  journal?: Record<string, any>;
  npcs?: Record<string, any>;
}

// ── Combat result (returned from server) ───────────────
export interface CombatResult {
  messages:    string[];
  newPlayer:   PlayerState;
  newEnemy:    EnemyState | null; // null = enemy died
  dead:        boolean;
  sever:       boolean;
  enemyDrops?: GroundItem[];
  xpGained?:   number;
  victory?:    boolean;
}

// ── Action types (client → server) ─────────────────────
export type CombatActionType = "ATTACK" | "FLEE" | "ABILITY";

export interface CombatAction {
  type:        CombatActionType;
  targetPart?: BodyPartKey;
  saveId:      string;
}

export interface MoveAction {
  dx:     number;
  dy:     number;
  saveId: string;
}

export interface ItemAction {
  type:   "USE" | "EQUIP" | "PICKUP";
  uid?:   string;   // for USE/EQUIP (inventory uid)
  gid?:   string;   // for PICKUP (ground item gid)
  saveId: string;
}

export interface EventAction {
  type:      "EVENT_CHOICE";
  eventEid:  string;
  choiceIdx: number;
  saveId:    string;
}

export interface SyncStateAction {
  type:      "SYNC_STATE";
  saveId:    string;
  player?:   PlayerState;
  dungeon?:  DungeonState;
  quests?:   any;
  journal?:  any;
  npcs?:     any;
  seen?:     string[];
}

export type GameAction = CombatAction | MoveAction | ItemAction | EventAction | SyncStateAction;

// ── Server responses ───────────────────────────────────
export interface ActionResponse {
  ok:        boolean;
  messages:  string[];
  state:     GameState;
  combatResult?: CombatResult;
  dead?:     boolean;
  won?:      boolean;
  levelUp?:  number; // new level if leveled up
}
