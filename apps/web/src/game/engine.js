import { MW, MH, TS, T, TR_FULL, TR_DIM, TR_DARK, PMUL, PLAB, XP_LV, SCOL, MAX_FLOOR } from './constants.js';
import { ITEMS, RECIPES, CLS, ABLS, EDEFS, FTABLES, TRAP_TYPES, NPC_DEFS, LORE, QUESTS, EV_DEF } from './data.js';

export const rng = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const flip = p => Math.random() < p;
export const uid = () => Math.random().toString(36).slice(2, 8);
export function makeParts(hp) { const mk = f => ({ hp: Math.ceil(hp * f), max: Math.ceil(hp * f), severed: false }); return { head: mk(.20), torso: mk(.40), rightArm: mk(.10), leftArm: mk(.10), rightLeg: mk(.10), leftLeg: mk(.10) }; }
export function getTR(p) { return p.torch <= 0 ? TR_DARK : p.torch < 35 ? TR_DIM : TR_FULL; }
export function getLv(xp) { let l = 0; XP_LV.forEach((t, i) => { if (xp >= t) l = i; }); return l; }
export function getAtk(p) { return p.atk + (p.weapon ? ITEMS[p.weapon]?.stats?.atk || 0 : 0); }
export function getDef(p) { return p.def + (p.armor ? ITEMS[p.armor]?.stats?.def || 0 : 0) + (p.helmet ? ITEMS[p.helmet]?.stats?.def || 0 : 0); }
export function hasSt(p, t) { return p.statuses.some(s => s.type === t); }

export function survivalTick(p) {
  const out = { ...p, statuses: [...p.statuses] }; const msgs = [];
  out.hunger = Math.max(0, out.hunger - .5);
  out.torch = Math.max(0, out.torch - 1);
  if (out.hunger === 0) { out.hp = Math.max(0, out.hp - 1); if (out.steps % 6 === 0) msgs.push("Hunger consumes you from within..."); }
  if (out.torch === 0) { out.fear = Math.min(100, out.fear + .4); if (out.steps % 10 === 0) msgs.push("Darkness. Pure, absolute darkness."); }
  if (out.armor && ITEMS[out.armor]?.props?.fearPerStep) out.fear = Math.min(100, out.fear + ITEMS[out.armor].props.fearPerStep);
  if (out.helmet && ITEMS[out.helmet]?.props?.fearResist && out.fear > 0) out.fear = Math.max(0, out.fear - ITEMS[out.helmet].props.fearResist);
  out.statuses = out.statuses.reduce((acc, s) => {
    const ns = { ...s, dur: s.dur > 0 ? s.dur - 1 : s.dur };
    if (s.type === "BLEEDING" && out.steps % 4 === 0) { out.hp = Math.max(0, out.hp - 1); if (out.steps % 12 === 0) msgs.push("You bleed..."); }
    if (s.type === "POISONED") { out.hp = Math.max(0, out.hp - 2); if (out.steps % 3 === 0) msgs.push("Poison burns."); if (ns.dur <= 0) return acc; }
    if (s.type === "BURNING") { out.hp = Math.max(0, out.hp - 2); out.fear = Math.min(100, out.fear + 1); if (out.steps % 2 === 0) msgs.push("You burn!"); if (ns.dur <= 0) return acc; }
    if (s.type === "CURSED") { out.fear = Math.min(100, out.fear + 0.8); if (out.steps % 8 === 0) msgs.push("The curse whispers..."); }
    if (s.type === "FROZEN") { out.agi = Math.max(1, out.agi - 1); if (ns.dur <= 0) { out.agi = CLS[out.cls]?.agi || 5; return acc; } }
    if (s.type === "REGEN" && out.steps % 5 === 0) out.hp = Math.min(out.maxHp, out.hp + 1);
    if (ns.dur === 0 && s.type !== "BLEEDING" && s.type !== "REGEN" && s.type !== "CURSED") return acc;
    acc.push(ns); return acc;
  }, []);
  if (out.abilityCD > 0 && out.steps % 2 === 0) out.abilityCD = Math.max(0, out.abilityCD - 1);
  return { p: out, msgs };
}

