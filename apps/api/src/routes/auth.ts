import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "@fear/db/schema";
import { authenticate } from "../middleware/authenticate.js";

const SALT_ROUNDS = 12;

export const authRoutes: FastifyPluginAsync = async (server) => {

  // ── POST /auth/register ─────────────────────────────
  server.post<{
    Body: { email: string; username: string; password: string };
  }>("/register", {
    schema: {
      body: {
        type: "object",
        required: ["email", "username", "password"],
        properties: {
          email:    { type: "string", format: "email" },
          username: { type: "string", minLength: 3, maxLength: 24 },
          password: { type: "string", minLength: 8 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, username, password } = request.body;

    // Check existing
    const existing = await server.db.query.users.findFirst({
      where: (u, { or }) => or(eq(u.email, email), eq(u.username, username)),
    });
    if (existing) {
      return reply.status(409).send({ error: "Email or username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await server.db
      .insert(users)
      .values({ email, username, passwordHash })
      .returning({ id: users.id, username: users.username });

    const token = await reply.jwtSign(
      { userId: user.id, username: user.username },
      { expiresIn: "30d" },
    );

    reply
      .setCookie("token", token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
      })
      .status(201)
      .send({ ok: true, userId: user.id, username: user.username });
  });

  // ── POST /auth/login ────────────────────────────────
  server.post<{
    Body: { email: string; password: string };
  }>("/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string" },
          password: { type: "string" },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await server.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Update last login
    await server.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const token = await reply.jwtSign(
      { userId: user.id, username: user.username },
      { expiresIn: "30d" },
    );

    reply
      .setCookie("token", token, {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
      })
      .send({ ok: true, userId: user.id, username: user.username });
  });

  // ── GET /auth/me ────────────────────────────────────
  server.get("/me", { onRequest: [authenticate] }, async (request) => {
    const { userId, username } = request.user;
    return { ok: true, userId, username };
  });

  // ── DELETE /auth/logout ─────────────────────────────
  server.delete("/logout", { onRequest: [authenticate] }, async (_req, reply) => {
    reply
      .clearCookie("token", { path: "/" })
      .send({ ok: true });
  });
};
