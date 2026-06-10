import { FastifyPluginAsync }                    from "fastify";
import { eq, and }                               from "drizzle-orm";
import { saves }                                 from "@fear/db/schema";
import { authenticate }                          from "../middleware/authenticate.js";
import type { GameState, GameAction, ActionResponse } from "@fear/game-core/types";
import {
  resolvePlayerAttack, resolveEnemyAttack,
  resolveEnemySpecial, resolveAbility,
} from "@fear/game-core/combat";
import { survivalTick, getTorchRadius, getPlayerLevel, applyLevelUpChoice } from "@fear/game-core/systems/survival";
import { generateDungeon }                       from "../services/dungeon.js";
import { computeFOV }                            from "../services/fov.js";

export const gameRoutes: FastifyPluginAsync = async (server) => {

  // All game actions go through one endpoint.
  // The server is the authority — it resolves the action, mutates state,
  // persists, and returns the new state to the client.
  server.post<{
    Body: { action: GameAction; saveId: string };
  }>("/action", { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { action, saveId } = request.body;

    // ── Load authoritative save ──────────────────────
    const save = await server.db.query.saves.findFirst({
      where: and(eq(saves.id, saveId), eq(saves.userId, userId)),
    });
    if (!save || save.status !== "alive") {
      return reply.status(404).send({ error: "Active save not found" });
    }

    let state: GameState  = JSON.parse(JSON.stringify(save.state));
    const msgs: string[]  = [];
    let dead  = false;
    let won   = false;
    let levelUp: number | undefined;

    // ════════════════════════════════════════════════
    // MOVE
    // ════════════════════════════════════════════════
    if (action.type === "MOVE" || action.type === "MOVE_WAIT") {
      const a = action as any;
      const nx = state.player.x + (a.dx ?? 0);
      const ny = state.player.y + (a.dy ?? 0);

      const { W } = { W: 0 };
      if (nx < 0 || nx >= 32 || ny < 0 || ny >= 20 || state.dungeon.map[ny][nx] === W) {
        return { ok: true, messages: [], state, dead: false, won: false };
      }

      // Check for enemy at target
      const en = state.dungeon.enemies.find(e => e.x === nx && e.y === ny);
      if (en) {
        // Player bumps into enemy — this is handled by client sending ATTACK
        return { ok: false, messages: ["An enemy blocks your path. Engage in combat."], state };
      }

      state.player.x = nx;
      state.player.y = ny;
      state.player.steps++;

      // Stairs
      if (state.dungeon.map[ny][nx] === 2) {
        const nfl = state.floor + 1;
        const nd  = generateDungeon(nfl);
        state.floor            = nfl;
        state.player.floor     = nfl;
        state.player.x         = nd.spawn.x;
        state.player.y         = nd.spawn.y;
        state.dungeon          = nd;
        state.seen             = [];
        msgs.push(`Floor ${nfl}.${nfl === 5 ? " ⚡ Something waits." : " Deeper. Worse."}`);
      }

      // Survival tick
      const tick = survivalTick(state.player);
      state.player = { ...tick.p, steps: state.player.steps };
      msgs.push(...tick.msgs);

      // FOV
      const r      = getTorchRadius(state.player);
      const newVis = computeFOV(state.dungeon.map, state.player.x, state.player.y, r);
      const seenSet = new Set<string>(state.seen);
      newVis.forEach(k => seenSet.add(k));
      state.seen = Array.from(seenSet);

      // Enemy AI — simple step toward player
      state.dungeon.enemies = state.dungeon.enemies.map(e => {
        const dist = Math.abs(e.x - nx) + Math.abs(e.y - ny);
        if (dist > 8) return e;
        const sdx = Math.sign(nx - e.x), sdy = Math.sign(ny - e.y);
        const ok = (tx: number, ty: number) =>
          tx >= 0 && tx < 32 && ty >= 0 && ty < 20 &&
          state.dungeon.map[ty][tx] !== 0 &&
          !state.dungeon.enemies.some(o => o.x === tx && o.y === ty && o.eid !== e.eid) &&
          !(tx === nx && ty === ny);
        if (Math.abs(nx - e.x) >= Math.abs(ny - e.y)) {
          if (sdx && ok(e.x + sdx, e.y)) return { ...e, x: e.x + sdx };
          if (sdy && ok(e.x, e.y + sdy)) return { ...e, y: e.y + sdy };
        } else {
          if (sdy && ok(e.x, e.y + sdy)) return { ...e, y: e.y + sdy };
          if (sdx && ok(e.x + sdx, e.y)) return { ...e, x: e.x + sdx };
        }
        return e;
      });

      // Death checks
      if (state.player.hp <= 0)   { dead = true; msgs.push("You collapse..."); }
      if (state.player.fear >= 100){ dead = true; msgs.push("Your mind shatters."); }
    }

    // ════════════════════════════════════════════════
    // COMBAT — ATTACK
    // ════════════════════════════════════════════════
    if (action.type === "ATTACK") {
      const a    = action as any;
      const part = a.targetPart ?? "torso";
      const enIdx = state.dungeon.enemies.findIndex(e => e.eid === a.enemyEid);
      if (enIdx === -1) return reply.status(400).send({ error: "Enemy not found" });

      const enemy   = state.dungeon.enemies[enIdx];
      const result  = resolvePlayerAttack(state.player, enemy, part);
      msgs.push(...result.messages);
      state.player  = result.newPlayer;

      if (result.dead) {
        // Remove enemy, drop loot, add XP
        state.dungeon.enemies.splice(enIdx, 1);
        if (result.enemyDrops) state.dungeon.gi.push(...result.enemyDrops);
        if (result.xpGained) {
          const oldLv  = getPlayerLevel(state.player.xp - result.xpGained);
          const newLv  = getPlayerLevel(state.player.xp);
          if (newLv > oldLv) { levelUp = newLv; state.player.level = newLv; }
        }
        msgs.push(`+${result.xpGained} XP.`);
        if (result.victory) { won = true; msgs.push("⚡ The Warden falls. The dungeon shudders."); }
      } else {
        // Update enemy state
        state.dungeon.enemies[enIdx] = result.newEnemy!;

        // Enemy special move first
        const spec = resolveEnemySpecial(state.dungeon.enemies[enIdx], state.player);
        if (spec) {
          msgs.push(...spec.messages);
          state.player = spec.newPlayer;
          state.dungeon.enemies[enIdx] = spec.newEnemy;
        } else {
          // Regular counter-attack
          const counter = resolveEnemyAttack(state.dungeon.enemies[enIdx], state.player);
          msgs.push(...counter.messages);
          state.player = counter.newPlayer;
          state.dungeon.enemies[enIdx] = counter.newEnemy;
        }

        if (state.player.hp <= 0) { dead = true; msgs.push("You are slain."); }
      }
    }

    // ════════════════════════════════════════════════
    // COMBAT — ABILITY
    // ════════════════════════════════════════════════
    if (action.type === "ABILITY") {
      const a     = action as any;
      const enIdx = state.dungeon.enemies.findIndex(e => e.eid === a.enemyEid);
      if (enIdx === -1) return reply.status(400).send({ error: "Enemy not found" });

      const result = resolveAbility(state.player, state.dungeon.enemies[enIdx]);
      msgs.push(...result.messages);
      state.player = result.newPlayer;

      // Ability uses the player's turn — enemy attacks back
      const counter = resolveEnemyAttack(state.dungeon.enemies[enIdx], state.player);
      msgs.push(...counter.messages);
      state.player = counter.newPlayer;
      state.dungeon.enemies[enIdx] = counter.newEnemy;
      if (state.player.hp <= 0) { dead = true; msgs.push("You are slain."); }
    }

    // ════════════════════════════════════════════════
    // COMBAT — FLEE
    // ════════════════════════════════════════════════
    if (action.type === "FLEE") {
      const a     = action as any;
      const enIdx = state.dungeon.enemies.findIndex(e => e.eid === a.enemyEid);
      if (enIdx !== -1 && Math.random() < 0.45) {
        msgs.push("You break away and run!");
      } else if (enIdx !== -1) {
        msgs.push("No escape!");
        const counter = resolveEnemyAttack(state.dungeon.enemies[enIdx], state.player);
        msgs.push(...counter.messages);
        state.player = counter.newPlayer;
        if (state.player.hp <= 0) { dead = true; }
      }
    }

    // ════════════════════════════════════════════════
    // ITEM — USE / EQUIP / PICKUP
    // ════════════════════════════════════════════════
    if (action.type === "USE" || action.type === "EQUIP" || action.type === "PICKUP") {
      // These are resolved client-side for responsiveness
      // The client sends the resulting state back via PUT /saves/:id
      // Only combat is server-authoritative
    }

    // ════════════════════════════════════════════════
    // LEVEL UP CHOICE
    // ════════════════════════════════════════════════
    if (action.type === "LEVEL_UP_CHOICE") {
      const a = action as any;
      state.player = applyLevelUpChoice(state.player, a.choice);
      msgs.push(`Level ${state.player.level} boon applied.`);
    }

    // ── Persist updated state ────────────────────────
    const newStatus = won ? "won" : dead ? "dead" : "alive";
    await server.db
      .update(saves)
      .set({
        state, status: newStatus, updatedAt: new Date(),
        floorReached:    state.player.floor,
        level:           state.player.level,
        xp:              state.player.xp,
        playtimeSeconds: save.playtimeSeconds + 1,
      })
      .where(eq(saves.id, saveId));

    const response: ActionResponse = {
      ok: true, messages: msgs, state, dead, won, levelUp,
    };
    return response;
  });

  // ═══════════════════════════════════════════════════════
  // STATELESS COMBAT RESOLVER (PROTOTYPE)
  // ═══════════════════════════════════════════════════════
  server.post<{
    Body: { action: string; player: PlayerState; enemy: EnemyState; part?: BodyPartKey; ability?: string };
  }>("/combat_stateless", async (request, reply) => {
    const { action, player, enemy, part, ability } = request.body;

    if (action === "ATTACK") {
      const result = resolvePlayerAttack(player, enemy, part || "torso");
      return reply.send(result);
    }
    
    if (action === "ENEMY_ATTACK") {
      const result = resolveEnemyAttack(enemy, player);
      return reply.send(result);
    }

    if (action === "ENEMY_SPECIAL") {
      const result = resolveEnemySpecial(enemy, player);
      return reply.send(result || { triggered: false });
    }

    if (action === "ABILITY") {
      const result = resolveAbility(player, enemy);
      return reply.send(result);
    }

    return reply.status(400).send({ error: "Unknown action" });
  });
};