export function genDungeon(floor = 1) {
  const map = Array.from({ length: MH }, () => Array(MW).fill(T.W));
  const rooms = [];
  const targetRooms = floor >= 7 ? rng(6, 8) : floor >= 4 ? rng(7, 10) : rng(8, 11);
  const carve = (x, y, w, h) => { for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (r >= 0 && r < MH && c >= 0 && c < MW) map[r][c] = T.F; };
  const tunn = (x1, y1, x2, y2) => { let cx = x1, cy = y1; while (cx !== x2) { if (cy >= 0 && cy < MH && cx >= 0 && cx < MW) map[cy][cx] = T.F; cx += cx < x2 ? 1 : -1; } while (cy !== y2) { if (cy >= 0 && cy < MH && cx >= 0 && cx < MW) map[cy][cx] = T.F; cy += cy < y2 ? 1 : -1; } };
  for (let att = 0; att < 180 && rooms.length < targetRooms; att++) {
    const w = rng(4, 9), h = rng(3, 6), x = rng(1, MW - w - 2), y = rng(1, MH - h - 2);
    if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    carve(x, y, w, h);
    if (rooms.length > 0) { const p = rooms[rooms.length - 1]; tunn(~~(p.x + p.w / 2), ~~(p.y + p.h / 2), ~~(x + w / 2), ~~(y + h / 2)); }
    rooms.push({ x, y, w, h });
  }
  const lr = rooms[rooms.length - 1];
  const sx = ~~(lr.x + lr.w / 2), sy = ~~(lr.y + lr.h / 2);
  map[sy][sx] = T.S;
  const spawn = { x: ~~(rooms[0].x + rooms[0].w / 2), y: ~~(rooms[0].y + rooms[0].h / 2) };

  rooms.forEach((room, i) => {
    if (i === 0) return;
    const cx = ~~(room.x + room.w / 2), cy = room.y;
    if (cy > 0 && map[cy - 1]?.[cx] === T.F && flip(.3)) map[cy][cx] = T.D;
  });

  const isBoss5 = floor === 5;
  const isBoss10 = floor === 10;
  const enemies = [];
  if (isBoss5) {
    const d = EDEFS.warden;
    enemies.push({ ...JSON.parse(JSON.stringify(d)), eid: `warden_${floor}`, x: sx, y: Math.max(1, sy - 2), parts: makeParts(d.hp), buffDef: 0, stunned: false, bleeding: false, bossPhase: 1, maxHp: d.hp });
  } else if (isBoss10) {
    const d = EDEFS.colossus;
    enemies.push({ ...JSON.parse(JSON.stringify(d)), eid: `colossus_${floor}`, x: sx, y: Math.max(1, sy - 2), parts: makeParts(d.hp), buffDef: 0, stunned: false, bleeding: false, bossPhase: 1, maxHp: d.hp });
  } else {
    const tableIdx = floor <= 4 ? floor - 1 : Math.min(floor - 5, FTABLES.length - 1);
    const pool = FTABLES[Math.min(tableIdx, FTABLES.length - 1)];
    rooms.slice(1, -1).forEach((room, i) => {
      if (!flip(.82)) return;
      const type = pool[rng(0, pool.length - 1)];
      const d = EDEFS[type]; if (!d) return;
      enemies.push({ ...JSON.parse(JSON.stringify(d)), type, eid: `${type}_${i}_${floor}`, x: ~~(room.x + room.w / 2), y: ~~(room.y + room.h / 2), parts: makeParts(d.hp), buffDef: 0, stunned: false, bleeding: false, maxHp: d.hp });
    });
    if (floor >= 4 && flip(.35)) {
      const rm = rooms[rng(1, rooms.length - 2)];
      const d = EDEFS.mimic;
      enemies.push({ ...JSON.parse(JSON.stringify(d)), type: "mimic", eid: `mimic_${floor}`, x: rm.x + 1, y: rm.y + 1, parts: makeParts(d.hp), buffDef: 0, stunned: false, bleeding: false, maxHp: d.hp, disguised: true });
    }
  }

  const gi = [];
  const base = floor < 3 ? ["torch", "meat", "herbs", "potion", "rawmeat", "bandage", "bone", "dark_cloth"]
    : floor < 6 ? ["potion", "greatpot", "herbs", "wine", "antidote", "torch_lg", "oil_flask", "iron_scrap", "soul_ember"]
      : ["greatpot", "oil_flask", "soul_ember", "iron_scrap", "ration", "smoke_bomb", "frost_vial"];
  rooms.slice(1).forEach((room, i) => { if (!flip(.55)) return; gi.push({ gid: `gi_${i}_${floor}`, iid: base[rng(0, base.length - 1)], x: room.x + 1 + rng(0, Math.max(0, room.w - 3)), y: room.y + 1 + rng(0, Math.max(0, room.h - 3)) }); });
  if (floor >= 2 && flip(.45)) { const wpns = floor <= 3 ? ["spear", "club"] : floor <= 6 ? ["flail", "war_axe"] : ["fine_sword", "war_axe", "cursed_blade"]; const rm = rooms[rng(1, Math.max(1, rooms.length - 2))]; gi.push({ gid: `wpn_${floor}`, iid: wpns[rng(0, wpns.length - 1)], x: rm.x + 1, y: rm.y + 1 }); }
  if (floor >= 2 && flip(.38)) { const arms = floor <= 3 ? ["leather", "robes"] : floor <= 6 ? ["chain", "helmet"] : ["plate", "dark_plate", "crown"]; const rm = rooms[rng(1, Math.max(1, rooms.length - 2))]; gi.push({ gid: `arm_${floor}`, iid: arms[rng(0, arms.length - 1)], x: rm.x + 2, y: rm.y + 1 }); }
  if (floor >= 3) { rooms.slice(2).forEach((r, i) => { if (!flip(.3)) return; const mats = ["bone", "dark_cloth", "iron_scrap", "venom_gland", "soul_ember"]; gi.push({ gid: `mat_${i}_${floor}`, iid: mats[rng(0, mats.length - 1)], x: r.x + rng(1, r.w - 2), y: r.y + rng(1, r.h - 2) }); }); }

  const traps = [];
  if (floor >= 3) {
    const trapTypes = Object.keys(TRAP_TYPES);
    rooms.slice(2, -1).forEach((room, i) => {
      if (!flip(.3 + floor * 0.03)) return;
      traps.push({ tid: `trap_${i}_${floor}`, type: trapTypes[rng(0, trapTypes.length - 1)], x: room.x + rng(1, room.w - 2), y: room.y + rng(1, room.h - 2), triggered: false, revealed: false });
    });
  }

  const npcs = [];
  Object.values(NPC_DEFS).forEach(def => {
    if (def.floors.includes(floor) && flip(.6)) {
      const rm = rooms[rng(1, Math.max(1, rooms.length - 2))];
      npcs.push({ ...def, x: rm.x + 2, y: rm.y + 2, nid: `npc_${def.id}_${floor}` });
    }
  });

  const events = [];
  const ets = Object.keys(EV_DEF);
  rooms.slice(1, -1).forEach((room, i) => { if (!flip(.45)) return; events.push({ eid: `ev_${i}_${floor}`, type: ets[rng(0, ets.length - 1)], x: room.x + rng(1, room.w - 2), y: room.y + rng(1, room.h - 2), done: false }); });

  return { map, rooms, spawn, enemies, gi, events, npcs, traps, stair: { x: sx, y: sy }, isBoss: isBoss5 || isBoss10 };
}

