# Spec 002 — Auth UI: Registration, Login, and Logout

## Overview

Replace the starter `<Welcome />` placeholder with functional auth UI. The home page becomes the entry point for unauthenticated users — offering sign-up and sign-in forms. Protected routes (`/app`, `/profile`) display a logout button in the top-right corner. Logout uses a form submission (not a link) to prevent inadvertent trigger by browser link-hover prefetch.

Also: document Better Auth's password hardening options in `README.md` without implementing them (this is a reference app, not a production hardening exercise).

---

## 1. Remove the Welcome component

Delete these two files:

- `src/app/pages/welcome.tsx`
- `src/app/pages/welcome.module.css`

Update `src/app/pages/home.tsx` to remove the import and render new content (see section 3).

---

## 2. Auth forms

### 2.1 Registration form — `src/app/pages/home.tsx` (or a dedicated component)

The home page (`/`) renders two forms side-by-side (or stacked on mobile): **Sign Up** and **Sign In**. When a user is already authenticated, redirect them to `/app` instead.

#### Sign Up form fields

| Field | Type | Validation |
|---|---|---|
| Name | text | required |
| Email | email | required |
| Password | password | required |

On submit, call `authClient.signUp.email({ name, email, password })`.

#### Sign In form fields

| Field | Type | Validation |
|---|---|---|
| Email | email | required |
| Password | password | required |

On submit, call `authClient.signIn.email({ email, password })`.

#### Error handling

Better Auth client methods return `{ data, error }`. When `error` is non-null it has a `code` string and a `message` string.

Display errors at two levels:

1. **Field-level errors** — when `error.code` maps to a specific field, show the error inline beneath that input. Discover which codes are actually returned by inspecting network responses during development — do not assume code values. Where a code unambiguously maps to a field (e.g. an email-already-in-use code on sign-up), display `error.message` beneath the email field.
2. **General errors** — any `error.code` that does not map to a specific field renders as a banner above the form, using `error.message` (or a generic fallback if `message` is empty).

> **Note on pre-submit availability checks:** Better Auth exposes explicit availability-check methods on the client for certain plugins. For example, the [username plugin](https://better-auth.com/docs/plugins/username#check-if-username-is-available) provides `authClient.isUsernameAvailable({ username })` → `{ data: { available: boolean } }`. If the username plugin is added in future, use this method for inline availability feedback before form submission rather than relying solely on submit-time errors.

On success, navigate to `/app` using `window.location.href = "/app"` (simple redirect — no client-side router needed).

#### UX notes

- Mark forms as `"use client"` — they use React state for field values and errors.
- Disable the submit button while the request is in flight (use a loading state).
- Clear field-specific errors when the user edits the relevant input.

---

## 3. Logout

### 3.1 Logout route — `src/worker.tsx`

Add a server-side logout route at `/logout`:

```ts
route("/logout", async ({ request }) => {
  await auth.signOut({ fetchOptions: { headers: request.headers } });
  return new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });
}),
```

Better Auth's `signOut` called server-side clears the session cookie. Passing `request.headers` forwards the session cookie so Better Auth can identify and invalidate the session.

> **Why a server route instead of `authClient.signOut()` on the client?** A form POST to a server route works without JavaScript enabled, avoids client-side navigation inconsistencies, and cannot be triggered by link-hover prefetch in Safari or other browsers.

### 3.2 Logout form component — `src/app/shared/LogoutButton.tsx`

```tsx
"use client";

export const LogoutButton = () => (
  <form method="post" action="/logout">
    <button type="submit">Log out</button>
  </form>
);
```

This is intentionally minimal — styling is left to the implementer.

### 3.3 Placement on protected routes

Import and render `<LogoutButton />` in the top-right corner of:

- `src/app/pages/app.tsx`
- `src/app/pages/profile.tsx`

Use a wrapper with `position: absolute` or Tailwind `absolute top-4 right-4` inside a `relative` container, or a flexbox header row — whichever is cleaner given the existing layout.

---

## 4. Document password hardening in README.md

Add a **"Password requirements"** section to `README.md` explaining how to configure stricter password rules via Better Auth's `emailAndPassword` plugin options. **Do not implement these** — document them only.

Content to include:

```md
## Password requirements

Better Auth's email/password provider accepts a `password` config object in `emailAndPassword`. To enforce stricter requirements in a production app, pass a custom validator:

\`\`\`ts
emailAndPassword: {
  enabled: true,
  password: {
    minLength: 12,
    // Return true if valid, or throw/return false to reject
    validate(password) {
      if (!/[A-Z]/.test(password)) return false; // require uppercase
      if (!/[0-9]/.test(password)) return false;  // require digit
      if (!/[^A-Za-z0-9]/.test(password)) return false; // require special char
      return true;
    },
  },
},
\`\`\`

See [Better Auth — Email & Password options](https://better-auth.com/docs/authentication/email-password) for the full configuration reference.
```

---

## 5. Files modified / created

| File | Action |
|---|---|
| `src/app/pages/welcome.tsx` | Delete |
| `src/app/pages/welcome.module.css` | Delete |
| `src/app/pages/home.tsx` | Rewrite — sign-up + sign-in forms |
| `src/app/pages/app.tsx` | Add `<LogoutButton />` in top-right |
| `src/app/pages/profile.tsx` | Add `<LogoutButton />` in top-right |
| `src/app/shared/LogoutButton.tsx` | Create — form-based logout button |
| `src/worker.tsx` | Add `POST /logout` route |
| `README.md` | Add "Password requirements" section |

---

## Out of scope

- Route guards / redirect-if-unauthenticated for `/app` and `/profile` (next spec)
- Showing user info (name, email) on protected pages (next spec)
- Social login / OAuth providers
- Email verification flows
- "Forgot password" / password reset
