# Auth Spec — Contract Review

> Source: `blueprint/app-plan.md` Phase 2. Implemented in `app/signup`, `app/login`,
> `app/api/auth/*`, `lib/auth.ts`, `lib/session.ts`, `lib/useAuthGuard.ts`.

## Feature Name
Signup and Login (custom email/password)

## Description
Email/password auth against a custom `users` table — **no Supabase Auth**.
Passwords are hashed with **bcryptjs (10 rounds)**. On success the client stores
`userId` and `userEmail` in `localStorage` and is redirected to `/dashboard`.
API routes authenticate subsequent requests via an `x-user-id` header.

## User Flow — Signup
1. User visits `/signup` (light-theme centered card, `AuthForm mode="signup"`).
2. Fills **email** + **password**.
3. Client validation: HTML `required` + email type; server re-validates.
4. `POST /api/auth/signup` with `{ email, password }`.
5. Server: validate email format + password ≥ 8 chars → `getUser(email)` existence
   check → `hashPassword` → `createUser`.
6. Returns `{ userId, email }` (`201`).
7. Client calls `setSession(userId, email)` → `localStorage` → `router.replace('/dashboard')`.

## User Flow — Login
1. User visits `/login` (`AuthForm mode="login"`).
2. Fills email + password.
3. `POST /api/auth/login`.
4. Server: `getUser(email)` → `comparePassword`. **Generic error** on any failure
   (no field enumeration).
5. Returns `{ userId, email }` (`200`) → client stores session → `/dashboard`.

## DB Schema
`users` table — see `database-spec.md`. Email unique (lowercased), PK
`gen_random_uuid()`, `password_hash` bcrypt.

## API Routes
### `POST /api/auth/signup`
- Body: `{ email, password }`
- `201` `{ userId, email }` · `400` invalid email / password < 8 · `409` email exists · `500` server error

### `POST /api/auth/login`
- Body: `{ email, password }`
- `200` `{ userId, email }` · `401` `"Invalid email or password."` (generic) · `400` bad body · `500` server error

## Components
- `app/login/page.tsx` / `app/signup/page.tsx` — thin wrappers rendering `AuthForm`.
- `components/AuthForm.tsx` — shared form (mode-driven copy, validation, submit,
  error display, redirect-if-already-logged-in).
- `data-theme="light"` wrapper applies the light token palette.

## Auth Guard
`lib/useAuthGuard.ts` (`useAuthGuard()`): on mount reads `getUserId()`; if absent →
`router.replace('/login')`; otherwise returns the userId. Used by `/dashboard` and
`/chat`. (FR-004)

## Important Implementation Notes
- localStorage keys: `userId`, `userEmail` (`lib/session.ts`).
- Email stored and compared lowercase.
- API auth uses the `x-user-id` header injected by `lib/api.ts` (`apiFetch`).
  Server reads it via `lib/api-auth.ts` (`getRequestUserId`). **This trusts the
  client-provided id** — acceptable for the localStorage MVP model; harden with
  signed tokens before production.
- Service role key is server-only; never shipped to the client.

## Design
- Light theme; page bg `an-bg-base`; 400px max-width card; `an-fade-in` entrance.
- Heading `text-display` font-display; inputs 36px per design system; primary
  accent button; errors in `an-error`.

## Edge Cases
| Case | Handling |
|---|---|
| Invalid email format | `400`, inline error |
| Password < 8 chars | `400` `"Password must be at least 8 characters."` |
| Email already exists (signup) | `409` inline error |
| Wrong email or password (login) | Generic `401`, no enumeration |
| Already logged in visits auth page | Redirect to `/dashboard` |
| Network failure | Inline "Network error. Please try again." |
