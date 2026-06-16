# Feature Specs

Specs for the Contract Review app, generated from `blueprint/app-plan.md` using the
`create-spec` reference templates and reconciled against the implemented code. Each
spec links to the files that implement it.

| Spec | Feature | Implemented in |
|---|---|---|
| [database-spec.md](./database-spec.md) | Supabase schema (users, sessions, messages, feedback) | `supabase/schema.sql`, `lib/types.ts`, `lib/db.ts` |
| [auth-spec.md](./auth-spec.md) | Custom email/password auth (bcrypt + localStorage) | `app/signup`, `app/login`, `app/api/auth/*`, `lib/auth.ts`, `lib/session.ts`, `lib/useAuthGuard.ts` |
| [dashboard-spec.md](./dashboard-spec.md) | Dashboard KPIs + 3-panel chat shell | `app/dashboard`, `app/chat`, `components/Sidebar.tsx`, `components/SessionItem.tsx`, `components/RightPanel.tsx`, `app/api/dashboard`, `app/api/sessions` |
| [chat-spec.md](./chat-spec.md) | Contract Q&A chat + Azure pipeline | `app/chat/page.tsx`, `components/chat/*`, `app/api/chat`, `app/api/messages`, `lib/azure.ts` |
| [file-upload-spec.md](./file-upload-spec.md) | PDF/DOCX client-side parsing + preview | `lib/parse.ts`, `components/chat/FileAttach.tsx`, `components/DocumentPreview.tsx` |
| [feedback-spec.md](./feedback-spec.md) | Per-answer 1–5 star feedback | `components/FeedbackForm.tsx`, `app/api/feedback`, `lib/db.ts` |

## Status
All P0 features for v0.1–v1.0 are implemented and build clean. Deferred (post-MVP):
streaming responses, infinite scroll, password reset, PDF export, mobile layout,
production MSAL OAuth.

## Notable deviations from the original templates/PRD
- `feedback` carries a `message_id` FK (ratings tie to a specific assistant message).
- pdfjs-dist is **v6** (templates referenced v4) — worker + dynamic-import setup differs.
- 8 dashboard KPIs ship (PRD listed 13); the rest need data not in the MVP schema.
- LLM integration uses the **Azure AI Foundry Agents API** (per `knowledge/azure-endpoint.md`), not Azure OpenAI as the PRD text says.
- API auth uses a client-supplied `x-user-id` header (localStorage model) — harden with signed tokens before production.
