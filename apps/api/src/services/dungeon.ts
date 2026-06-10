import type { DungeonState, EnemyState, GroundItem, MapEvent, Room } from "@fear/game-core/types";
import { ENEMY_DEFS, FLOOR_TABLES, EVENT_TYPES, ITEM_POOLS } from "../data/definitions.js";

const MW = 32, MH = 20;
const T  = { W: 0, F: 1, S: 2 } as const;

function rng(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}
function flip(p: number): boolean { return Math.random() < p; }
function uid(): string { return Math.random().toString(36).slice(2, 8); }

function makeParts(hp: number) {
  const mk = (f: number) => ({ hp: Math.ceil(hp * f), max: Math.ceil(hp * f), severed: false });
  return {
    head: mk(0.20), torso: mk(0.40),
    rightArm: mk(0.10), leftArm: mk(0.10),
    rightLeg: mk(0.10), leftLeg: mk(0.10),
  };
}

export function generateDungeon(floor: number): DungeonState {
  // ── Map generation (BSP rooms + tunnels) ──────────────
  const map: number[][] = Array.from({ length: MH }, () => Array(MW).fill(T.W));
  const rooms: Room[] = [];

  const carve = (x: number, y: number, w: number, h: number) => {
    for (let r = y; r < y + h; r++)
      for (let c = x; c < x + w; c++)
        map[r][c] = T.F;
  };

  const tunnel = (x1: number, y1: number, x2: number, y2: number) => {
    let cx = x1, cy = y1;
    while (cx !== x2) { map[cy][cx] = T.F; cx += cx < x2 ? 1 : -1; }
    while (cy !== y2) { map[cy][cx] = T.F; cy += cy < y2 ? 1 : -1; }
  };

  for (let att = 0; att < 130 && rooms.length < 8; att++) {
    const w = rng(4, 9), h = rng(3, 6);
    const x = rng(1, MW - w - 2), y = rng(1, MH - h - 2);
    if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    carve(x, y, w, h);
    if (rooms.length > 0) {
      const p = rooms[rooms.length - 1];
      tunnel(~~(p.x + p.w / 2), ~~(p.y + p.h / 2), ~~(x + w / 2), ~~(y + h / 2));
    }
    rooms.push({ x, y, w, h });
  }

  // ── Stairs ──────────────────────────────────────────
  const lr = rooms[rooms.length - 1];
  const sx = ~~(lr.x + lr.w / 2), sy = ~~(lr.y + lr.h / 2);
  map[sy][sx] = T.S;
  const spawn = { x: ~~(rooms[0].x + rooms[0].w / 2), y: ~~(rooms[0].y + rooms[0].h / 2) };

  // ── Enemies ──────────────────────────────────────────
  const isBoss  = floor === 5;
  const enemies: EnemyState[] = [];

  if (isBoss) {
    const def = ENEMY_DEFS.warden;
    enemies.push({
      ...JSON.parse(JSON.stringify(def)),
      eid: `warden_${floor}`,
      x: sx, y: Math.max(1, sy - 2),
      maxHp: def.hp, parts: makeParts(def.hp),
      buffDef: 0, stunned: false, bleeding: false, bossPhase: 1,
    });
  } else {
    const pool = FLOOR_TABLES[Math.min(floor - 1, FLOOR_TABLES.length - 1)];
    rooms.slice(1, -1).forEach((room, i) => {
      if (!flip(0.82)) return;
      const type = pool[rng(0, pool.length - 1)] as keyof typeof ENEMY_DEFS;
      const def  = ENEMY_DEFS[type];
      if (!def) return;
      enemies.push({
        ...JSON.parse(JSON.stringify(def)),
        type, eid: `${type}_${i}_${floor}`,
        x: ~~(room.x + room.w / 2), y: ~~(room.y + room.h / 2),
        maxHp: def.hp, parts: makeParts(def.hp),
        buffDef: 0, stunned: false, bleeding: false,
      } as EnemyState);
    });
  }

  // ── Ground items ──────────────────────────────────────
  const gi: GroundItem[] = [];
  const basePool  = ITEM_POOLS[floor < 3 ? "early" : "late"];
  rooms.slice(1).forEach((room, i) => {
    if (!flip(0.55)) return;
    gi.push({
      gid: `gi_${i}_${floor}`,
      iid: basePool[rng(0, basePool.length - 1)],
      x: room.x + 1 + rng(0, room.w - 3),
      y: room.y + 1 + rng(0, room.h - 3),
    });
  });
  // Weapon drop
  if (floor >= 2 && flip(0.45)) {
    const wpns = floor === 2 ? ["spear","club"] : floor === 3 ? ["flail","war_axe"] : ["fine_sword","war_axe"];
    const rm   = rooms[rng(1, rooms.length - 2)];
    gi.push({ gid: `wpn_${floor}`, iid: wpns[rng(0, wpns.length - 1)], x: rm.x + 1, y: rm.y + 1 });
  }
  // Armor drop
  if (floor >= 2 && flip(0.38)) {
    const arms = floor === 2 ? ["leather","robes"] : floor === 3 ? ["chain","helmet"] : ["plate","chain"];
    const rm   = rooms[rng(1, rooms.length - 2)];
    gi.push({ gid: `arm_${floor}`, iid: arms[rng(0, arms.length - 1)], x: rm.x + 2, y: rm.y + 1 });
  }

  // ── Events ───────────────────────────────────────────
  const events: MapEvent[] = [];
  rooms.slice(1, -1).forEach((room, i) => {
    if (!flip(0.45)) return;
    const type = EVENT_TYPES[rng(0, EVENT_TYPES.length - 1)];
    events.push({
      eid:  `ev_${i}_${floor}`,
      type: type as MapEvent["type"],
      x:    room.x + rng(1, room.w - 2),
      y:    room.y + rng(1, room.h - 2),
      done: false,
    });
  });

  return {
    floor, map: map as any, rooms, spawn,
    stair: { x: sx, y: sy },
    enemies, gi, events, isBoss,
  };
}
