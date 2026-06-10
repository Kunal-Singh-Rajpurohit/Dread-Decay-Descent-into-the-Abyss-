import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MW, MH, TS, T, TR_FULL, TR_DIM, TR_DARK, PMUL, PLAB, XP_LV, SCOL, MAX_FLOOR } from './game/constants.js';
import { ITEMS, RECIPES, CLS, ABLS, EDEFS, FTABLES, TRAP_TYPES, NPC_DEFS, LORE, QUESTS, EV_DEF } from './game/data.js';
import { rng, flip, uid, makeParts, getTR, getLv, getAtk, getDef, hasSt, survivalTick, genDungeon, computeFOV, pAttack, eAttack, eSpecial, doAbl, canCraft, doCraftItem, makePlayer } from './game/engine.js';
import { drawFrame } from './game/renderer.js';
import { ParticleSystem } from './game/particles.js';
import { SoundEngine, MusicEngine } from './game/audio.js';
import { AchievementTracker, ACHIEVEMENTS } from './game/achievements.js';
import { Bar, SidePanel, CombatUI, InvUI, JournalUI, EventModal, DialogueUI, LevelUpModal, DPad } from './game/ui.jsx';
import { socket } from './game/socket.js';

// Instantiate engines
const sfx = new SoundEngine();
const music = new MusicEngine(sfx);
const achievements = new AchievementTracker();
const pSystem = new ParticleSystem();

