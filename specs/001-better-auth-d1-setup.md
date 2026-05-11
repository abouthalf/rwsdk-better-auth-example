# Spec 001 — Better Auth with D1 and Email/Password Authentication

## Overview

Wire up Better Auth for authentication, backed by Cloudflare D1 via Kysely, with email/password as the authentication method. Also establishes a Cloudflare Workers Builds pipeline so every push to `main` deploys to production and every non-`main` branch creates a preview deployment.

---

## 1. Prerequisites

### 1.1 Name the worker

`wrangler.jsonc` currently has `"name": "__change_me__"`. Set it to a stable slug that will also become the Cloudflare dashboard name:

```jsonc
"name": "rwsdk-better-auth-example"
```

> **Important:** This name must exactly match the Worker name in the Cloudflare dashboard. Mismatches cause Workers Builds to fail.

### 1.2 Verify `nodejs_compat` is present

Better Auth requires `AsyncLocalStorage`. The starter already includes:

```jsonc
"compatibility_flags": ["nodejs_compat"]
```

No change needed — confirm it is present before proceeding.

---

## 2. Create the D1 Database

Run once to provision the database in Cloudflare:

```bash
pnpm wrangler d1 create rwsdk-better-auth-example
```

The CLI outputs a config block. Copy the `database_id` into `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "rwsdk-better-auth-example",
      "database_id": "<paste-id-from-wrangler-output>"
    }
  ]
}
```

Add `DB: D1Database` to the Worker environment type in `worker-configuration.d.ts` (or wherever `Env`/`AppContext` bindings are declared). Run `pnpm generate` to regenerate types after updating `wrangler.jsonc`.

---

## 3. Install Packages

```bash
pnpm add better-auth @better-auth/kysely-adapter kysely kysely-d1
```

| Package | Role |
|---|---|
| `better-auth` | Core auth library |
| `@better-auth/kysely-adapter` | Connects Better Auth to a Kysely instance |
| `kysely` | Type-safe query builder |
| `kysely-d1` | Kysely dialect for Cloudflare D1 |

---

## 4. Auth Configuration

### 4.1 Create `src/lib/auth.ts`

Because `env.DB` is request-scoped in Cloudflare Workers, the auth instance must be created per request (or lazily cached with the binding as a cache key). A factory function is the clearest pattern:

```ts
import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export function createAuth(db: D1Database) {
  return betterAuth({
    database: kyselyAdapter(
      new Kysely({ dialect: new D1Dialect({ database: db }) }),
      {
        type: "sqlite",
        transaction: false, // D1 does not support interactive transactions
      }
    ),
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

> **Why `transaction: false`?** D1 does not support interactive transactions. Omitting this flag will cause runtime errors on any operation Better Auth tries to wrap in a transaction.

### 4.2 Environment variables

Better Auth requires two variables at runtime. Add them to `wrangler.jsonc` under `vars` for local dev:

```jsonc
"vars": {
  "BETTER_AUTH_URL": "http://localhost:5173"
}
```

`BETTER_AUTH_SECRET` must **not** be in `vars` (it's a secret). Add it as a Wrangler secret:

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
```

For local dev, add to `.dev.vars` (already gitignored):

```
BETTER_AUTH_SECRET=<output of: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:5173
```

Update `worker-configuration.d.ts` (or the env interface) to include:

```ts
BETTER_AUTH_SECRET: string;
BETTER_AUTH_URL: string;
```

Pass these into `createAuth` from the Worker `env` and thread them through `betterAuth({ secret, baseURL })`:

```ts
export function createAuth(db: D1Database, secret: string, baseURL: string) {
  return betterAuth({
    secret,
    baseURL,
    database: kyselyAdapter(...),
    emailAndPassword: { enabled: true },
  });
}
```

---

## 5. Wire the Auth Handler into the Worker

Better Auth exposes all its endpoints at `/api/auth/*`. Mount this before the `render()` block so it short-circuits before RSC rendering:

