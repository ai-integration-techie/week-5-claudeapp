# Legal Contract Review App — Implementation Plan

**Source PRD:** `PRD.md` (AI Document Assistant, v1.1)
**Authoritative refs:** `.claude/knowledge/design-system.md`, `.claude/knowledge/azure-endpoint.md`, `.claude/skills/rules/rules.md`, `.claude/skills/create-spec/reference/*`
**Status:** Draft — awaiting confirmation before implementation
**Scope of this plan:** v0.1 → v1.0 P0 features (single-turn through full session history, feedback, execution panel)

---

## 1. Requirements Restatement

Build a legal contract review web app where a user can:

1. **Sign up / log in** against a **custom Supabase `users` table** (bcryptjs hash, **no Supabase Auth**). `userId` + `userEmail` stored in `localStorage`.
2. Land on a **three-panel dashboard/chat shell**:
   - **Left sidebar (256px):** New Chat button, searchable/filterable session list, pin/rename/delete, user footer.
   - **Center (flex-1):** chat interface — message list, composer with file-attach button.
   - **Right panel (304px):** live **execution steps** trace (Cowork-style) + document preview.
3. **Upload a PDF or DOCX** contract (≤10MB), parsed **client-side** to plain text (`pdfjs-dist` / `mammoth`).
4. **Type a question** → app sends **`contractText` + `userMessage`** to a **server-side `/api/chat`** route → **Azure AI agent** → response rendered in chat.
5. **Persist** sessions and messages in Supabase; auto-save each user message before the API call.
6. After **every assistant response**, show a **feedback form** (1–5 stars + optional comment) → saved to Supabase `feedback`.

**Deliverable also requested:** dedicated **Database Schema** section with complete Supabase PostgreSQL `CREATE TABLE` SQL (see §9).

---

## 2. Critical Decisions & Discrepancies (resolve before/at build)

| # | Topic | PRD says | Authoritative source says | Plan decision |
|---|---|---|---|---|
| D1 | LLM integration | "Azure OpenAI GPT-4o" | `azure-endpoint.md`: **Azure AI Foundry Agents threads API**, Bearer token, `api-version=2025-05-01`, `asst_xxx`, **not** `@azure/openai` | **Follow `azure-endpoint.md`** — Agents REST API via `/api/chat`. Flag to stakeholders. |
| D2 | Azure auth | — | Bearer token only; API key fails. OAuth (`@azure/msal-node`) for user flow, or `DefaultAzureCredential` + `az login` for local dev | **Local dev:** `az login` + `DefaultAzureCredential`. **Prod:** MSAL OAuth (deferred to a later phase). |
| D3 | Next.js version | "Next.js 14" | Repo currently on **Next.js 16.2.9 + React 19** (upgraded this session) | Build on **16/React 19**; update spec text to match. App Router patterns unchanged. |
| D4 | RLS | "Enforce Row-Level Security" (Risk row) | Custom auth means no `auth.uid()` | **No Supabase Auth → `auth.uid()` RLS is unavailable.** Enforce ownership at the **API layer** (every query scoped by `user_id`). Use the **service role key server-side only**; never expose it. See §9 note. |
| D5 | `.env.local` key | — | Current file has `sb_secret_…` under `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Fix before build:** anon/publishable key for client; secret/service key server-only (un-prefixed). Rotate the exposed secret. |
| D6 | Feedback granularity | "after every assistant message" | `feedback` template supports per-item rating | Add **`message_id`** FK to `feedback` so a rating ties to a specific assistant message; unique `(user_id, message_id)`. |

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + `an-` design tokens (`design-system.md`) |
| DB | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Auth | Custom `users` table + `bcryptjs` (10 rounds); `localStorage` session |
| LLM | Azure AI Foundry Agents REST API (server-side only) |
| Azure auth | `@azure/identity` (`DefaultAzureCredential`, local) → `@azure/msal-node` (OAuth, prod) |
| PDF parse | `pdfjs-dist` (client) |
| DOCX parse | `mammoth` (client) |
| Icons | `lucide-react` (1.5px stroke) |
| Hosting | Vercel |

---

## 4. Architecture & State Ownership

```
app/
├── layout.tsx                  # root: fonts, globals, dark theme default
├── globals.css                 # CSS vars (an- tokens), fonts, an-fade-in
├── page.tsx                    # landing (FR-001) — redirect to /dashboard if logged in
├── signup/page.tsx             # FR-002 (light theme)
├── login/page.tsx              # FR-003 (light theme)
├── dashboard/page.tsx          # FR-005/006/007 KPIs + activity + recent chats
├── chat/
│   ├── layout.tsx              # 3-panel shell (sidebar/center/right)
│   └── page.tsx                # OWNS shared state (see below)
└── api/
    ├── auth/signup/route.ts    # FR-002
    ├── auth/login/route.ts     # FR-003
    ├── sessions/route.ts       # GET list, POST create
    ├── sessions/[id]/route.ts  # PATCH rename/pin, DELETE (cascade)
    ├── messages/route.ts       # GET history (paginated), POST create
    ├── chat/route.ts           # FR-012 Azure call (contractText + userMessage)
    └── feedback/route.ts       # FR-020 save rating

