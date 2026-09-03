# $0 → $1B — Ava Carter

A real startup, built from $0, documented in public through an AI-generated
fictional founder named **Ava Carter**. Ava is explicitly fictional; the
company, its research, its customers, and its revenue are not — every
claim of traction in this project traces back to a logged, real event.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full plan:
scope, architecture, external services by phase, database schema, the
truth-enforcement system, and the 14-day kickoff plan.

This repo started as `ai-sales-employee-b2b`; that idea is logged as
**Opportunity #1 (candidate, unscored)** in the discovery engine, not
assumed to be the final company — see the architecture doc for why.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Tailwind CSS
- Claude API (server-side only, added when content generation starts)

## Getting started

```bash
cp .env.example .env        # point DATABASE_URL at a real Postgres instance
docker compose up -d        # or use a hosted Postgres (Neon/Supabase/RDS)
npm install
npx prisma migrate dev      # creates the schema
npm run seed                # seeds Ava's character sheet + Day 0 state only
npm run dev                 # http://localhost:3000/admin
```

## What's here (Phase 1)

- **Story Bible** (`/admin/story-bible`) — the append-only log of what
  actually happened. `prisma/schema.prisma`'s `StoryEvent` model backs it.
- **Content Planner** (`/admin/content`) — content pieces per platform,
  each required to cite the `StoryEvent`(s) it's drawn from unless
  explicitly labeled non-`REAL`.
- **Startup Discovery Engine** (`/admin/opportunities`) — scored candidate
  problems, moving from 100 → 20 → 5 → 3 experiments → 1 company.
- **Ava's character sheet** (`src/lib/story-bible/ava-character.ts`) — the
  single canonical source for her identity, used to seed the DB and to
  build consistent image/video generation prompts later.

Everything else in the brief (script/video generation, publishing
automation, the real product's own customer-facing MVP) is scoped for
later phases — see the architecture doc.
