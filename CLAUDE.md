# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

This is an example / tutorial project demonstrating a full-stack app using:
- **Redwood SDK (rwsdk)** — React RSC + Server Actions on Cloudflare Workers
- **Better Auth** — framework-agnostic TypeScript auth library
- **Kysely + kysely-d1** — type-safe query builder targeting Cloudflare D1 (SQLite)

It is intentionally a reference implementation, so clarity beats cleverness. Prefer explicit, readable patterns over abstractions.

## Development workflow

Trunk-based development. Feature work goes on short-lived branches merged back to `main` when complete. No long-running feature branches.

## Tech stack roles

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Cloudflare Workers | Hosts the app at the edge |
| Framework | Redwood SDK | RSC, routing, middleware, Server Actions |
| Auth | Better Auth | User accounts, sessions, email+password (and plugins) |
| Database | Cloudflare D1 (SQLite) | Stores Better Auth tables (users, sessions, etc.) |
| Query builder | Kysely + `kysely-d1` | Type-safe SQL against D1 |

## Commands

```bash
pnpm dev          # local dev server (Wrangler) at http://localhost:5173
pnpm build        # production build
pnpm deploy       # deploy to Cloudflare
pnpm generate     # sync Wrangler bindings → TypeScript types
```

For D1 / Better Auth migrations:
```bash
npx @better-auth/cli generate   # generate SQL migration from Better Auth schema
npx @better-auth/cli migrate    # apply migrations (Kysely adapter)
wrangler d1 execute DB --local --file=./migration.sql   # apply to local D1
wrangler d1 execute DB --file=./migration.sql           # apply to remote D1
```

## Architecture

### Request lifecycle

Requests enter through `src/worker.tsx` → `defineApp()`. Middleware runs first (auth session loading, guards), then route handlers, RSCs, or Server Actions.

### Session handling

Better Auth manages sessions; the session store is wired into rwsdk middleware so `ctx.user` / `ctx.session` are available in all routes and Server Actions without prop drilling.

### Database access

A single `Kysely<DB>` instance is created per request using the D1 binding from `env`. Pass `env.DB` to `D1Dialect` at instantiation — do not create a global instance, since D1 bindings are request-scoped in Workers.

```ts
import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'

const db = new Kysely<DB>({ dialect: new D1Dialect({ database: env.DB }) })
```

### Auth wiring

Better Auth is initialized in `src/lib/auth.ts`, mounted at `/api/auth/*`, and connected to D1 via a Kysely adapter. The `nodejs_compat` (or `nodejs_als`) compatibility flag must be set in `wrangler.jsonc` — Better Auth requires `AsyncLocalStorage`.

### Cloudflare-specific requirements

- `wrangler.jsonc` must declare the D1 binding (`DB`) and any Durable Object bindings
- Run `pnpm generate` after changing bindings to keep types in sync
- `nodejs_compat` flag is required in `wrangler.jsonc` for Better Auth

## Reference docs

- Redwood SDK auth: https://docs.rwsdk.com/core/authentication
- Better Auth: https://better-auth.com/docs/introduction
- Kysely D1 dialect: https://kysely.dev/docs/dialects#community-dialects (`kysely-d1` package)