export function computeFOV(map, px, py, r) {
  const vis = new Set(); const rays = Math.ceil(r * Math.PI * 4);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2; let rx = px, ry = py; const dx = Math.cos(a) * .5, dy = Math.sin(a) * .5;
    for (let s = 0; s <= r * 2; s++) { const tx = Math.round(rx), ty = Math.round(ry); if (tx < 0 || tx >= MW || ty < 0 || ty >= MH) break; vis.add(`${tx},${ty}`); if (map[ty][tx] === T.W) break; rx += dx; ry += dy; }
  }
  return vis;
}

export function pAttack(player, enemy, part, sfx) {
  const msgs = []; const ne = JSON.parse(JSON.stringify(enemy)); let np = { ...player, statuses: [...player.statuses] };
  if (hasSt(np, "STUNNED")) { np.statuses = np.statuses.filter(s => s.type !== "STUNNED"); return { msgs: ["You are stunned! Attack fails."], ne, np, dead: false, sever: false }; }
  if (hasSt(np, "FROZEN")) { np.statuses = np.statuses.filter(s => s.type !== "FROZEN"); return { msgs: ["Frozen! You break free but can't strike."], ne, np, dead: false, sever: false }; }
  const props = player.weapon ? ITEMS[player.weapon]?.props || {} : {};
  const isWeak = hasSt(np, "WEAKENED");
  const hitP = Math.min(.95, .70 + (np.agi - (ne.agi || 4)) * .03 + (props.acc || 0));
  if (!flip(hitP)) { if(sfx) sfx.miss(); return { msgs: [`You swing at the ${ne.name}'s ${PLAB[part]}... and miss!`], ne, np, dead: false, sever: false }; }
  const isCrit = flip(props.crit || 0); const critM = isCrit ? props.critM || 1.5 : 1;
  const backstabM = np.backstabReady ? (np.backstabReady = false, 3) : 1;
  const studyM = np.studyBonus || 1; np.studyBonus = 1;
  const weakM = isWeak ? .5 : 1; const eDef = Math.max(0, (ne.def + (ne.buffDef || 0)) - (props.defPen || 0));
  let dmg = Math.max(1, Math.floor(getAtk(np) * PMUL[part] * critM * backstabM * studyM * weakM - eDef + rng(-2, 3)));
  if (props.holyDmg && ["skele", "wraith", "revenant", "banshee"].includes(ne.type)) dmg += props.holyDmg;
  ne.hp = Math.max(0, ne.hp - dmg); ne.parts[part].hp = Math.max(0, ne.parts[part].hp - dmg);
  if(sfx) { if(isCrit) sfx.crit(); else sfx.hit(); }
  msgs.push(isCrit ? `✦ Critical! ${ne.name}'s ${PLAB[part]} — ${dmg} damage!` : `You strike ${ne.name}'s ${PLAB[part]} for ${dmg} damage!`);
  let sever = false;
  if (!ne.parts[part].severed && ne.parts[part].hp === 0) { ne.parts[part].severed = true; sever = true; msgs.push(`The ${PLAB[part]} is severed!`); np.fear = Math.min(100, np.fear + 8); if(sfx) sfx.sever(); }
  if (props.bleed && flip(props.bleed) && !ne.bleeding) { ne.bleeding = true; msgs.push("The wound bleeds."); }
  if (props.stun && flip(props.stun)) { ne.stunned = true; msgs.push(`The blow stuns the ${ne.name}!`); }
  if (props.burn && flip(props.burn)) { np.statuses = [...np.statuses.filter(s => s.type !== "BURNING"), { type: "BURNING", dur: 4 }]; msgs.push("Fire spreads!"); }
  if (props.poison && flip(props.poison)) { ne.poisoned = true; msgs.push("Venom courses through the enemy."); }
  if (props.selfCurse && !hasSt(np, "CURSED") && flip(.15)) { np.statuses.push({ type: "CURSED", dur: -1 }); msgs.push("The blade whispers your name..."); }
  if (ne.hp <= 0) { msgs.push(`The ${ne.name} falls. Silence.`); }
  return { msgs, ne, np, dead: ne.hp <= 0, sever, dmg, isCrit };
}

