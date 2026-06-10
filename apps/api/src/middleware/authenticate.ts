import { FastifyRequest, FastifyReply } from "fastify";

export async function authenticate(
  request: FastifyRequest,
  reply:   FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

// Attach to request so handlers can read request.user
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; username: string };
    user:    { userId: string; username: string };
  }
}
