# Dashboard Spec — Contract Review

> Source: `blueprint/app-plan.md` Phase 3 & Phase 4. Implemented in
> `app/dashboard/page.tsx`, `components/KpiCard.tsx`, `app/api/dashboard/route.ts`,
> and the chat shell (`app/chat/page.tsx`, `components/Sidebar.tsx`,
> `components/RightPanel.tsx`).

## Feature Name
Dashboard + 3-panel App Shell

## Description
Two surfaces:
1. **`/dashboard`** — post-login home: KPI grid + recent chats + New Chat.
2. **`/chat`** — the three-panel workspace (sidebar / chat / right panel).

## Layout
### Dashboard (`/dashboard`)
Single centered column (max 1080px): header (title + New chat + Log out), KPI grid,
Recent chats.

### Chat shell (`/chat`)
```
┌───────────────────────────────────────────────────────────┐
│ Sidebar 256px │ Chat center flex-1        │ Right 304px     │
│ bg-subtle     │ bg-base                   │ bg-subtle        │
└───────────────────────────────────────────────────────────┘
```
The chat **center** changes from an empty hint → message list once a session is
active. The **right panel** shows the document preview (when attached) and the live
execution trace.

## State Architecture
`app/chat/page.tsx` (`ChatWorkspace`) owns all shared state and why it must live there:
- `sessions[]`, `activeId` — sidebar + center both need it.
- `messages[]`, `loadingMessages` — center list; cleared on session switch.
- `doc` (parsed contract) — composer reads it to send; right panel previews it; must
  outlive the file-input component (FR-018).
- `execStep` — driven by the send flow; rendered by the right panel.
- `sending`, `error`.

Callbacks to children: `onNewChat`, `onSelect`, `onRename(id,title)`,
`onTogglePin(id,pinned)`, `onDelete(id)`, `onLogout`, `onSend(text)`,
`onFileLoaded(doc)`, `removeFile`.

## Home / Default View — KPI Cards
Eight cards (`components/KpiCard.tsx`), derived on read in `getDashboardKpis`:
Documents (sessions), Today, Total queries (user messages), Queries this week,
Active sessions (updated in 7d), Pinned chats, Avg rating (from feedback), Failed
jobs (status=error). Loading → skeleton pulse; missing value → `—`.

> Note: the PRD lists 13 KPIs; the MVP ships the 8 derivable from existing tables.
> The rest (reports generated, clauses extracted, storage used, avg processing time)
> are v1.1 — they need columns/data not in the MVP schema.

### Recent Chats
Last 5 sessions as cards (icon, title, relative updated time) → open `/chat?session=ID`.
Empty state prompts starting the first chat.

## Sidebar (`components/Sidebar.tsx`)
Top→bottom: logo, **New chat** (accent), **Search** input, **Filter tabs**
(All / Pinned / Recent / Processing / Completed / Error), scrollable session list,
user footer (avatar initial, email, logout). Width 256px, `an-bg-subtle`.

- **Search** is client-side, filters by title, **composes with** the active filter.
- **Filter tabs** logic in `matchesFilter`. Default `All`.
- **Item** (`components/SessionItem.tsx`): status icon, truncated title, pin dot,
  relative time (hidden on hover), `⋯` menu → Pin/Unpin, Rename (inline), Delete
  (confirm). Active = `bg-an-bg-elevated`.
- **Status icons**: idle=Circle(muted), processing=Loader2(spin/accent),
  completed=CheckCircle2(success), error=AlertCircle(error).

## Right Panel (`components/RightPanel.tsx`)
Width 304px. Top: **Document** preview (`DocumentPreview` when attached, else empty
hint). Bottom: **Execution** trace (`ExecutionSteps`).

## API Routes
### `GET /api/dashboard`
Auth via `x-user-id`. Returns `{ kpis, recentSessions: Session[] (≤5) }`.
### `GET /api/sessions` / `POST /api/sessions`
List (pinned first, recent first) / create. See chat & sessions usage.
### `PATCH /api/sessions/[id]` / `DELETE /api/sessions/[id]`
Rename/pin/status / cascade delete. (FR-023/024/025)

## Components
| Component | File | Responsibility |
|---|---|---|
| DashboardPage | app/dashboard/page.tsx | KPIs + recent + new chat |
| KpiCard | components/KpiCard.tsx | One metric, skeleton/`—` states |
| Sidebar | components/Sidebar.tsx | Nav, search, filters, list, footer |
| SessionItem | components/SessionItem.tsx | Row + status icon + context menu + rename |
| RightPanel | components/RightPanel.tsx | Preview + execution sections |

## Edge Cases
- No sessions → empty states on both dashboard and sidebar.
- Dashboard load failure → inline error, KPIs show `—`.
- Delete active session → active cleared, route reset to `/chat`.
- Empty rename → rejected (`400`), reverts to previous title.
- Filter + search with zero matches → "No matching chats."
- Rapid session switching → stale messages cleared immediately before load (FR-028).
