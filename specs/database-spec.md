# Database Spec — Contract Review

> Source: `blueprint/app-plan.md` §9. Implemented in `supabase/schema.sql`,
> typed in `lib/types.ts`, accessed via `lib/db.ts`.

## Feature Name
Database Schema (Supabase PostgreSQL)

## Description
Four tables back the app: `users` (custom auth), `sessions` (one contract
conversation each), `messages` (chat turns), and `feedback` (per-answer ratings).
No Supabase Auth is used; ownership is enforced at the API layer (every query
scoped by `user_id`) using the **service role key** server-side only. `auth.uid()`
RLS is therefore not applicable — see plan decision D4.

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, `gen_random_uuid()` |
| email | TEXT | Unique; stored lowercase |
| password_hash | TEXT | bcryptjs, 10 rounds |
| created_at | TIMESTAMPTZ | `now()` |

Index: `idx_users_email` on `lower(email)`.

### `sessions`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, **cascade delete** |
| title | TEXT | Default `'New session'`; auto-set to first 55 chars of first user message |
| status | TEXT | CHECK in `idle / processing / completed / error`; default `idle` |
| pinned | BOOLEAN | Default `false` |
| created_at | TIMESTAMPTZ | `now()` |
| updated_at | TIMESTAMPTZ | `now()`; bumped by trigger on update + on new message |

Indexes: `(user_id)`, `(user_id, updated_at desc)`, `(user_id, pinned)`.
Trigger: `trg_sessions_updated_at` (BEFORE UPDATE → `set_updated_at`).

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| session_id | UUID | FK → sessions.id, **cascade delete** |
| role | TEXT | CHECK in `user / assistant` |
| content | TEXT | Full message text |
| created_at | TIMESTAMPTZ | `now()` |

Index: `(session_id, created_at)`.
Trigger: `trg_messages_touch_session` (AFTER INSERT → bumps parent
`sessions.updated_at`). Verified firing in smoke tests.

### `feedback`
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, **cascade delete** |
| session_id | UUID | FK → sessions.id, **cascade delete** |
| message_id | UUID | FK → messages.id, **cascade delete** (the rated assistant message) |
| rating | INTEGER | CHECK `between 1 and 5` |
| comment | TEXT | Nullable |
| created_at | TIMESTAMPTZ | `now()` |

Constraint: `UNIQUE (user_id, message_id)` — one rating per user per message.
Indexes: `(session_id)`, `(user_id)`.

## DB Tasks — What to Create
Run `supabase/schema.sql` once in the Supabase SQL editor. It is idempotent
(`create … if not exists`, `drop trigger if exists`). It also enables `pgcrypto`
for `gen_random_uuid()` and defines `set_updated_at()` and
`touch_session_on_message()`.

## Helper Functions (`lib/db.ts`)
All run server-side via `supabaseAdmin` (service role):
- `getUser(email)` / `createUser(email, hash)`
- `createSession(userId, title?)` / `getSessions(userId)` / `getSession(id, userId)` (ownership) / `updateSession(id, userId, fields)` / `deleteSession(id, userId)`
- `createMessage(sessionId, role, content)` / `getMessages(sessionId, limit?)`
- `createFeedback({userId, sessionId, messageId, rating, comment})` — upsert on `(user_id, message_id)`
- `getDashboardKpis(userId)` — derived on read (no analytics table)

## Cascade Behavior
Deleting a user → removes their sessions, messages, feedback. Deleting a session →
removes its messages and feedback (FR-025). Verified in smoke tests.

## Edge Cases
- Duplicate email signup → unique constraint surfaces as `409`.
- Duplicate feedback for the same message → upsert updates the existing row.
- Cross-user access → `getSession(id, userId)` returns null → API responds `404`.
