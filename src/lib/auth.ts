import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { env } from "cloudflare:workers";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: kyselyAdapter(
    new Kysely({ dialect: new D1Dialect({ database: env.DB }) }),
    { type: "sqlite", transaction: false }
  ),
  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;
