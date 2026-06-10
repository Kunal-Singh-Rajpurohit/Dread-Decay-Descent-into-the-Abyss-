import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@fear/db/schema";

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>;
  }
}

export const dbPlugin = fp(async (server) => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 10 });
  const db     = drizzle(client, { schema });

  server.decorate("db", db);

  server.addHook("onClose", async () => {
    await client.end();
  });
});
