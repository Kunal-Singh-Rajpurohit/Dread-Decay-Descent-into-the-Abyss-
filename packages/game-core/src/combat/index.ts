import type {
  PlayerState, EnemyState, BodyPartKey, BodyPartMap,
  CombatResult, GroundItem, StatusEffect,
} from "../types/index.js";
import { ITEM_DEFS, ABILITY_DEFS, CLASS_DEFS } from "../data/definitions.js";
import { rng, flip, uid } from "../utils.js";

// Part multipliers & display
export const PMUL: Record<BodyPartKey, number> = {
  head:0,torso:0,rightArm:0,leftArm:0,rightLeg:0,leftLeg:0,
};
Object.assign(PMUL,{head:2.0,torso:1.0,rightArm:0.7,leftArm:0.7,rightLeg:0.6,leftLeg:0.6});

export const PLAB: Record<BodyPartKey, string> = {
  head:"Head",torso:"Torso",rightArm:"R.Arm",leftArm:"L.Arm",rightLeg:"R.Leg",leftLeg:"L.Leg",
};

function hasSt(p: PlayerState, t: string): boolean {
  return p.statuses.some(s => s.type === t);
}

function getPlayerAtk(p: PlayerState): number {
  return p.atk + (p.weapon ? ITEM_DEFS[p.weapon]?.stats?.atk ?? 0 : 0);
}

function getPlayerDef(p: PlayerState): number {
  return p.def
    + (p.armor  ? ITEM_DEFS[p.armor]?.stats?.def  ?? 0 : 0)
    + (p.helmet ? ITEM_DEFS[p.helmet]?.stats?.def ?? 0 : 0);
}

// ── Player attacks enemy ───────────────────────────────
export function resolvePlayerAttack(
  player: PlayerState,
  enemy:  EnemyState,
  part:   BodyPartKey,
): CombatResult {
  const msgs: string[] = [];
  const ne: EnemyState = JSON.parse(JSON.stringify(enemy));
  let   np: PlayerState = JSON.parse(JSON.stringify(player));

  // Stunned — miss turn
  if (hasSt(np, "STUNNED")) {
    np.statuses = np.statuses.filter(s => s.type !== "STUNNED");
    return { messages: ["You are stunned! Attack fails."], newPlayer: np, newEnemy: ne, dead: false, sever: false };
  }

  const props   = player.weapon ? ITEM_DEFS[player.weapon]?.props ?? {} : {};
  const isWeak  = hasSt(np, "WEAKENED");
  const hitP    = Math.min(0.95, 0.70 + (np.agi - (ne.agi ?? 4)) * 0.03 + (props.acc ?? 0));

  if (!flip(hitP)) {
    return { messages: [`You swing at the ${ne.name}'s ${PLAB[part]}... and miss!`], newPlayer: np, newEnemy: ne, dead: false, sever: false };
  }

  const isCrit      = flip(props.crit ?? 0);
  const critM       = isCrit ? (props.critM ?? 1.5) : 1;
  const backstabM   = np.backstabReady ? (np.backstabReady = false, 3) : 1;
  const studyM      = np.studyBonus ?? 1;
  np.studyBonus     = 1;
  const weakM       = isWeak ? 0.5 : 1;
  const eDef        = Math.max(0, (ne.def + ne.buffDef) - (props.defPen ?? 0));

  const dmg = Math.max(1, Math.floor(
    getPlayerAtk(np) * PMUL[part] * critM * backstabM * studyM * weakM - eDef + rng(-2, 3)
  ));

  ne.hp = Math.max(0, ne.hp - dmg);
  ne.parts[part].hp = Math.max(0, ne.parts[part].hp - dmg);

  msgs.push(isCrit
    ? `✦ Critical! ${ne.name}'s ${PLAB[part]} — ${dmg} damage!`
    : `You strike ${ne.name}'s ${PLAB[part]} for ${dmg} damage!`
  );

  let sever = false;
  if (!ne.parts[part].severed && ne.parts[part].hp === 0) {
    ne.parts[part].severed = true;
    sever = true;
    msgs.push(`The ${PLAB[part]} is severed! Blood pours.`);
    np.fear = Math.min(100, np.fear + 8);
  }

  // Weapon proc effects
  if (props.bleed && flip(props.bleed) && !ne.bleeding) { ne.bleeding = true; msgs.push("The wound bleeds."); }
  if (props.stun  && flip(props.stun))                   { ne.stunned  = true; msgs.push(`The blow stuns the ${ne.name}!`); }
  if (props.burn  && flip(props.burn)) {
    np.statuses = [...np.statuses.filter(s => s.type !== "BURNING"), { type: "BURNING", dur: 4 }];
    msgs.push("The torch sets the enemy alight — and you too!");
  }

  const dead = ne.hp <= 0;
  if (dead) msgs.push(`The ${ne.name} falls. Silence.`);

  // Loot on death
  let enemyDrops: GroundItem[] | undefined;
  let xpGained:   number | undefined;
  if (dead) {
    enemyDrops = (ne.loot ?? [])
      .filter(l => flip(l.c))
      .map(l => ({ gid: `drop_${uid()}`, iid: l.id, x: ne.x, y: ne.y }));
    xpGained = ne.xp;
    np.xp = (np.xp ?? 0) + ne.xp;
  }

  // Boss phase 2
  if (ne.boss && ne.hp < ne.maxHp * 0.5 && ne.bossPhase === 1) {
    ne.bossPhase = 2;
    ne.atk += 6;
    msgs.push("⚡ The Warden's form SHIFTS. Something is very wrong.");
  }

  return {
    messages: msgs,
    newPlayer: np,
    newEnemy: dead ? null : ne,
    dead, sever,
    enemyDrops,
    xpGained,
    victory: dead && !!ne.boss,
  };
}