export function eAttack(enemy, player, sfx) {
  const msgs = []; const np = { ...player, statuses: [...player.statuses], parts: JSON.parse(JSON.stringify(player.parts)) };
  let ne = JSON.parse(JSON.stringify(enemy));
  if (ne.stunned) { ne.stunned = false; return { msgs: [`${ne.name} is stunned and cannot attack!`], np, ne }; }
  if (ne.poisoned) { ne.hp = Math.max(0, ne.hp - 3); msgs.push(`${ne.name} suffers from poison. (-3 HP)`); }
  const tgt = Object.keys(PMUL)[rng(0, 5)];
  if (!flip(.65)) { if(sfx) sfx.miss(); return { msgs: [...msgs, `${ne.name} lunges — and misses!`], np, ne }; }
  const finalDmg = np.guarding ? Math.max(1, Math.floor((Math.max(1, Math.floor(enemy.atk * PMUL[tgt] - getDef(player) + rng(-2, 3)))) * .25)) : Math.max(1, Math.floor(enemy.atk * PMUL[tgt] - getDef(player) + rng(-2, 3)));
  if (np.guarding) { msgs.push("Your guard holds!"); np.guarding = false; }
  np.hp = Math.max(0, np.hp - finalDmg); np.parts[tgt].hp = Math.max(0, np.parts[tgt].hp - finalDmg);
  if(sfx) sfx.hit();
  msgs.push(`${enemy.name} tears into your ${PLAB[tgt]} for ${finalDmg} damage!`);
  if (!np.parts[tgt].severed && np.parts[tgt].hp === 0) { np.parts[tgt].severed = true; np.fear = Math.min(100, np.fear + 20); np.statuses = [...np.statuses, { type: "BLEEDING", dur: -1 }]; msgs.push(`Your ${PLAB[tgt]} is severed!`); if(sfx) sfx.sever(); }
  return { msgs, np, ne, dmg: finalDmg, tgt };
}

