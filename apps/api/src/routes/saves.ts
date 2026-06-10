import { FastifyPluginAsync } from "fastify";
import { eq, and }           from "drizzle-orm";
import { saves, deathLogs }  from "@fear/db/schema";
import { authenticate }      from "../middleware/authenticate.js";
import type { GameState, CharacterClass } from "@fear/game-core/types";
import { buildInitialState } from "../services/gameState.js";

const MAX_SLOTS = 3;

export const savesRoutes: FastifyPluginAsync = async (server) => {

  // ── GET /saves  ─  list all slots for current user ──
  server.get("/", { onRequest: [authenticate] }, async (request) => {
    const { userId } = request.user;
    const rows = await server.db.query.saves.findMany({
      where: eq(saves.userId, userId),
      columns: {
        id: true, slotIndex: true, status: true,
        characterClass: true, characterName: true,
        floorReached: true, level: true, xp: true,
        playtimeSeconds: true, createdAt: true, updatedAt: true,
        // Exclude `state` blob from list response for performance
      },
    });
    return { ok: true, saves: rows };
  });

  // ── POST /saves  ─  create new game ─────────────────
  server.post<{
    Body: { slotIndex: number; characterClass: CharacterClass };
  }>("/", { onRequest: [authenticate] }, async (request, reply) => {
    const { userId, username } = request.user;
    const { slotIndex, characterClass } = request.body;

    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
      return reply.status(400).send({ error: "Invalid slot index" });
    }

    // Delete existing save in this slot (overwrite)
    await server.db
      .delete(saves)
      .where(and(eq(saves.userId, userId), eq(saves.slotIndex, slotIndex)));

    // Build fresh game state
    const state: GameState = buildInitialState(characterClass, userId, username);

    const [save] = await server.db
      .insert(saves)
      .values({
        userId, slotIndex, status: "alive",
        characterClass, characterName: state.player.name,
        floorReached: 1, level: 1, xp: 0,
        playtimeSeconds: 0, state,
      })
      .returning({ id: saves.id });

    return reply.status(201).send({ ok: true, saveId: save.id, state });
  });

  // ── GET /saves/:id  ─  load full save ───────────────
  server.get<{ Params: { id: string } }>(
    "/:id", { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request.user;
      const row = await server.db.query.saves.findFirst({
        where: and(eq(saves.id, request.params.id), eq(saves.userId, userId)),
      });
      if (!row) return reply.status(404).send({ error: "Save not found" });
      return { ok: true, save: row };
    }
  );

  // ── PUT /saves/:id  ─  checkpoint (client-side update) ─
  server.put<{
    Params: { id: string };
    Body:   { state: GameState; playtimeSeconds: number };
  }>("/:id", { onRequest: [authenticate] }, async (request, reply) => {
    const { userId } = request.user;
    const { state, playtimeSeconds } = request.body;

    const existing = await server.db.query.saves.findFirst({
      where: and(eq(saves.id, request.params.id), eq(saves.userId, userId)),
      columns: { id: true },
    });
    if (!existing) return reply.status(404).send({ error: "Save not found" });

    await server.db
      .update(saves)
      .set({
        state, playtimeSeconds, updatedAt: new Date(),
        floorReached: state.player.floor,
        level:        state.player.level,
        xp:           state.player.xp,
      })
      .where(eq(saves.id, request.params.id));

    return { ok: true };
  });

  // ── DELETE /saves/:id  ─  delete save ───────────────
  server.delete<{ Params: { id: string } }>(
    "/:id", { onRequest: [authenticate] },
    async (request, reply) => {
      const { userId } = request.user;
      const result = await server.db
        .delete(saves)
        .where(and(eq(saves.id, request.params.id), eq(saves.userId, userId)))
        .returning({ id: saves.id });
      if (!result.length) return reply.status(404).send({ error: "Save not found" });
      return { ok: true };
    }
  );

  // ── POST /saves/:id/death  ─  record death ───────────
  server.post<{
    Params: { id: string };
    Body:   { causeOfDeath: string; killedBy?: string };
  }>("/:id/death", { onRequest: [authenticate] }, async (request, reply) => {
    const { userId, username } = request.user;
    const { causeOfDeath, killedBy } = request.body;

    const save = await server.db.query.saves.findFirst({
      where: and(eq(saves.id, request.params.id), eq(saves.userId, userId)),
    });
    if (!save) return reply.status(404).send({ error: "Save not found" });

    const state = save.state as GameState;

    // Record death
    await server.db.insert(deathLogs).values({
      userId, username,
      characterClass: save.characterClass,
      floorReached:   state.player.floor,
      stepsWalked:    state.player.steps,
      xpEarned:       state.player.xp,
      causeOfDeath, killedBy,
    });

    // Mark save as dead
    await server.db
      .update(saves)
      .set({ status: "dead", updatedAt: new Date() })
      .where(eq(saves.id, request.params.id));

    return { ok: true };
  });
};