lib/
├── supabase.ts                 # browser client (anon key)
├── supabase-server.ts          # server client (service role key)
├── db.ts                       # typed helpers (see §6 Phase 2)
├── azure.ts                    # Agents API client: thread→message→run→poll
├── auth.ts                     # hash/compare, localStorage helpers
└── parse.ts                    # pdfjs-dist + mammoth → text + blob URL

components/
├── Sidebar.tsx, SessionItem.tsx, SessionContextMenu.tsx
├── ChatArea.tsx, MessageList.tsx, MessageBubble.tsx, Composer.tsx
├── FileAttach.tsx              # holds NO state — calls onFileLoaded callback
├── RightPanel.tsx, ExecutionSteps.tsx, DocumentPreview.tsx, PDFViewer.tsx
└── FeedbackForm.tsx
```

**Shared context state — owned by `chat/page.tsx` (parent), never the input:**
- `contractText`, `filename`, `previewUrl`, `fileType` — from `onFileLoaded(text, filename, previewUrl, fileType)` (file-upload spec)
- `activeSessionId`, `messages[]`, `streaming/loading` flags
- `executionStep` state machine: `parsing → sending → waiting → completed | error` (FR-015)
- `ratingTargetMessageId` — which assistant message the feedback form is bound to

**Why parent-owned:** the composer, right panel preview, execution trace, and feedback form all read the same document/session context; it must outlive any single child and survive message sends (FR-018).

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Azure Agents Bearer-token auth misconfig (D1/D2) | **High** | High | Build `lib/azure.ts` against `azure-endpoint.md` exactly; verify `az login` works before Phase 6; surface 401/403 as user-facing errors |
| Service role key leaking to client (D4/D5) | Medium | **Critical** | Service key only in `lib/supabase-server.ts`; never `NEXT_PUBLIC_`; rotate exposed key now |
| Scanned PDF yields empty text (FR-010) | High | Medium | Detect empty/low-char extraction → block with clear message |
| Document exceeds context window | Medium | Medium | Truncate at ~80k tokens, warn user |
| No RLS (custom auth) → cross-user data access | Medium | **Critical** | Every DB query scoped by `user_id` at API layer; ownership check on session/[id] routes |
| KPI queries slow at scale | Low | Medium | Indexes on `user_id` + `created_at`; derive on read (MVP) |
| Next 16/React 19 vs specs written for 14 | Low | Low | App Router APIs compatible; update spec text |

---

## 6. Phased Build Plan

Each phase ends **green** (typechecks/builds) before the next. Right panel updates with phase status during dev per `implementation.md`.

### Phase 0 — Foundation fixes (pre-req)
- Fix `.env.local` (D5): anon key for client, service role server-only, rotate secret.
- Add Tailwind + `an-` tokens to `globals.css` + `tailwind.config.ts`; import Inter/Lora/JetBrains Mono.
- Convert scaffold `.jsx` → `.tsx`, add `tsconfig.json`.
- Install deps: `@supabase/supabase-js bcryptjs @azure/identity @azure/msal-node pdfjs-dist mammoth lucide-react`.

### Phase 1 — Supabase + DB layer
- Run schema SQL (§9) in Supabase SQL editor.
- `lib/supabase.ts` (browser), `lib/supabase-server.ts` (server/service role).
- `lib/db.ts` helpers: `getUser`, `createUser`, `createSession`, `getSessions`, `updateSession`, `deleteSession`, `createMessage`, `getMessages`, `createFeedback`, `getFeedback`, KPI aggregates.

### Phase 2 — Auth (FR-002/003/004/033)
- `/signup` + `/login` pages (light theme, centered card).
- `api/auth/signup`: email-exists check → bcrypt hash → insert.
- `api/auth/login`: lookup → compare → return `{ userId, email }` (generic error, no enumeration).
- `localStorage` set on success; auth guard on dashboard/chat; logout clears + redirects.

### Phase 3 — Dashboard (FR-005/006/007)
- KPI card grid (derive on read from sessions/messages/feedback), activity feed, recent chats, New Chat → creates session → `/chat`.

### Phase 4 — Chat shell (FR-008)
- 3-panel layout (256 / flex-1 / 304); `chat/page.tsx` state container; Sidebar + RightPanel scaffolding.

### Phase 5 — File upload + preview (FR-009/010/011/016/017/018)
- `FileAttach` (PDF/DOCX, ≤10MB, type/size validation) → `lib/parse.ts` → `onFileLoaded`.
- pdfjs worker copied to `/public`; blob URL for preview; scanned-PDF detection.
- RightPanel preview: PDF iframe/viewer, DOCX `<pre>` truncated 4k chars; persists while chatting.

### Phase 6 — Azure chat pipeline (FR-012/013/015) — highest risk
- `lib/azure.ts`: create thread → add message (contractText as context) → run with `AZURE_AGENT_ID` → poll until `completed`/`failed` → return assistant text.
- `api/chat`: read token (cookie/DefaultAzureCredential), 401 if missing; body `{ contractText, userMessage, sessionId }`; system prompt from PRD §Prompt Strategy.
- ExecutionSteps drives parsing→sending→waiting→completed/error.
- Auto-save user message before call (FR-030); save assistant message after.

### Phase 7 — Sessions management (FR-021–029, 032)
- Auto-title (first 55 chars, only if still default); list with status/timestamps; search; status filter; pin/rename/delete (cascade); reopen loads full history (clear stale first).

### Phase 8 — Feedback (FR-019/020)
- `FeedbackForm` appears after each assistant message; 1–5 stars + comment; `api/feedback` insert; unique `(user_id, message_id)`; confirmation + auto-dismiss.

### Phase 9 — Hardening
- Landing page + redirect; error states everywhere; timestamps; loading skeletons; build + manual flow test; security pass (no secrets client-side, ownership checks).

**Deferred (post-MVP per roadmap):** streaming SSE (FR-014), infinite scroll (FR-031), password reset (FR-034), PDF export (FR-035), mobile (FR-036), MSAL prod OAuth.

---

## 7. Dependencies

- **External:** Supabase project (URL, anon key, service role key); Azure AI Foundry agent (`asst_xxx`, endpoint URL), `az login` for local dev; Azure App Registration for prod OAuth.
- **Internal:** Phase order is mostly linear; Phase 6 (Azure) is independent of 3/4/5 and can be spiked early to de-risk D1/D2.

## 8. Complexity Estimate

**Overall: HIGH** (multi-surface app: auth + 3-panel UI + client file parsing + server Azure agent + persistence + feedback).

| Area | Est. |
|---|---|
| Foundation + DB + auth (P0–2) | 6–9h |
| Dashboard + chat shell (P3–4) | 5–7h |
| Upload/preview + Azure pipeline (P5–6) | 8–12h |
| Sessions + feedback + hardening (P7–9) | 7–10h |
| **Total** | **~26–38h** |

---

## 9. Database Schema (Supabase PostgreSQL)

> **RLS note (D4):** This app uses a **custom `users` table, not Supabase Auth**, so `auth.uid()`-based RLS does not apply. Ownership is enforced at the **API layer** (every query scoped by `user_id`), and the server uses the **service role key**. If you later want defense-in-depth, enable RLS with policies keyed off a signed app claim — out of scope for MVP. Run the SQL below in **Supabase → SQL Editor**.

```sql
-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- =========================================================
-- updated_at trigger function
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- users
-- =========================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,                 -- bcryptjs, 10 rounds
  created_at    timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (lower(email));