```ts
// src/worker.tsx
import { route, render, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { createAuth } from "@/lib/auth";
// ... other imports

export type AppContext = {
  auth: Auth;
};

export default defineApp([
  setCommonHeaders(),
  ({ ctx, env, request }) => {
    ctx.auth = createAuth(env.DB, env.BETTER_AUTH_SECRET, env.BETTER_AUTH_URL);
  },
  prefix("/api/auth", [
    route("/*", ({ ctx, request }) => ctx.auth.handler(request)),
  ]),
  render(Document, [
    route("/", Home),
    route("/app", AppPage),
    route("/profile", ProfilePage),
  ]),
]);
```

> Check the rwsdk router API — use `prefix()` if available, otherwise a wildcard `route("/api/auth/*", ...)` handler is equivalent.

---

## 6. Run Database Migrations

Better Auth's CLI generates the SQL schema for the tables it needs (users, sessions, accounts, verifications).

### Generate SQL

```bash
pnpm dlx @better-auth/cli generate --output ./migrations/001_better_auth.sql
```

### Apply locally

```bash
pnpm wrangler d1 execute rwsdk-better-auth-example --local --file=./migrations/001_better_auth.sql
```

### Apply to production

```bash
pnpm wrangler d1 execute rwsdk-better-auth-example --remote --file=./migrations/001_better_auth.sql
```

> **Always include `--remote` explicitly** when targeting production. Without it, `d1 execute` targets the local SQLite replica only.

Commit the generated SQL file under `migrations/` so the schema is version-controlled alongside the code.

---

## 7. Auth Client

Create `src/lib/auth-client.ts` for use in client components:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

No `baseURL` needed when client and server share the same origin.

Key methods used in this app:

```ts
// Sign up
await authClient.signUp.email({ name, email, password });

// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();

// Get current session (reactive)
const { data: session } = authClient.useSession();
```

---

## 8. Deployment from Git Branches

Use **Cloudflare Workers Builds** (dashboard-native CI/CD) — no GitHub Actions secrets required.

### 8.1 Connect the repository

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Import a repository**
2. Authorise the GitHub account and select this repo
3. Confirm the Worker name matches `wrangler.jsonc` → **Deploy**

### 8.2 Branch behaviour

| Branch | Action |
|---|---|
| `main` | `wrangler deploy` → promotes to production |
| Any other branch | `wrangler versions upload` → creates a preview URL, no production impact |

This is automatic — no configuration file needed beyond `wrangler.jsonc`.

### 8.3 Build command

Workers Builds runs `npx wrangler deploy` by default. If a build step is needed before deploy, set in Dashboard → Settings → Builds:

```
Build command: pnpm build
Deploy command: npx wrangler deploy
```

### 8.4 Production secrets

Runtime secrets (`BETTER_AUTH_SECRET`) must be added separately — build-time env vars are not available at runtime:

Dashboard → Worker → **Settings** → **Variables & Secrets** → **Add secret**

Or via CLI (applies to the deployed Worker):

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
```

Update `BETTER_AUTH_URL` in `wrangler.jsonc` `vars` to the production Workers URL once the first deploy completes:

```jsonc
"vars": {
  "BETTER_AUTH_URL": "https://rwsdk-better-auth-example.<account>.workers.dev"
}
```

---

## Open Questions

- **Route guard placement**: Once auth is wired, `/app` and `/profile` should redirect unauthenticated users to a login page. The middleware approach (adding a `requireAuth` check in the route array) needs to be confirmed against the rwsdk middleware API.
- **Session in `ctx`**: Decide whether to load the session in global middleware (available everywhere) or per-route. Loading globally is simpler; per-route avoids the D1 read on public pages.
- **`BETTER_AUTH_URL` in production**: Confirm the final workers.dev subdomain after first deploy and update `vars`.
- **Migrations strategy**: The `--remote` apply step is manual today. Consider whether this should be automated in the deploy pipeline (i.e., run migration before `wrangler deploy` in CI).
