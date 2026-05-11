# rwsdk-better-auth-example

A working example of a [Redwood SDK](https://docs.rwsdk.com/) app with [Better Auth](https://better-auth.com/) for authentication, backed by [Cloudflare D1](https://developers.cloudflare.com/d1/) via [Kysely](https://kysely.dev/).

## Stack

- **Redwood SDK** — React RSC + Server Actions on Cloudflare Workers
- **Better Auth** — email/password authentication
- **Cloudflare D1** — SQLite-compatible database at the edge
- **Kysely + kysely-d1** — type-safe SQL query builder

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) with Workers and D1 enabled

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a `.env` file

```bash
cp .env.example .env
```

Then fill in a random secret:

```bash
# Generate a secret
openssl rand -base64 32
```

`.env`:

```
BETTER_AUTH_SECRET=<output from above>
BETTER_AUTH_URL=http://localhost:5173
```

Redwood SDK symlinks `.dev.vars` → `.env` automatically when you run `pnpm dev`, so Wrangler picks up these values without any extra config.

### 3. Apply the database migration

This populates the local D1 replica (a SQLite file managed by Wrangler) with the Better Auth schema:

```bash
pnpm wrangler d1 execute rwsdk-better-auth-example --local --file=./migrations/001_better_auth.sql
```

### 4. Start the dev server

```bash
pnpm dev
```

The app is available at `http://localhost:5173`.

## Testing authentication

With the dev server running, use these `curl` commands to verify the auth endpoints.

### Sign up

```bash
curl -X POST http://localhost:5173/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Expected response (`200 OK`):

```json
{
  "token": "...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Sign in

```bash
curl -X POST http://localhost:5173/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Sign out

```bash
curl -X POST http://localhost:5173/api/auth/sign-out \
  -H "Origin: http://localhost:5173" \
  -H "Cookie: <session-cookie-from-sign-in>"
```

## Deployment

### 1. Initial deploy

```bash
pnpm release
```

At the end of the output, Wrangler prints your workers.dev URL:
`https://rwsdk-better-auth-example.<your-account>.workers.dev`

Copy it — you need it in the next step.

### 2. Update `BETTER_AUTH_URL` in `wrangler.jsonc`

Replace the localhost placeholder with your production URL:

```jsonc
"vars": {
  "BETTER_AUTH_URL": "https://rwsdk-better-auth-example.<your-account>.workers.dev"
}
```

> **Local dev is unaffected.** Wrangler gives `.dev.vars` (symlinked from `.env`) precedence over `vars` during `pnpm dev`, so `http://localhost:5173` continues to be used locally.

### 3. Set the auth secret

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET
```

Paste the same value from your `.env` file when prompted (or generate a fresh one with `openssl rand -base64 32`).

### 4. Apply the migration to production D1

```bash
pnpm wrangler d1 execute rwsdk-better-auth-example --remote --file=./migrations/001_better_auth.sql
```

The D1 database already exists (its `database_id` is set in `wrangler.jsonc`) — this just initialises the schema.

### 5. Redeploy

```bash
pnpm release
```

This picks up the updated `BETTER_AUTH_URL` from `wrangler.jsonc`. Auth is now fully functional in production.

## Password requirements

Better Auth's email/password provider accepts a `password` config object in `emailAndPassword`. To enforce stricter requirements in a production app, pass a custom validator:

```ts
emailAndPassword: {
  enabled: true,
  password: {
    minLength: 12,
    validate(password) {
      if (!/[A-Z]/.test(password)) return false; // require uppercase
      if (!/[0-9]/.test(password)) return false;  // require digit
      if (!/[^A-Za-z0-9]/.test(password)) return false; // require special char
      return true;
    },
  },
},
```

See [Better Auth — Email & Password options](https://better-auth.com/docs/authentication/email-password) for the full configuration reference.

## Project structure

```
src/
  worker.tsx        # App entry point — routing and middleware
  lib/
    auth.ts         # Better Auth server instance (uses cloudflare:workers env)
    auth-client.ts  # Better Auth client (for React components)
  app/
    pages/          # Route page components
migrations/
  001_better_auth.sql  # Better Auth schema (user, session, account, verification)
specs/              # Spec-driven development documents
```

## Make it your own

This is a reference implementation — here's what to change when adapting it for a real project.

### Worker and database name

The name `rwsdk-better-auth-example` appears in three places. Change all three to match your project:

- `wrangler.jsonc` → `"name"` (the Worker name shown in the Cloudflare dashboard)
- `wrangler.jsonc` → `d1_databases[0].database_name`
- Any `pnpm wrangler d1 execute rwsdk-better-auth-example ...` commands in your workflow

After renaming, run `pnpm wrangler d1 create <your-name>` to provision a new database and paste the resulting `database_id` into `wrangler.jsonc`.

### `BETTER_AUTH_URL`

Update the `vars` entry in `wrangler.jsonc` to your production Workers URL once you have it. For local dev this is always overridden by `.env` via the `.dev.vars` symlink.

### `BETTER_AUTH_SECRET`

Generate a unique secret per environment:

```bash
openssl rand -base64 32
```

Store it in `.env` for local dev and as a Wrangler secret for production (`pnpm wrangler secret put BETTER_AUTH_SECRET`). Never reuse the same secret across environments.

### Auth providers

Only email/password is enabled in `src/lib/auth.ts`. Better Auth supports social providers (Google, GitHub, etc.) and plugins (2FA, magic links, passkeys). See the [Better Auth docs](https://better-auth.com/docs/introduction) to add them — each provider typically requires additional `d1_databases` migration columns or a new migration file.

### Password requirements

See the [Password requirements](#password-requirements) section above.

## Further reading

- [Redwood SDK docs](https://docs.rwsdk.com/)
- [Better Auth docs](https://better-auth.com/docs/introduction)
- [Cloudflare D1 docs](https://developers.cloudflare.com/d1/)
