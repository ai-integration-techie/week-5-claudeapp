# Contract Review

AI-assisted legal contract review. Upload a PDF/DOCX contract, ask questions, and
get grounded answers from an Azure AI agent — with persistent chat history and
per-answer feedback.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (custom auth)
· Azure AI Foundry Agents · pdfjs-dist · mammoth.

---

## Setup

### 1. Database
Run `supabase/schema.sql` once in **Supabase → SQL Editor**. It creates the
`users`, `sessions`, `messages`, and `feedback` tables with indexes and triggers.

### 2. Environment (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # publishable / anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=       # secret key — server-only, never NEXT_PUBLIC

# Azure AI Foundry Agents (server-only)
AZURE_AGENT_ENDPOINT_URL=        # https://<name>.services.ai.azure.com/api/projects/<project>
AZURE_AGENT_ID=                  # asst_xxx (not the display name)
# Prod auth (optional locally — see below):
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=
```

### 3. Azure auth
- **Local dev:** run `az login` — the app uses `DefaultAzureCredential`.
- **Prod/CI:** set `AZURE_CLIENT_ID/SECRET/TENANT_ID` (app registration) — the app
  uses `ClientSecretCredential`.

### 4. Run
```bash
npm install
npm run dev      # http://localhost:3000
```

---

## Architecture notes

- **Auth:** custom `users` table + bcryptjs (no Supabase Auth). `userId` is kept in
  `localStorage`; API routes receive it via the `x-user-id` header and scope every
  query by it. (Harden with signed tokens before production.)
- **Azure:** only ever called from `/api/chat` (server-side). Bearer token, API
  version `2025-05-01`, thread → message → run → poll. See
  `.claude/knowledge/azure-endpoint.md`.
- **File parsing:** PDF/DOCX parsed in the browser; only extracted text is sent to
  the backend. Raw files never leave the client.
- **Design system:** `an-` tokens in `app/globals.css` / `tailwind.config.ts`.

## Deferred (post-MVP)
Streaming responses, infinite scroll, password reset, PDF export, mobile layout,
and production MSAL OAuth flow.
