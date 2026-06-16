# Feedback Spec — Contract Review

> Source: `blueprint/app-plan.md` Phase 8. Implemented in
> `components/FeedbackForm.tsx`, `app/api/feedback/route.ts`, `lib/db.ts`
> (`createFeedback`).

## Feature Name
Response Feedback (per-answer rating)

## Description
After **every persisted assistant message**, a feedback widget appears: **1–5 stars**
plus an optional comment. Stored in the `feedback` table, linked to the specific
`message_id` (and its `session_id` + `user_id`). One rating per user per message
(enforced by a unique constraint; repeat submissions upsert).

## User Flow
1. An assistant response is rendered (real DB id, not pending/optimistic).
2. The feedback card renders directly beneath it (via `MessageList`'s `renderAfter`
   slot).
3. User clicks a star (1–5); a comment textarea + Submit then appear.
4. On submit → `POST /api/feedback`; on success a "Thanks for your feedback."
   confirmation replaces the form and **auto-dismisses after 2.5s**.
5. The user can ignore it (no dismiss action required); it simply stays until rated.

## Placement
Inline, in the message flow beneath the assistant bubble (not floating). Card:
`an-bg-surface`, `border an-border`, radius 8px, max-width 420px, `an-fade-in`.

## DB Schema
`feedback` table — see `database-spec.md`:
- `id` UUID PK · `user_id`/`session_id`/`message_id` UUID FKs (cascade) ·
  `rating` INTEGER CHECK 1–5 · `comment` TEXT nullable · `created_at`.
- **UNIQUE (user_id, message_id)** · CHECK `rating between 1 and 5` · cascade deletes.

## DB Tasks
Created by `supabase/schema.sql` (table + `idx_feedback_session`,
`idx_feedback_user` + unique constraint).

## DB Helper
`createFeedback({ userId, sessionId, messageId, rating, comment })` — **upsert** on
conflict target `user_id,message_id`, returns the row. (So re-rating updates rather
than erroring.)

## API Route — `POST /api/feedback`
Auth `x-user-id`. Body `{ sessionId, messageId, rating, comment? }`.
- Ownership check via `getSession(sessionId, userId)`.
- Validates `rating` is a number in 1–5.
- `201` `{ feedback }` · `400` missing/invalid fields · `404` session not owned ·
  `500` error.

## State Management
The chat page decides **when** to render the form (assistant role, not pending, real
id, active session) via `renderAfter`. The `FeedbackForm` itself owns rating / hover /
comment / submitting / done / dismissed — fully encapsulated; the parent only passes
`sessionId` and `messageId`.

## Component (`components/FeedbackForm.tsx`)
Props: `sessionId`, `messageId`. Submit disabled until `rating ≥ 1`. On success:
confirmation + 2.5s auto-dismiss (then renders nothing). Parent needs to know nothing
about submission internals.

## Design
- Header: "Rate this answer" + 5 star buttons (active = filled `an-accent`).
- Comment: textarea on `an-bg-base`, appears only after a star is chosen.
- Submit: small accent button; disabled while saving ("Saving…").
- Confirmation: `an-success` caption.

## Edge Cases
| Case | Handling |
|---|---|
| Dismiss without submitting | Form persists; no write occurs |
| Duplicate feedback for same message | Upsert updates existing row |
| Save fails | Inline `an-error` message; form stays for retry |
| Session/message changes | Each form is keyed to its own message id; unaffected |
| Optimistic/pending assistant | No form shown until the real persisted id exists |
