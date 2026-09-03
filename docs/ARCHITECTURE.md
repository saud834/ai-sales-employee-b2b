# Architecture & Launch Plan — "$0 → $1B" (Ava Carter)

This document is the answer to the "first task": scope the smallest viable
version, propose architecture, and lay out how we start building. It is a
living document — update it as reality changes the plan.

## 0. A note on the starting point

This repository was created as `ai-sales-employee-b2b` — "AI-powered B2B
sales employee for lead generation, outreach, and CRM automation." The
brief for this project explicitly says we do **not** pre-select the real
startup idea; we run it through the Discovery Engine like any other
candidate.

So: "AI Sales Employee for B2B" is logged as **Opportunity #1** (source:
repo brief) in the discovery engine below, scored like every other
candidate, not assumed to be the answer. If it survives interviews and a
willingness-to-pay test, it becomes the company. If it doesn't, we kill it
in public, on camera, and move to the next candidate. That failure/pivot
*is* the content.

## 1. Smallest viable version

Two products share one database, built in this order:

1. **Story Bible + Content Planner** (Phase 1, this session) — a system of
   record for what has actually happened (events, interviews, experiments,
   revenue, decisions) and a place to turn those events into a content
   backlog, with a hard schema-level distinction between REAL and
   FICTIONAL/HYPOTHETICAL/SIMULATION content so we structurally cannot
   fabricate traction.
2. **Discovery Engine** (bootstrapped now, used starting Day 1) — a scored
   list of candidate problems, interviews, and experiments, because finding
   the real problem is the actual first job.

