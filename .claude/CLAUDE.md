# Claude Instructions

Read ALL of these files before doing anything else:
- @skills/rules/rules.md
- @knowledge/design-system.md
- @knowledge/azure-endpoint.md
- @skills/implementation/implementation.md
- @skills/create-spec/reference/database-spec-template.md
- @skills/create-spec/reference/auth-spec-template.md
- @skills/create-spec/reference/chat-spec-template.md
- @skills/create-spec/reference/dashboard-spec-template.md
- @skills/create-spec/reference/file-upload-spec-template.md
- @skills/create-spec/reference/feedback-spec-template.md

## Current State

- PRD: complete in PRD.md (sections: Problem, Solution, Functional Requirements, Roadmap, Risks, Evaluations, Responsible AI, Pricing, Open Questions, Assumptions)
- Plan: complete in blueprint/app-plan.md (phased build + full SQL schema)
- Feature specs: complete in specs/ (database, auth, dashboard, chat, file-upload, feedback) — see specs/README.md
- Database schema: supabase/schema.sql (run once in Supabase SQL editor); documented in specs/database-spec.md
- Implementation: COMPLETE — all P0 phases (0–9) built and building clean; auth/sessions/messages/feedback verified against live Supabase. Azure /api/chat needs `az login` + Azure env vars to run.
- Stack note: now on Next.js 16 + React 19 (originally specced as 14)
- Design system: @knowledge/design-system.md (implemented as `an-` tokens in app/globals.css + tailwind.config.ts)
- Azure endpoint: @knowledge/azure-endpoint.md (fill in env vars before running)

## Session Flow

1. ~~Use @skills/specs/specs.md to generate all feature specs~~ — DONE (see specs/)
2. ~~Generate plan~~ — DONE (blueprint/app-plan.md)
3. ~~Use @skills/implementation/implementation.md to build the app~~ — DONE (Phases 0–9)
4. Test all flows — auth/sessions/messages/feedback verified; chat E2E pending Azure credentials

## Key References

| File | Purpose |
|---|---|
| @skills/rules/rules.md | Tech stack and hard rules |
| @knowledge/design-system.md | All colors, fonts, dimensions, component specs |
| @knowledge/azure-endpoint.md | Azure AI client setup and /api/chat implementation |
| @skills/implementation/implementation.md | Phased build plan — followed for the build |
| blueprint/app-plan.md | Implementation plan + full SQL schema |
| supabase/schema.sql | Runnable Supabase schema (run once in SQL editor) |
| specs/README.md | Index of all feature specs (maps spec → implementing files) |
| specs/database-spec.md | Database schema (users, sessions, messages, feedback) |
| specs/auth-spec.md | Auth feature spec |
| specs/chat-spec.md | Chat feature spec |
| specs/dashboard-spec.md | Dashboard feature spec |
| specs/file-upload-spec.md | File upload feature spec |
| specs/feedback-spec.md | Feedback feature spec |
| README.md | Setup + run instructions |

## Run Checklist

To run the app end to end:
- [x] Next.js scaffold + dependencies installed
- [x] Supabase URL + publishable anon key in .env.local
- [x] Supabase schema applied (supabase/schema.sql)
- [ ] Service role secret key **rotated** (was briefly exposed under a NEXT_PUBLIC var)
- [ ] Azure env vars filled (AZURE_AGENT_ENDPOINT_URL, AZURE_AGENT_ID) + `az login`
- [x] Credentials live only in .env.local (gitignored) — never committed