export default function App() {
  const [screen, setScreen] = useState("MENU");
  const [selCls, setSelCls] = useState("soldier");
  const [dng, setDng] = useState(null);
  const [player, setPlayer] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [gi, setGi] = useState([]);
  const [events, setEvents] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [traps, setTraps] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [combat, setCombat] = useState(null);
  const [showInv, setShowInv] = useState(false);
  const [showJrnl, setShowJrnl] = useState(false);
  const [evMod, setEvMod] = useState(null);
  const [lvMod, setLvMod] = useState(null);
  const [diagMod, setDiagMod] = useState(null);
  const [fov, setFov] = useState(new Set());
  const [seen, setSeen] = useState(new Set());
  const [floor, setFloor] = useState(1);
  const [shake, setShake] = useState(0);
  const [dNums, setDNums] = useState([]);
  
  // Frame counter for React (only for some UI updates, canvas loop is separate)
  const [frame, setFrame] = useState(0);

  const canvasRef = useRef(null);
  const otherPlayersRef = useRef({});
  const stateRef = useRef({ map:[], player:null, enemies:[], gi:[], events:[], npcs:[], traps:[], fov:new Set(), seen:new Set(), shake:0, dNums:[], particles:[], otherPlayers:[], t:0 });

  // Setup Socket listeners
  useEffect(() => {
    socket.connect();
    socket.on("player-moved", (data) => {
      otherPlayersRef.current[data.id] = data;
    });
    socket.on("player-left", (data) => {
      delete otherPlayersRef.current[data.id];
    });
    return () => {
      socket.disconnect();
      socket.off("player-moved");
      socket.off("player-left");
    };
  }, []);

  // Update state ref for renderer
  useEffect(() => {
    stateRef.current = {
      map: dng?.map || [], player, enemies, gi, events, npcs, traps, fov, seen, shake, dNums, particles: pSystem.particles, otherPlayers: Object.values(otherPlayersRef.current), t: frame
    };
  }, [dng, player, enemies, gi, events, npcs, traps, fov, seen, shake, dNums, frame]);

  // Main Render Loop
  useEffect(() => {
    if (screen !== "GAME") return;
    let req;
    const loop = () => {
      if (canvasRef.current && stateRef.current.map.length > 0) {
        stateRef.current.t++;
        setFrame(stateRef.current.t);
        if (stateRef.current.player && stateRef.current.player.torch > 0 && Math.random() < 0.12) {
          pSystem.emit('torch', stateRef.current.player.x, stateRef.current.player.y - 0.2);
        }
        pSystem.update();
        setDNums(prev => prev.map(d => ({ ...d, cy: d.cy - 0.5, frame: d.frame + 1 })).filter(d => d.frame < 40));
        if (stateRef.current.shake > 0) {
          stateRef.current.shake = Math.max(0, stateRef.current.shake - 0.5);
          setShake(stateRef.current.shake);
        }
        drawFrame(canvasRef.current, stateRef.current);
      }
      req = requestAnimationFrame(loop);
    };
    req = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(req);
  }, [screen]);

  const log = useCallback((...m) => setMsgs(p => [...p.slice(-(10 - m.length)), ...m]), []);

  const addDNum = (x, y, val, color, crit) => {
    const cx = x * TS + TS / 2 + rng(-10, 10);
    const cy = y * TS + TS / 2 + rng(-10, 10);
    setDNums(prev => [...prev, { cx, cy, value: val, color, crit, frame: 0 }]);
  };

  const triggerShake = (intensity) => setShake(intensity);

  function startGame(cls) {
    sfx.init(); 
    music.start();
    const d = genDungeon(1), p = makePlayer(cls); p.x = d.spawn.x; p.y = d.spawn.y;
    const v = computeFOV(d.map, p.x, p.y, getTR(p));
    setDng(d); setPlayer(p); setEnemies(d.enemies); setGi(d.gi); setEvents(d.events); setNpcs(d.npcs); setTraps(d.traps || []);
    setFov(v); setSeen(v); setFloor(1); setCombat(null); setShowInv(false); setShowJrnl(false); setEvMod(null); setLvMod(null); setDiagMod(null);
    setMsgs(["You descend into the dungeon.", "The torch flickers.", "Something stirs in the dark."]);
    setScreen("GAME");
    music.setFloor(1);
    otherPlayersRef.current = {};
    socket.emit("join-floor", 1);
    socket.emit("player-move", { floor: 1, x: p.x, y: p.y, cls: p.cls });
  }

  function applyLvUp(k) {
    sfx.levelUp();
    pSystem.emit('levelup', player.x, player.y);
    setPlayer(p => {
      const np = { ...p, statuses: [...p.statuses] };
      if (k === "hp") { np.maxHp += 10; np.hp = Math.min(np.maxHp, np.hp + 10); }
      if (k === "atk") np.atk += 2;
      if (k === "def") np.def += 2;
      if (k === "agi") np.agi += 2;
      if (k === "clear") np.statuses = [];
      if (k === "cd") np.abilityCD = Math.max(0, np.abilityCD - 2);
      return np;
    });
    log(`Level ${lvMod}! Boon applied.`); setLvMod(null);
  }

  const doMove = useCallback((dx, dy) => {
    if (!player || !dng || combat || showInv || showJrnl || evMod || lvMod || diagMod) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (nx < 0 || nx >= MW || ny < 0 || ny >= MH || dng.map[ny][nx] === T.W) return;
    
    socket.emit("player-move", { floor: floor, x: nx, y: ny, cls: player.cls });
    
    const en = enemies.find(e => e.x === nx && e.y === ny);
    if (en) {
      if (en.disguised) log("The chest springs to life!");
      setPlayer(p => {
        const np = { ...p, fear: Math.min(100, p.fear + en.fear), journal: { ...p.journal, bestiary: p.journal.bestiary.includes(en.name) ? p.journal.bestiary : [...p.journal.bestiary, en.name] } };
        return np;
      });
      setCombat({ enemy: JSON.parse(JSON.stringify({ ...en, disguised: false })), part: "torso", ablUsed: false });
      if (en.boss) { sfx.boss(); music.enterBoss(); triggerShake(8); } else { music.enterCombat(); }
      log(`${en.boss ? "⚡ " : ""}The ${en.name} ${en.boss ? "rises before you." : "confronts you."}`);
      return;
    }
    const npc = npcs.find(n => n.x === nx && n.y === ny);
    if (npc) { setDiagMod({ npc, node: npc.dialogue.start }); sfx.npc(); return; }
    let np = { ...player, x: nx, y: ny, steps: player.steps + 1 };
    sfx.step();
    pSystem.emit('dust', player.x, player.y);
    
    // Check traps
    const trap = traps.find(t => t.x === nx && t.y === ny && !t.triggered);
    if (trap) {
      const td = TRAP_TYPES[trap.type];
      sfx.trap();
      triggerShake(4);
      setTraps(prev => prev.map(t => t.tid === trap.tid ? { ...t, triggered: true, revealed: true } : t));
      log(`[TRAP] ${td.msg}`);
      if (td.dmg > 0) { np.hp = Math.max(0, np.hp - td.dmg); if (td.tgt && np.parts) np.parts[td.tgt].hp = Math.max(0, np.parts[td.tgt].hp - td.dmg); addDNum(nx, ny, td.dmg, '#ef4444', false); }
      if (td.fearDmg) np.fear = Math.min(100, np.fear + td.fearDmg);
      if (td.effect) np.statuses = [...(np.statuses || []), { type: td.effect, dur: 14 }];
      if (td.teleport) {
        const rooms = dng.rooms; const rm = rooms[rng(0, rooms.length - 1)];
        np.x = ~~(rm.x + rm.w / 2); np.y = ~~(rm.y + rm.h / 2);
      }
    }
    // Reveal nearby traps with high agility
    if (np.agi >= 7) {
      setTraps(prev => prev.map(t => {
        if (t.revealed || t.triggered) return t;
        if (Math.abs(t.x - nx) <= 1 && Math.abs(t.y - ny) <= 1) return { ...t, revealed: true };
        return t;
      }));
    }
    // Stairs
    if (dng.map[ny][nx] === T.S) {
      const nfl = floor + 1;
      if (nfl > MAX_FLOOR) { log("You emerge from the darkness. Sunlight. Freedom."); setTimeout(() => setScreen("WIN_ESCAPE"), 2000); setPlayer(np); return; }
      const nd = genDungeon(nfl); np.x = nd.spawn.x; np.y = nd.spawn.y; np.floor = nfl;
      sfx.descend(); music.setFloor(nfl);
      const nv = computeFOV(nd.map, np.x, np.y, getTR(np));
      setDng(nd); setEnemies(nd.enemies); setGi(nd.gi); setEvents(nd.events); setNpcs(nd.npcs); setTraps(nd.traps || []); setFov(nv); setSeen(nv); setFloor(nfl);
      const { p: sp, msgs: tm } = survivalTick(np); if (tm.length) log(...tm); setPlayer(sp);
      log(`Floor ${nfl}.${nfl === 5 ? " ⚡ The Warden waits." : nfl === 10 ? " ⚡⚡ The Colossus stirs." : " Deeper. Worse."}`);
      if (nfl >= 6 && !np.journal.lore.includes(4)) { np.journal.lore.push(4); log("New lore discovered."); }
      if (nfl === 10 && !np.journal.quests.includes("colossus")) { np.journal.quests.push("colossus"); }
      achievements.check('floor', { floor: nfl });
      socket.emit("join-floor", nfl);
      socket.emit("player-move", { floor: nfl, x: np.x, y: np.y, cls: np.cls });
      return;
    }
    const { p: sp, msgs: tm } = survivalTick(np); if (tm.length) log(...tm);
    if (sp.hp <= 0) { sfx.death(); setPlayer(sp); log("You collapse...", "The dungeon claims another soul."); setScreen("DEAD"); return; }
    if (sp.fear >= 100) { sfx.death(); setPlayer(sp); log("Your mind shatters.", "You are no longer yourself."); setScreen("MADNESS"); return; }
    const ev = events.find(e => e.x === nx && e.y === ny && !e.done); if (ev) { sfx.event(); setEvMod(ev); }
    const nv = computeFOV(dng.map, nx, ny, getTR(sp)); setFov(nv); setSeen(prev => { const s = new Set(prev); nv.forEach(k => s.add(k)); return s; });
    setEnemies(prev => prev.map(e => {
      const dist = Math.abs(e.x - nx) + Math.abs(e.y - ny); if (dist > 8) return e;
      const sdx = Math.sign(nx - e.x), sdy = Math.sign(ny - e.y);
      const ok = (tx, ty) => tx >= 0 && tx < MW && ty >= 0 && ty < MH && dng.map[ty]?.[tx] !== T.W && !prev.some(o => o.x === tx && o.y === ty && o.eid !== e.eid) && !(tx === nx && ty === ny);
      if (Math.abs(nx - e.x) >= Math.abs(ny - e.y)) { if (sdx && ok(e.x + sdx, e.y)) return { ...e, x: e.x + sdx }; if (sdy && ok(e.x, e.y + sdy)) return { ...e, y: e.y + sdy }; }
      else { if (sdy && ok(e.x, e.y + sdy)) return { ...e, y: e.y + sdy }; if (sdx && ok(e.x + sdx, e.y)) return { ...e, x: e.x + sdx }; }
      return e;
    }));
    setPlayer(sp);
    achievements.check('survive', { hunger: sp.hunger, floor: floor, fear: sp.fear });
  }, [player, dng, enemies, npcs, traps, combat, showInv, showJrnl, evMod, lvMod, diagMod, events, floor, log]);

  const doPickup = useCallback(() => {
    if (!player || !dng || combat || showInv || showJrnl || evMod || lvMod || diagMod) return;
    const itm = gi.find(g => g.x === player.x && g.y === player.y);
    if (itm) { 
      sfx.pickup(); 
      setPlayer(p => {
        const np = { ...p, inv: [...p.inv, { uid: uid(), iid: itm.iid }] };
        achievements.check('inventory', { count: np.inv.length });
        return np;
      }); 
      setGi(prev => prev.filter(g => g.gid !== itm.gid)); 
      log(`Picked up: ${ITEMS[itm.iid]?.name}.`); 
    }
    else log("You wait...");
  }, [player, dng, combat, showInv, showJrnl, evMod, lvMod, diagMod, gi, log]);

  useEffect(() => {
    const K = e => {
      if (screen !== "GAME") return;
      if (lvMod || evMod || diagMod) return;
      if (showInv) { if (e.key === "Escape" || e.key === "i" || e.key === "I") setShowInv(false); return; }
      if (showJrnl) { if (e.key === "Escape" || e.key === "j" || e.key === "J") setShowJrnl(false); return; }
      if (combat) {
        if (e.key === "q" || e.key === "Q") { doCombatAbility(); return; }
        return;
      }
      const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
      if (dirs[e.key]) { e.preventDefault(); doMove(...dirs[e.key]); return; }
      if (e.key === "i" || e.key === "I") { setShowInv(true); return; }
      if (e.key === "j" || e.key === "J") { setShowJrnl(true); return; }
      if (e.key === "." || e.key === "z" || e.key === "Z") doPickup();
    };
    window.addEventListener("keydown", K); return () => window.removeEventListener("keydown", K);
  }, [screen, doMove, doPickup, combat, showInv, showJrnl, evMod, lvMod, diagMod]);

  function doCombat(action) {
    if (!combat || !player) return;
    if (action === "ATTACK") {
      const { msgs: am, ne, np, dead, sever, dmg, isCrit } = pAttack(player, combat.enemy, combat.part, sfx); log(...am);
      if(dmg > 0) {
        addDNum(combat.enemy.x, combat.enemy.y, dmg, isCrit ? '#fbbf24' : '#ef4444', isCrit);
        pSystem.emit(isCrit ? 'crit' : 'blood', combat.enemy.x, combat.enemy.y);
        triggerShake(isCrit ? 4 : 2);
      }
      if (sever) achievements.check('sever');

      if (dead) {
        setEnemies(prev => prev.filter(e => e.eid !== combat.enemy.eid));
        pSystem.emit('death', combat.enemy.x, combat.enemy.y);
        const drops = (combat.enemy.loot || []).filter(l => flip(l.c)).map(l => ({ gid: `d_${uid()}`, iid: l.id, x: combat.enemy.x, y: combat.enemy.y }));
        if (drops.length) { setGi(prev => [...prev, ...drops]); log(...drops.map(d => `${ITEMS[d.iid]?.name} left behind.`)); }
        const xpGain = combat.enemy.xp || 0, newXp = (np.xp || 0) + xpGain, lvBefore = getLv(np.xp), lvAfter = getLv(newXp);
        log(`+${xpGain} XP.`);
        setPlayer(p => ({ ...p, ...np, xp: newXp, kills: (p.kills || 0) + 1, fear: sever ? Math.min(100, np.fear + 8) : np.fear }));
        achievements.check('kill');
        if (lvAfter > lvBefore) setTimeout(() => setLvMod(lvAfter), 400);
        setCombat(null);
        music.exitCombat();
        if (combat.enemy.boss) {
          achievements.check('boss_kill', { boss: combat.enemy.type });
          if (combat.enemy.type === "colossus" || combat.enemy.eid?.includes("colossus")) {
            log("⚡⚡ The Colossus crumbles.", "The deep gate opens. Light pours in.");
            setTimeout(() => setScreen("WIN_TRUE"), 2000);
          } else {
            log("⚡ The Warden falls.", "The dungeon shudders.");
            setTimeout(() => setScreen("WIN"), 2000);
          }
        }
        return;
      }
      const spec = eSpecial(ne, np);
      if (spec) { 
        log(...spec.msgs); 
        if (spec.np.hp <= 0) { sfx.death(); setPlayer(spec.np); setCombat(null); setScreen("DEAD"); return; } 
        if (spec.np.fear >= 100) { sfx.death(); setPlayer(spec.np); setCombat(null); setScreen("MADNESS"); return; } 
        setPlayer(spec.np); setCombat(prev => ({ ...prev, enemy: spec.ne })); 
        triggerShake(5);
        return; 
      }
      const { msgs: em, np: np2, ne: ne2, dmg: edmg } = eAttack(ne, np, sfx); log(...em);
      if (edmg > 0) {
        addDNum(player.x, player.y, edmg, '#dc2626', false);
        pSystem.emit('blood', player.x, player.y);
        triggerShake(3);
      }
      if (np2.hp <= 0) { sfx.death(); setPlayer(np2); setCombat(null); log(`The ${ne.name} kills you.`); setScreen("DEAD"); return; }
      if (np2.fear >= 100) { sfx.death(); setPlayer(np2); setCombat(null); setScreen("MADNESS"); return; }
      setPlayer(np2); setCombat(prev => ({ ...prev, enemy: ne2 }));
    }
    if (action === "FLEE") {
      const smokeBomb = player.inv.find(i => ITEMS[i.iid]?.eff?.flee);
      if (smokeBomb) {
        setPlayer(p => ({ ...p, inv: p.inv.filter(i => i.uid !== smokeBomb.uid) }));
        log("Smoke fills the air! You vanish!"); setCombat(null); music.exitCombat(); return;
      }
      if (flip(.45)) { log("You break away and run!"); setCombat(null); music.exitCombat(); }
      else { 
        log("No escape!"); 
        const { msgs: em, np, ne, dmg: edmg } = eAttack(combat.enemy, player, sfx); log(...em); 
        if(edmg > 0) {
          addDNum(player.x, player.y, edmg, '#dc2626', false);
          pSystem.emit('blood', player.x, player.y);
          triggerShake(3);
        }
        if (np.hp <= 0) { sfx.death(); setPlayer(np); setCombat(null); setScreen("DEAD"); return; } 
        if (np.fear >= 100) { sfx.death(); setPlayer(np); setCombat(null); setScreen("MADNESS"); return; } 
        setPlayer(np); setCombat(prev => ({ ...prev, enemy: ne })); 
      }
    }
  }

  function doCombatAbility() {
    if (!combat || !player) return;
    const abl = CLS[player.cls]?.ability; if (!abl || player.abilityCD > 0 || combat.ablUsed) return;
    const { msgs: am, np } = doAbl(player, combat.enemy, abl); log(...am);
    const spec = eSpecial(combat.enemy, np);
    if (spec) { 
      log(...spec.msgs); 
      if (spec.np.hp <= 0) { sfx.death(); setPlayer(spec.np); setCombat(null); setScreen("DEAD"); return; } 
      setPlayer(spec.np); setCombat(prev => ({ ...prev, enemy: spec.ne, ablUsed: true })); 
      triggerShake(3);
      return; 
    }
    const { msgs: em, np: np2, ne, dmg: edmg } = eAttack(combat.enemy, np, sfx); log(...em);
    if (edmg > 0) {
      addDNum(player.x, player.y, edmg, '#dc2626', false);
      pSystem.emit('blood', player.x, player.y);
      triggerShake(3);
    }
    if (np2.hp <= 0) { sfx.death(); setPlayer(np2); setCombat(null); setScreen("DEAD"); return; }
    setPlayer(np2); setCombat(prev => ({ ...prev, enemy: ne, ablUsed: abl === "backstab" ? true : prev.ablUsed }));
  }

  function doUseItem(iuid) {
    const ii = player?.inv.find(i => i.uid === iuid); const def = ii && ITEMS[ii.iid]; if (!def) return;
    if (!def.eff) { log(`${def.name}: "${def.desc}"`); return; }
    const np = { ...player, parts: JSON.parse(JSON.stringify(player.parts)), statuses: [...player.statuses] };
    const tm = [], e = def.eff;
    if (e.hp) { np.hp = Math.min(np.maxHp, np.hp + e.hp); tm.push(`Healed ${e.hp} HP.`); sfx.heal(); pSystem.emit('heal', player.x, player.y); }
    if (e.hunger) { np.hunger = Math.min(100, np.hunger + e.hunger); tm.push("Hunger eased."); }
    if (e.torch) { np.torch = Math.min(600, np.torch + e.torch); tm.push("The light holds."); }
    if (e.fear != null) { np.fear = Math.max(0, Math.min(100, np.fear + e.fear)); tm.push(e.fear < 0 ? "Fear subsides." : "Nausea washes over you."); if(e.fear>0) sfx.fear(); }
    if (e.cureBleed) { np.statuses = np.statuses.filter(s => s.type !== "BLEEDING"); tm.push("The bleeding stops."); }
    if (e.curePoison) { np.statuses = np.statuses.filter(s => s.type !== "POISONED"); tm.push("Poison cleared."); }
    if (e.cureCurse) { np.statuses = np.statuses.filter(s => s.type !== "CURSED"); tm.push("The curse lifts."); }
    if (e.freezeEnemy && combat) {
      setCombat(prev => { const ne = { ...prev.enemy, stunned: true }; return { ...prev, enemy: ne }; });
      tm.push("The enemy freezes!");
    }
    np.inv = np.inv.filter(i => i.uid !== iuid); log(...tm); setPlayer(np);
  }

  function doEquip(iuid, type) {
    const ii = player?.inv.find(i => i.uid === iuid); if (!ii) return;
    setPlayer(p => {
      const np = { ...p };
      if (type === "WEAPON") {
        if (np.weapon === ii.iid) { np.weapon = null; log(`Unequipped: ${ITEMS[ii.iid]?.name}.`); }
        else { np.weapon = ii.iid; log(`Equipped: ${ITEMS[ii.iid]?.name}.`); }
      }
      else if (type === "ARMOR") {
        if (np.armor === ii.iid) { np.armor = null; log(`Unequipped: ${ITEMS[ii.iid]?.name}.`); }
        else { np.armor = ii.iid; log(`Equipped: ${ITEMS[ii.iid]?.name}.`); }
      }
      else if (type === "HELMET") {
        if (np.helmet === ii.iid) { np.helmet = null; log(`Unequipped: ${ITEMS[ii.iid]?.name}.`); }
        else { np.helmet = ii.iid; log(`Equipped: ${ITEMS[ii.iid]?.name}.`); }
      }
      return np;
    });
  }

  function doCraftAction(recipeIdx) {
    const recipe = RECIPES[recipeIdx]; if (!recipe || !player) return;
    if (!canCraft(recipe, player.inv)) { log("Not enough materials."); return; }
    sfx.craft();
    const newInv = doCraftItem(recipe, player.inv);
    setPlayer(p => {
      const np = { ...p, inv: newInv };
      achievements.check('craft');
      return np;
    });
    log(`Crafted: ${recipe.name}!`);
  }

  function doEventChoice(choiceIdx, event) {
    const evDef = EV_DEF[event.type]; if (!evDef) return;
    const choice = evDef.choices[choiceIdx]; if (!choice) return;
    if (choice.req && !choice.req(player)) { log("Nothing happens."); return; }
    const dropPool = ["herbs", "bandage", "bread", "antidote", "potion", "bone", "dark_cloth"];
    const result = choice.fn({ ...player, statuses: [...player.statuses] }, dropPool[rng(0, dropPool.length - 1)]);
    let newPlayer, msg, dropIid;
    if (Array.isArray(result)) { [newPlayer, msg, dropIid] = result; }
    else { newPlayer = result; msg = ""; }
    if (msg) log(msg);
    if (dropIid && typeof dropIid === "string" && ITEMS[dropIid]) {
      setGi(prev => [...prev, { gid: `ev_drop_${uid()}`, iid: dropIid, x: event.x, y: event.y }]);
      log(`${ITEMS[dropIid]?.name} found.`);
    }
    setEvents(prev => prev.map(e => e.eid === event.eid ? { ...e, done: true } : e));
    setPlayer(newPlayer); setEvMod(null);
    if (newPlayer.quests.blackGem === 4) { log("A secret passage opens..."); setTimeout(() => setScreen("SECRET_WIN"), 2000); }
  }

  function doDialogueChoice(nextNodeId) {
    setDiagMod(prev => ({ npc: prev.npc, node: prev.npc.dialogue[nextNodeId] }));
  }

  // ── SCREENS ──
  const endScreenStyle = { background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", padding: "2rem" };
  const endBtnStyle = (col) => ({ border: `1px solid ${col}`, color: col, padding: "10px 36px", background: "transparent", cursor: "pointer", fontFamily: "'Courier New',monospace", letterSpacing: ".2em" });

  if (screen === "MENU") return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Courier New',monospace", color: "#9ca3af", padding: "1.5rem", boxSizing: "border-box" }}>
      <div style={{ color: "#3a0808", fontSize: 11, letterSpacing: ".4em", marginBottom: 8 }}>SURVIVAL HORROR RPG · PHASE VI</div>
      <div style={{ color: "#dc2626", fontSize: 36, fontWeight: "bold", letterSpacing: ".25em", marginBottom: 4, textShadow: "0 0 50px rgba(220,38,38,.4)" }}>FEAR & DARK</div>
      <div style={{ color: "#374151", fontSize: 10, marginBottom: 8 }}>Death is permanent. Darkness is patient.</div>
      <div style={{ color: "#1f2937", fontSize: 9, marginBottom: 32 }}>Canvas Engine · Subsystems · Particles · SFX · Achievements</div>
      <div style={{ color: "#4b5563", fontSize: 9, marginBottom: 12, letterSpacing: ".15em" }}>CHOOSE YOUR DESCENT</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 560, marginBottom: 24 }}>
        {Object.entries(CLS).map(([k, c]) => (
          <button key={k} onClick={() => setSelCls(k)} style={{ padding: "14px 16px", border: `2px solid ${selCls === k ? "#7f1d1d" : "#111"}`, background: selCls === k ? "#0a0000" : "transparent", color: selCls === k ? "#e5e7eb" : "#4b5563", textAlign: "left", cursor: "pointer", fontFamily: "'Courier New',monospace", transition: "all .12s", boxShadow: selCls === k ? "inset 0 0 20px rgba(127,29,29,0.3)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: "bold", fontSize: 14, color: selCls === k ? "#f87171" : "#6b7280" }}>{c.name}</div>
            </div>
            <div style={{ fontSize: 9, color: "#1f2937", marginBottom: 6, lineHeight: 1.6 }}>{c.desc}</div>
            <div style={{ fontSize: 9, color: selCls === k ? "#991b1b" : "#111" }}>HP:{c.hp} ATK:{c.atk} DEF:{c.def} AGI:{c.agi}</div>
            <div style={{ fontSize: 9, color: "#374151", marginTop: 4 }}>✦ {ABLS[c.ability]?.name}: {ABLS[c.ability]?.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={() => startGame(selCls)} style={{ border: "2px solid #991b1b", color: "#dc2626", padding: "12px 48px", fontSize: 15, background: "#0a0000", cursor: "pointer", letterSpacing: ".3em", fontFamily: "'Courier New',monospace", boxShadow: "0 0 20px rgba(153,27,27,0.4)" }}
        onMouseOver={e => e.target.style.background = "#1a0000"} onMouseOut={e => e.target.style.background = "#0a0000"}>
        DESCEND
      </button>
      <div style={{ marginTop: 24, fontSize: 9, color: "#1a1a1a", textAlign: "center", lineHeight: 2.2 }}>
        WASD/Arrows: Move · Z: Act · I: Inv · J: Journal · Q: Ability in combat
      </div>
      
      {achievements.pending.map((aid, idx) => {
        const ach = ACHIEVEMENTS.find(a => a.id === aid);
        if(!ach) return null;
        return (
          <div key={idx} style={{position:"absolute", bottom: 20, right: 20, border:"1px solid #fbbf24", background:"#0d0d0d", padding:"10px 20px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 0 20px rgba(251,191,36,0.2)", animation:"slideIn 0.5s ease-out"}}>
            <div style={{fontSize:24}}>{ach.icon}</div>
            <div>
              <div style={{color:"#fbbf24", fontSize:10, fontWeight:"bold", letterSpacing:".1em"}}>ACHIEVEMENT UNLOCKED</div>
              <div style={{color:"#e5e7eb", fontSize:12}}>{ach.name}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (screen === "DEAD") return (
    <div style={{ ...endScreenStyle, color: "#dc2626" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 50px rgba(220,38,38,.5)" }}>☠</div>
      <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: ".3em", marginBottom: 8 }}>YOU DIED</div>
      <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 4 }}>Floor {player?.floor || 1} · Level {getLv(player?.xp || 0)} · {player?.kills || 0} kills</div>
      <div style={{ color: "#1f2937", fontSize: 11, marginBottom: 24 }}>{player?.steps || 0} steps · {player?.xp || 0} XP</div>
      {msgs.slice(-4).map((m, i) => <div key={i} style={{ color: "#2a1010", fontSize: 11, marginBottom: 4, textAlign: "center" }}>{m}</div>)}
      <div style={{ height: 24 }} />
      <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#9b1c1c")}>RETURN TO DARKNESS</button>
    </div>
  );

  if (screen === "MADNESS") return (
    <div style={{ ...endScreenStyle, color: "#7c3aed" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 50px rgba(124,58,237,.6)" }}>◉</div>
      <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: ".3em", marginBottom: 8 }}>MIND SHATTERED</div>
      <div style={{ color: "#6d28d9", fontSize: 12, marginBottom: 6 }}>Fear consumed you.</div>
      <div style={{ color: "#2e1065", fontSize: 11, maxWidth: 340, textAlign: "center", lineHeight: 2.2, marginBottom: 32 }}>
        Your body walks forward but you are no longer inside it.<br />The dungeon has a new guardian.
      </div>
      <div style={{ color: "#374151", fontSize: 10, marginBottom: 4 }}>Floor {player?.floor || 1} · {player?.steps || 0} steps · {player?.kills || 0} kills</div>
      <div style={{ height: 16 }} />
      <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#7c3aed")}>ACCEPT YOUR FATE</button>
    </div>
  );

  if (screen === "WIN") return (
    <div style={{ ...endScreenStyle, color: "#c026d3" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 50px rgba(192,38,211,.6)" }}>⚡</div>
      <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: ".25em", marginBottom: 10 }}>THE WARDEN FALLS</div>
      <div style={{ color: "#7c3aed", fontSize: 12, marginBottom: 6 }}>Floor 5 conquered · Level {getLv(player?.xp || 0)} · {player?.kills || 0} kills</div>
      <div style={{ color: "#1f2937", fontSize: 11, maxWidth: 380, textAlign: "center", lineHeight: 2.2, marginBottom: 32 }}>
        The Warden crumbles. But the stairs still go down.<br />5 more floors wait below. Will you continue?
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => { setScreen("GAME"); log("You continue downward..."); }} style={endBtnStyle("#c026d3")}>DESCEND DEEPER</button>
        <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#374151")}>ESCAPE</button>
      </div>
    </div>
  );

  if (screen === "WIN_TRUE") return (
    <div style={{ ...endScreenStyle, color: "#f97316" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 60px rgba(249,115,22,.6)" }}>Θ</div>
      <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: ".25em", marginBottom: 10 }}>THE COLOSSUS CRUMBLES</div>
      <div style={{ color: "#ea580c", fontSize: 12, marginBottom: 6 }}>Floor 10 conquered · Level {getLv(player?.xp || 0)} · {player?.kills || 0} kills · {player?.steps || 0} steps</div>
      <div style={{ color: "#431407", fontSize: 11, maxWidth: 380, textAlign: "center", lineHeight: 2.2, marginBottom: 32 }}>
        The deep gate opens. Beyond it — light. Real light.<br />You climb through ten floors of nightmare and emerge changed.<br />The dungeon is silent. For the first time in millennia, it is empty.
      </div>
      <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#f97316")}>TRUE ENDING</button>
    </div>
  );

  if (screen === "WIN_ESCAPE") return (
    <div style={{ ...endScreenStyle, color: "#22c55e" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 50px rgba(34,197,94,.5)" }}>☀</div>
      <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: ".25em", marginBottom: 10 }}>ESCAPE</div>
      <div style={{ color: "#16a34a", fontSize: 12, marginBottom: 6 }}>You climbed out. · Level {getLv(player?.xp || 0)} · {player?.kills || 0} kills</div>
      <div style={{ color: "#14532d", fontSize: 11, maxWidth: 380, textAlign: "center", lineHeight: 2.2, marginBottom: 32 }}>
        Sunlight burns. The world is loud and bright and terrible.<br />You will never speak of what you saw below.
      </div>
      <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#22c55e")}>REMEMBER</button>
    </div>
  );

  if (screen === "SECRET_WIN") return (
    <div style={{ ...endScreenStyle, color: "#16a34a" }}>
      <div style={{ fontSize: 56, marginBottom: 12, textShadow: "0 0 50px rgba(22,163,74,.6)" }}>◈</div>
      <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: ".25em", marginBottom: 10 }}>TRANSCENDENCE</div>
      <div style={{ color: "#22c55e", fontSize: 12, marginBottom: 6 }}>The true depths unlocked.</div>
      <div style={{ color: "#14532d", fontSize: 11, maxWidth: 380, textAlign: "center", lineHeight: 2.2, marginBottom: 32 }}>
        The Black Gem pulses with an ancient rhythm.<br />You are no longer a prisoner. You are the new architect.<br />The dungeon reshapes itself to your will.
      </div>
      <button onClick={() => { music.stop(); setScreen("MENU"); setMsgs([]); }} style={endBtnStyle("#22c55e")}>ACCEPT YOUR FATE</button>
    </div>
  );

  if (!dng || !player) return null;
  const itemHere = gi.find(g => g.x === player.x && g.y === player.y);
  const npcHere = npcs.find(n => n.x === player.x && n.y === player.y);

  return (
    <div style={{ background: "#000", height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Courier New',monospace", color: "#9ca3af", overflow: "hidden", userSelect: "none", position: "relative" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, minWidth: 0, background: "#020202" }}>
          <canvas ref={canvasRef} width={MW * TS} height={MH * TS} style={{ imageRendering: "pixelated", flexShrink: 0, border: "1px solid #111" }} />
        </div>
        <div style={{ width: 180, padding: "10px 12px", borderLeft: "1px solid #0a0a0a", overflow: "auto", flexShrink: 0, background: "#050505" }}>
          <SidePanel player={player} floor={floor} />
        </div>
      </div>
      <div style={{ height: 90, borderTop: "1px solid #080808", padding: "6px 14px", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "#020202" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ fontSize: 11, lineHeight: 1.6, color: i === msgs.length - 1 ? "#d1d5db" : i >= msgs.length - 3 ? "#4b5563" : "#1f2937", marginBottom: 2 }}>
            {i === msgs.length - 1 ? "▸ " : ""}{m}
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #050505", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#000", flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#111", lineHeight: 2, flex: 1 }}>
          <div>WASD: Move · Z: Act · I: Inv · J: Journal · Q: Ability</div>
          {npcHere ? <div style={{ color: "#9333ea" }}>▲ {npcHere.name} — press Z</div>
            : itemHere ? <div style={{ color: "#d97706" }}>▲ {ITEMS[itemHere.iid]?.name} — press Z</div>
              : floor === 5 ? <div style={{ color: "#7c3aed" }}>⚡ Floor 5 — The Warden</div>
                : floor === 10 ? <div style={{ color: "#f97316" }}>⚡⚡ Floor 10 — The Colossus</div>
                  : <div style={{ color: "#1a1a1a" }}>Floor {floor}/{MAX_FLOOR} · Stairs ▼</div>}
        </div>
        <button onClick={() => { sfx.init(); sfx.toggle(); }} style={{ border: "1px solid #1a1a1a", background: "none", color: "#374151", fontSize: 9, padding: "4px 8px", cursor: "pointer", fontFamily: "'Courier New',monospace", marginRight: 8 }}>
          {sfx.muted ? "🔇" : "🔊"}
        </button>
        <DPad onMove={doMove} onPickup={doPickup} onInventory={() => !combat && !evMod && !lvMod && !diagMod && setShowInv(true)} onJournal={() => !combat && !evMod && !lvMod && !diagMod && setShowJrnl(true)} />
      </div>
      
      {combat && <CombatUI combat={combat} player={player} onAction={doCombat} onPart={part => setCombat(p => ({ ...p, part }))} onAbility={doCombatAbility} />}
      {showInv && !combat && <InvUI player={player} onClose={() => setShowInv(false)} onUse={doUseItem} onEquip={doEquip} onCraft={doCraftAction} RECIPES={RECIPES} />}
      {showJrnl && !combat && <JournalUI player={player} onClose={() => setShowJrnl(false)} />}
      {evMod && !combat && <EventModal event={evMod} onChoice={doEventChoice} player={player} />}
      {lvMod && !combat && <LevelUpModal level={lvMod} onChoose={applyLvUp} />}
      {diagMod && !combat && <DialogueUI npc={diagMod.npc} node={diagMod.node} onChoice={doDialogueChoice} onClose={() => setDiagMod(null)} />}
    </div>
  );
}
