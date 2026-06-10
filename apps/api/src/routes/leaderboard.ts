import { FastifyPluginAsync } from "fastify";
import { desc } from "drizzle-orm";
import { leaderboard, deathLogs } from "@fear/db/schema";

export const leaderboardRoutes: FastifyPluginAsync = async (server) => {
  server.get("/", async (req, reply) => {
    const records = await server.db.query.leaderboard.findMany({
      orderBy: [desc(leaderboard.floorReached), desc(leaderboard.xpEarned)],
      limit: 50,
    });
    return { ok: true, leaderboard: records };
  });

  server.get("/deaths", async (req, reply) => {
    const records = await server.db.query.deathLogs.findMany({
      orderBy: [desc(deathLogs.diedAt)],
      limit: 50,
    });
    return { ok: true, deaths: records };
  });

  server.post("/submit", async (req, reply) => {
    const { userId, username, characterClass, floorReached, xpEarned, wonGame } = req.body as any;
    
    // In a real game, this would be validated and done internally upon death/win, 
    // but we expose it here for the standalone prototype.
    await server.db.insert(leaderboard).values({
      userId, username, characterClass, floorReached, xpEarned, wonGame
    });
    return { ok: true };
  });
  
  server.post("/submit-death", async (req, reply) => {
    const { userId, username, characterClass, floorReached, stepsWalked, xpEarned, causeOfDeath, killedBy } = req.body as any;
    await server.db.insert(deathLogs).values({
      userId, username, characterClass, floorReached, stepsWalked, xpEarned, causeOfDeath, killedBy
    });
    return { ok: true };
  });
};