Everything else (script generation, video assembly, publishing automation,
the real product's own MVP) is real work, but it is *sequenced* — see
Phases below. We are not building a video renderer before we have a single
real customer interview logged.

## 2. Proposed architecture

- **App**: Next.js 15 (App Router) + TypeScript, single deployable, admin
  dashboard as server-rendered pages under `/admin`.
- **DB**: PostgreSQL + Prisma ORM. Schema covers all phases now (so we
  don't do destructive migrations later) but only Story Bible, Content
  Planner, and Discovery Engine tables are wired to UI/API in Phase 1.
- **Auth**: none yet (Phase 1 is single-operator, internal). Add real auth
  (NextAuth/Clerk + Postgres sessions) when the actual product (Phase 6)
  needs customer-facing login, or the moment more than one person touches
  `/admin`.
- **Jobs**: none yet. Analytics ingestion and publishing automation
  (Phase 4+) will need a queue (e.g. Trigger.dev or a simple cron +
  Postgres job table) — deferred until there's a platform API to call.
- **AI provider**: Claude API (Messages API), called from server-side
  route handlers only, never from the client. Modular `lib/ai/provider.ts`
  interface so we can swap/add providers later without touching callers.

## 3. Build order (this repo)

1. Prisma schema — full data model (below).
2. `lib/story-bible/ava-character.ts` — the immutable Ava character sheet.
3. Seed script — Day 0 company state + Ava character only. No fake events.
4. Admin dashboard: Overview, Story Bible, Content Planner, Opportunities.
5. API routes (CRUD) backing those pages.
6. `docs/` — this file + 14-day plan (below).

Deferred (not this session): script generation, image/video generation,
publishing integrations, analytics ingestion, the real product's own
customer-facing app.

## 4. External APIs/services we will need (by phase)

| Phase | Service | Purpose |
|---|---|---|
| 1 | PostgreSQL (Supabase/Neon/RDS) | primary DB |
| 1 | Anthropic (Claude API) | script/hook/copy generation |
| 2 | Image/video gen (e.g. Midjourney/Runway/ElevenLabs for voice) | Ava visuals + VO — picked when we lock the visual pipeline |
| 4 | YouTube Data API, TikTok Content Posting API, Instagram Graph API, X API | publishing + analytics pull |
| 4 | Resend/Postmark | newsletter, internal alerts |
| 6 | Stripe | billing for the real product |
| 6 | Sentry (or similar) | error tracking for the real product |
| 6 | PostHog/Plausible | product analytics for the real product |

None of Phase 2/4/6 services are wired yet — we add each only when the
phase that needs it starts, per the build philosophy ("don't over-engineer
early").

## 5. What Claude Code itself can do directly

- Generate scripts, hooks, captions, titles from real `StoryEvent` records
  (deterministic input → content, not invented input).
- Draft the visual/shot plan text for a scene (which still needs an actual
  image/video model to render).
- Do discovery-engine research synthesis (summarize interview notes,
  compute opportunity scores) — but the underlying interviews/data must be
  supplied by us, not invented.
- Write and maintain this codebase, migrations, and admin tooling.

## 6. What should NOT be automated initially

- Publishing to any platform (needs disclosure/compliance review per
  platform's AI-content policies before it's ever automatic).
- Any claim about revenue, customers, or growth in outbound content —
  always sourced from a `StoryEvent`/`RevenueEvent` row, never generated
  free-text.
- Opportunity scoring's final "which idea do we pick" decision — the score
  informs, a human (us, on camera) decides.
- Video assembly / character rendering — no visual pipeline is chosen yet;
  don't build automation around a pipeline we haven't picked.

## 7. Database schema

See `prisma/schema.prisma`. Summary of entities:

- **Character** — Ava's persistent, versioned appearance/voice/personality
  sheet. Explicitly `isFictional: true`. Single row, edited not duplicated.
- **CompanyState** — singleton: day number, stage, current opportunity,
  cash, headline metrics (all nullable until real).
- **StoryEvent** — append-only log of everything that actually happened
  (interview conducted, experiment run, product shipped, revenue landed,
  decision made). Every `truthLabel` defaults to `REAL`; the few
  legitimately non-real entries (a hypothetical "what if" aside) must be
  explicitly labeled `HYPOTHETICAL`/`SIMULATION`/`FICTIONAL`.
- **Opportunity, Interview, Experiment** — the discovery engine: scored
  candidate problems, the interviews behind them, the experiments testing
  willingness to pay.
- **Customer, RevenueEvent, ExpenseEvent** — real business state. Empty
  until real.
- **Episode, ContentPiece, AnalyticsSnapshot** — the content pipeline and
  its measured performance.
- **AudiencePoll, PollOption** — audience-decision tracking.

## 8. Truth system (enforced, not just a policy)

`TruthLabel` is a Prisma enum (`REAL | HYPOTHETICAL | SIMULATION |
FICTIONAL`) present on `StoryEvent`, `Experiment`, and `ContentPiece`. UI
renders a visible badge for anything not `REAL`. The seed script only ever
inserts the `Character` row (fictional by definition) and a single Day 0
`CompanyState`/`StoryEvent` ("project started, $0, no idea chosen yet") —
both true facts about this project, not fabricated traction.

## 9. 14-day implementation plan

**Days 1–2 — Foundation**
Ship this repo's Phase 1 (schema, seed, admin dashboard skeleton, Ava
character sheet). Get a real Postgres instance provisioned (Neon/Supabase
free tier is enough to start).

**Days 3–5 — Discovery: cast a wide net**
Log 100 candidate problems into `Opportunity` from Reddit/forums/review
sites/search-trend research, including Opportunity #1 (AI Sales Employee
for B2B). Score what can be scored from public data alone (market size,
competition, rough AI advantage).

**Days 6–8 — Discovery: talk to humans**
Run real outreach for interviews against the top ~20 scored opportunities.
Log every interview as an `Interview` + `StoryEvent`. This is also the
first real content: "Day 6, I emailed 40 businesses, here's who replied."

**Days 9–10 — Narrow to finalists**
Cut to 5 strong opportunities using real interview signal, not vibes.
Design 3 willingness-to-pay experiments (e.g. landing page + real payment
link, not a fake "coming soon" form).

**Days 11–13 — Run the experiments**
Execute the 3 experiments in parallel where possible. Log every result
(including null results) as `Experiment` rows. This is the highest-tension
content window — likely includes at least one real failure.

**Day 14 — Decide**
Pick the company (or decide none of the 3 cleared the bar and go back to
the list — also a legitimate, contentworthy outcome). Update
`CompanyState.currentOpportunityId`, write the Day 14 episode, and open
Phase 6 (real MVP) planning for the winning idea.

Content production (Phase 1's Content Planner) runs in parallel with all
of the above from Day 1 — every step above is itself a `StoryEvent` that
feeds the planner.