-- =========================================================
-- sessions
-- =========================================================
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text not null default 'New session',
  status     text not null default 'idle'
             check (status in ('idle', 'processing', 'completed', 'error')),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id    on public.sessions (user_id);
create index if not exists idx_sessions_updated_at on public.sessions (user_id, updated_at desc);
create index if not exists idx_sessions_pinned     on public.sessions (user_id, pinned);

create trigger trg_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- =========================================================
-- messages
-- =========================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session_created
  on public.messages (session_id, created_at);

-- Bump the parent session's updated_at whenever a message is added
create or replace function public.touch_session_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

create trigger trg_messages_touch_session
  after insert on public.messages
  for each row execute function public.touch_session_on_message();

-- =========================================================
-- feedback   (one rating per user per assistant message)
-- =========================================================
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id)    on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists idx_feedback_session on public.feedback (session_id);
create index if not exists idx_feedback_user    on public.feedback (user_id);
```

**Cascade behavior:** deleting a user removes their sessions, messages, and feedback; deleting a session removes its messages and feedback (FR-025).

---

## 10. Open Questions (carry from PRD §11)

1. Confirm Azure endpoint/model deployment + subscription owner (blocks Phase 6).
2. Scanned-doc handling: block (MVP) vs OCR later — plan assumes **block**.
3. Document-text retention: plan assumes **not persisted** post-session (only parsed text in component state).
4. KPI source: plan assumes **derive on read** (no analytics table).
5. Pinned storage: plan uses **`sessions.pinned`** column (recommended).

---

**WAITING FOR CONFIRMATION** — reply `yes`/`proceed` to start Phase 0, `modify: …` to adjust, or tell me to spike Phase 6 (Azure) first to de-risk the integration.
```
