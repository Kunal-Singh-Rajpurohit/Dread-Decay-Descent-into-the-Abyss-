import Fastify from "fastify";
import { Server } from "socket.io";
import fastifyJwt     from "@fastify/jwt";
import fastifyCookie  from "@fastify/cookie";
import fastifyCors    from "@fastify/cors";
import fastifyHelmet  from "@fastify/helmet";
import { config }     from "dotenv";

import { dbPlugin }    from "./plugins/db.js";
import { authRoutes }  from "./routes/auth.js";
import { savesRoutes } from "./routes/saves.js";
import { gameRoutes }  from "./routes/game.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";

config({ path: "../../.env" });

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
  },
});

// ── Security ───────────────────────────────────────────
await server.register(fastifyHelmet, { contentSecurityPolicy: false });
await server.register(fastifyCors, {
  origin:      process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
  methods:     ["GET","POST","PUT","DELETE","OPTIONS"],
});

// ── Auth ───────────────────────────────────────────────
await server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
  cookie: { cookieName: "token", signed: true },
});
await server.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET!,
});

// ── Database ───────────────────────────────────────────
await server.register(dbPlugin);

// ── Routes ─────────────────────────────────────────────
await server.register(authRoutes,  { prefix: "/auth"  });
await server.register(savesRoutes, { prefix: "/saves" });
await server.register(gameRoutes,  { prefix: "/game"  });
await server.register(leaderboardRoutes, { prefix: "/leaderboard" });

// ── Health ─────────────────────────────────────────────
server.get("/health", async () => ({ ok: true, ts: Date.now() }));

// ── Start ──────────────────────────────────────────────
const PORT = parseInt(process.env.API_PORT ?? "3001");
try {
  await server.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`⚔  Fear & Dark API  →  http://localhost:${PORT}`);

  // Setup Socket.io
  const io = new Server(server.server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a specific floor room
    socket.on("join-floor", (floor) => {
      socket.join(`floor-${floor}`);
      socket.broadcast.to(`floor-${floor}`).emit("player-joined", { id: socket.id });
    });

    // Broadcast player movement
    socket.on("player-move", (data) => {
      // data: { floor, x, y, spriteIdx }
      socket.broadcast.to(`floor-${data.floor}`).emit("player-moved", { id: socket.id, ...data });
    });

    // Broadcast attacks
    socket.on("player-attack", (data) => {
      socket.broadcast.to(`floor-${data.floor}`).emit("player-attacked", { id: socket.id, ...data });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      io.emit("player-left", { id: socket.id });
    });
  });

} catch (err) {
  server.log.error(err);
  process.exit(1);
}
