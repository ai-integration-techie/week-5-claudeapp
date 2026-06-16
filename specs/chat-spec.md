# Chat Spec — Contract Review

> Source: `blueprint/app-plan.md` Phases 4 & 6. Implemented in `app/chat/page.tsx`,
> `components/chat/*`, `app/api/chat/route.ts`, `app/api/messages/route.ts`,
> `lib/azure.ts`.

## Feature Name
Chat Interface (contract Q&A)

## Description
The user attaches a contract and asks questions; an **Azure AI Foundry agent**
answers, grounded in the contract text. Responses are returned **whole** (not
streamed in MVP; streaming is FR-014/v1.1). All turns persist in Supabase and reload
across sessions.

## User Flow
1. New chat created (from dashboard or sidebar) → `/chat?session=ID`.
2. **Prerequisite:** attach a PDF/DOCX (see `file-upload-spec.md`). Sending without a
   document is blocked with inline guidance.
3. On send: optimistic user bubble + a pending assistant bubble ("Thinking…") appear
   immediately; execution trace starts.
4. Response arrives as a single message; pending bubble is replaced by the persisted
   assistant message; a **feedback form** appears beneath it (see `feedback-spec.md`).
5. Reopen a past chat from the sidebar → full history reloads; user can continue.

## Shared Context State — CRITICAL
The **contract** must travel with every message. It is owned by `app/chat/page.tsx`
(parent), not the composer, as `doc: ParsedDocument | null` (`text`, `filename`,
`previewUrl`, `fileType`). It flows down to the composer (to send `doc.text`) and the
right panel (to preview). On session switch it is **cleared** (and blob URL revoked) —
documents are not reloaded on reopen (FR-029).

## Message Rendering (`components/chat/MessageBubble.tsx`)
- **User**: right-aligned, `an-accent-subtle` bubble, border-radius `12 12 4 12`, max
  75% width, timestamp below.
- **Assistant**: left, no bubble, coral dot prefix, text on `bg-base`, max 680px.
  Pending state renders muted "Thinking…".
- Markdown not rendered in MVP (plain text, `whitespace-pre-wrap`).

**Timestamps** (`lib/format.ts` `formatMessageTime`): `HH:MM` for today, `Mon D HH:MM`
for older (FR-032).

## Streaming
Not in MVP — single-response fetch. Streaming SSE is deferred (FR-014).

## Conversation History
- Persisted in `messages`. The user message is written **before** the AI call
  (FR-030); the assistant message after the run completes.
- Reopen: `GET /api/messages?sessionId=…` (ascending, ≤200). Stale messages cleared
  immediately on session change to prevent flash (FR-028).
- Load errors surface inline (never silently swallowed).

## Components
| Component | Responsibility | Key props |
|---|---|---|
| ChatWorkspace (page) | Owns all state; orchestrates send | — |
| MessageList | Scrollable list + auto-scroll + `renderAfter` slot | messages, loading, renderAfter |
| MessageBubble | One message (user/assistant/pending) | message |
| Composer | Auto-grow textarea, attach slot, file chip, send | onSend, isLoading, disabled, attachButton, fileChip |

## Optimistic Updates
- On send: temp user (`optimistic-<ts>`) + pending assistant (`pending-<ts>`) added.
- Success: pending assistant replaced by `{ id, content, created_at }` from the API.
- Failure: pending assistant removed, `execStep='error'`, inline error shown.

## API Route — `POST /api/chat`
Auth `x-user-id`. Body `{ sessionId, contractText, userMessage }`. Steps: ownership
check → set session `processing` → `runContractQuery(contractText, userMessage)` →
persist assistant message → auto-title if still default → set `completed`. Returns
`{ message }`. Errors → session `error`, `502` with a user-facing message. (FR-012)

### Azure pipeline (`lib/azure.ts`)
Bearer token (`DefaultAzureCredential` local / `ClientSecretCredential` prod),
API version `2025-05-01`: create thread → add message (contract + question prompt,
capped ~80k tokens) → run with `AZURE_AGENT_ID` → poll (≤50s) until `completed` →
return latest assistant text. 401/403 surfaced as an auth error.

### `GET/POST /api/messages`
History (ownership-checked) / persist a single message.

## Execution Steps (right panel, FR-015)
`ExecStep`: `idle → parsing → sending → waiting → completed | error`. Driven by the
send flow; rendered by `components/ExecutionSteps.tsx`.

## Auto-Generated Titles
On the first turn, if `title === 'New session'`, set it to the first user message's
first 55 chars (+`…` if longer). Never overwrites a manual rename. (FR-021)

## Edge Cases
- Send with no document → blocked, inline guidance.
- Empty/whitespace message → send disabled.
- Azure timeout (>50s) → error step + retry-able message.
- Azure auth/permission failure → "Azure rejected the request (auth)…".
- Switching sessions mid-flight → in-flight result targets its own pending id; new
  session starts clean (messages + doc cleared).
- Very long response → rendered fully; list scrolls.