// ── Enemy attacks player ───────────────────────────────
export function resolveEnemyAttack(enemy: EnemyState, player: PlayerState): {
  messages: string[];
  newPlayer: PlayerState;
  newEnemy:  EnemyState;
} {
  const msgs: string[] = [];
  const np: PlayerState = JSON.parse(JSON.stringify(player));
  let   ne: EnemyState  = JSON.parse(JSON.stringify(enemy));

  // Stunned enemy
  if (ne.stunned) {
    ne.stunned = false;
    return { messages: [`${ne.name} is stunned and cannot attack!`], newPlayer: np, newEnemy: ne };
  }

  const parts = Object.keys(PMUL) as BodyPartKey[];
  const tgt   = parts[rng(0, parts.length - 1)];

  if (!flip(0.65)) {
    return { messages: [`${ne.name} lunges — and misses!`], newPlayer: np, newEnemy: ne };
  }

  const rawDmg = Math.max(1, Math.floor(ne.atk * PMUL[tgt] - getPlayerDef(player) + rng(-2, 3)));
  const finalDmg = np.guarding ? Math.max(1, Math.floor(rawDmg * 0.25)) : rawDmg;

  if (np.guarding) { msgs.push("Your guard holds!"); np.guarding = false; }

  np.hp = Math.max(0, np.hp - finalDmg);
  np.parts[tgt].hp = Math.max(0, np.parts[tgt].hp - finalDmg);
  msgs.push(`${ne.name} tears into your ${PLAB[tgt]} for ${finalDmg} damage!`);

  if (!np.parts[tgt].severed && np.parts[tgt].hp === 0) {
    np.parts[tgt].severed = true;
    np.fear = Math.min(100, np.fear + 20);
    np.statuses = [...np.statuses, { type: "BLEEDING", dur: -1 }];
    msgs.push(`Your ${PLAB[tgt]} is severed!`);
  }

  return { messages: msgs, newPlayer: np, newEnemy: ne };
}

// ── Enemy special move ─────────────────────────────────
export function resolveEnemySpecial(enemy: EnemyState, player: PlayerState): {
  triggered: boolean;
  messages:  string[];
  newPlayer: PlayerState;
  newEnemy:  EnemyState;
} | null {
  const sp = (enemy as any).sp;
  if (!sp || !flip(sp.t)) return null;

  const r    = sp.fn(enemy, player);
  const msgs = [`[${sp.n}] ${r.msg}`];
  const np: PlayerState = JSON.parse(JSON.stringify(player));
  let   ne: EnemyState  = JSON.parse(JSON.stringify(enemy));

  if (r.dmg > 0) {
    const tgt  = r.tgt as BodyPartKey ?? "torso";
    const def  = getPlayerDef(player);
    const dmg  = r.guaranteed ? r.dmg : Math.max(1, r.dmg - def + rng(-1, 2));
    np.hp = Math.max(0, np.hp - dmg);
    if (np.parts[tgt]) np.parts[tgt].hp = Math.max(0, np.parts[tgt].hp - dmg);
    if (np.parts[tgt] && !np.parts[tgt].severed && np.parts[tgt].hp === 0) {
      np.parts[tgt].severed = true;
      np.fear = Math.min(100, np.fear + 20);
      np.statuses = [...np.statuses, { type: "BLEEDING", dur: -1 }];
      msgs.push(`Your ${PLAB[tgt]} is severed!`);
    }
  }

  if (r.fearDmg) np.fear = Math.min(100, np.fear + r.fearDmg);
  if (r.stun)    np.statuses = [...np.statuses, { type: "STUNNED",  dur: 1 }];
  if (r.poison)  np.statuses = [...np.statuses.filter(s => s.type !== "POISONED"), { type: "POISONED", dur: 14 }];
  if (r.weaken)  np.statuses = [...np.statuses, { type: "WEAKENED", dur: 3  }];
  if (r.fortify) ne.buffDef  = (ne.buffDef ?? 0) + 4;

  if (ne.boss && ne.hp < ne.maxHp * 0.5 && ne.bossPhase === 1) {
    ne.bossPhase = 2; ne.atk += 6;
    msgs.push("⚡ The Warden's form SHIFTS. Something is very wrong.");
  }

  return { triggered: true, messages: msgs, newPlayer: np, newEnemy: ne };
}

// ── Class ability ──────────────────────────────────────
export function resolveAbility(player: PlayerState, enemy: EnemyState): {
  messages:  string[];
  newPlayer: PlayerState;
} {
  const msgs: string[] = [];
  const np: PlayerState = JSON.parse(JSON.stringify(player));
  const abl = player.cls;

  if (abl === "soldier")   { np.guarding = true;          msgs.push("You brace. Next hit reduced by 75%."); }
  if (abl === "rogue")     { np.backstabReady = true;      msgs.push("You prepare a devastating backstab..."); }
  if (abl === "scholar")   { np.studyBonus = 2;            msgs.push(`You study the ${enemy.name}. Next hit does 2× damage.`); }
  if (abl === "outlander") { np.hp = Math.min(np.maxHp, np.hp + 20); msgs.push("Second Wind! +20 HP."); }

  const ablDef = ABILITY_DEFS[abl as keyof typeof ABILITY_DEFS];
  np.abilityCD = ablDef?.cd === -1 ? 9999 : (ablDef?.cd ?? 4) * 2;

  return { messages: msgs, newPlayer: np };
}
