import { betterAuth } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { env } from "./env";

/**
 * Better Auth 核心认证实例 (基于 Drizzle ORM + SQLite)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET || "elysia-react-bun-secret-key-at-least-32-chars-2026",
  baseURL: process.env.BETTER_AUTH_URL || `http://localhost:${env.PORT}`,
  plugins: [openAPI()],
});

export type Auth = typeof auth;