export function eSpecial(enemy, player) {
  if (!enemy.sp || !flip(enemy.sp.t)) return null;
  const r = enemy.sp.fn(enemy, player); const msgs = [`[${enemy.sp.n}] ${r.msg}`];
  const np = { ...player, statuses: [...player.statuses], parts: JSON.parse(JSON.stringify(player.parts)) };
  let ne = JSON.parse(JSON.stringify(enemy));
  if (r.dmg > 0) {
    const tgt = r.tgt || "torso"; const def = getDef(player);
    const dmg = r.guaranteed ? r.dmg : Math.max(1, r.dmg - def + rng(-1, 2));
    np.hp = Math.max(0, np.hp - dmg); if (np.parts[tgt]) np.parts[tgt].hp = Math.max(0, np.parts[tgt].hp - dmg);
    if (np.parts[tgt] && !np.parts[tgt].severed && np.parts[tgt].hp === 0) { np.parts[tgt].severed = true; np.fear = Math.min(100, np.fear + 20); np.statuses = [...np.statuses, { type: "BLEEDING", dur: -1 }]; msgs.push(`Your ${PLAB[tgt]} is severed!`); }
  }
  if (r.fearDmg) np.fear = Math.min(100, np.fear + r.fearDmg);
  if (r.stun) np.statuses = [...np.statuses, { type: "STUNNED", dur: 1 }];
  if (r.poison) np.statuses = [...np.statuses.filter(s => s.type !== "POISONED"), { type: "POISONED", dur: 14 }];
  if (r.burn) np.statuses = [...np.statuses.filter(s => s.type !== "BURNING"), { type: "BURNING", dur: 5 }];
  if (r.freeze) np.statuses = [...np.statuses.filter(s => s.type !== "FROZEN"), { type: "FROZEN", dur: 3 }];
  if (r.weaken) np.statuses = [...np.statuses, { type: "WEAKENED", dur: 3 }];
  if (r.fortify) ne.buffDef = (ne.buffDef || 0) + 4;
  if (ne.boss && ne.hp < (ne.maxHp || ne.hp) * .5 && ne.bossPhase === 1) { ne.bossPhase = 2; ne.atk += 6; msgs.push("⚡ Something SHIFTS. It grows stronger."); }
  return { msgs, np, ne };
}

export function doAbl(player, enemy, abl) {
  const msgs = []; let np = { ...player, statuses: [...player.statuses] };
  if (abl === "guard") { np.guarding = true; msgs.push("You brace. Next hit reduced by 75%."); }
  if (abl === "backstab") { np.backstabReady = true; msgs.push("You prepare a devastating backstab..."); }
  if (abl === "study") { np.studyBonus = 2; msgs.push(`You study the ${enemy.name}. Next hit does 2× damage.`); }
  if (abl === "endure") { np.hp = Math.min(np.maxHp, np.hp + 20); msgs.push("Second Wind! +20 HP."); }
  np.abilityCD = ABLS[abl].cd === -1 ? 9999 : ABLS[abl].cd * 2;
  return { msgs, np };
}

export function canCraft(recipe, inv) {
  return recipe.ingredients.every(ing => {
    const count = inv.filter(i => i.iid === ing.id).length;
    return count >= ing.qty;
  });
}

export function doCraftItem(recipe, inv) {
  const newInv = [...inv];
  recipe.ingredients.forEach(ing => {
    for (let i = 0; i < ing.qty; i++) {
      const idx = newInv.findIndex(it => it.iid === ing.id);
      if (idx >= 0) newInv.splice(idx, 1);
    }
  });
  newInv.push({ uid: uid(), iid: recipe.result });
  return newInv;
}

export function makePlayer(cls) {
  const c = CLS[cls];
  return {
    x: 0, y: 0, cls, name: c.name, hp: c.hp, maxHp: c.hp, atk: c.atk, def: c.def, agi: c.agi,
    hunger: c.hunger, fear: c.fear, torch: c.torch, parts: makeParts(c.hp), statuses: [],
    floor: 1, steps: 0, xp: 0, level: 1, kills: 0, weapon: c.items.find(id => ITEMS[id]?.type === "WEAPON") || null,
    armor: null, helmet: null, abilityCD: 0, guarding: false, backstabReady: false, studyBonus: 1,
    inv: c.items.map(id => ({ uid: uid(), iid: id })),
    quests: { blackGem: 0, wardenOrigin: 0, colossus: 0 },
    journal: { lore: [1], bestiary: [], quests: ["blackGem"] }
  };
}
