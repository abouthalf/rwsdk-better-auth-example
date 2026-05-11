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

## Further reading

- [Redwood SDK docs](https://docs.rwsdk.com/)
- [Better Auth docs](https://better-auth.com/docs/introduction)
- [Cloudflare D1 docs](https://developers.cloudflare.com/d1/)
