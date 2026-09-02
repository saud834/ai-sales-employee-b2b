# AI Sales Employee (B2B)

An autonomous AI sales agent for B2B teams. It runs the front of the sales funnel end to end:

1. **Source leads** — import from CSV today; the source layer is a pluggable interface so a real provider (Apollo.io, Clearbit, Hunter.io, a LinkedIn export, your existing CRM export) can be dropped in later without touching the rest of the agent.
2. **Qualify leads** — each new lead is scored 0-100 against your Ideal Customer Profile (ICP) using Claude, and marked `qualified` / `disqualified`.
3. **Outreach** — for every qualified lead, Claude drafts a short, personalized first-touch email. By default drafts are written to `data/outbox/` for human review (nothing is ever sent without you turning sending on).
4. **CRM automation** — every lead lives in a local SQLite database with a full pipeline status (`new → qualifying → qualified/disqualified → contacted → replied → won/lost`) and an activity log.

It's built as a CLI you can run on demand, or schedule to run continuously (e.g. hourly) as an autonomous agent.

## Quick start

```bash
npm install
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY, plus your ICP_DESCRIPTION / COMPANY_NAME / PRODUCT_PITCH
```

Import the bundled sample leads and run one full agent cycle:

```bash
npm run agent -- import data/sample-leads.csv
npm run agent -- run
```

Check what happened:

```bash
npm run agent -- stats
npm run agent -- leads
npm run agent -- lead 1     # full detail + activity history for lead #1
ls data/outbox/             # drafted emails, one JSON file per lead
```

## How it works

```
CSV / LeadSource  ─▶  SQLite CRM (leads, activities)  ─▶  Claude qualification
                                                              │
                                                    qualified │ disqualified
                                                              ▼
                                            Claude email draft ─▶ outbox (draft mode)
                                                              └─▶ SMTP send (send mode)
```

- `src/agent/leadSourcing.ts` — `LeadSource` interface + `CsvLeadSource` implementation. Add new adapters here to plug in a real lead-gen API.
- `src/agent/crm.ts` — the CRM: SQLite-backed lead + activity repository (dedupes by email, tracks pipeline status).
- `src/agent/qualification.ts` — sends each new lead + your ICP to Claude, gets back a structured `{ score, qualified, reason }`.
- `src/agent/outreach.ts` — sends qualified leads to Claude to draft a personalized outreach email.
- `src/integrations/email/` — `draftStore.ts` (safe default: writes to `data/outbox/`) and `smtpSender.ts` (real send via `nodemailer`, only used when `OUTREACH_MODE=send`).
- `src/agent/SalesAgent.ts` — orchestrates the full cycle (import → qualify → outreach) and exposes it to the CLI.

## CLI reference

```
sales-agent import <csvFile>              Import leads from a CSV file
sales-agent run [options]                 Run one full agent cycle
  --import <csvFile>                        Also import leads before qualifying
  --max-outreach <n>                        Cap how many leads get an email this run
  --schedule <cronExpr>                     Run repeatedly on a cron schedule (e.g. "0 * * * *")
sales-agent leads [--status <status>]     List leads (optionally filtered by status)
sales-agent lead <id>                     Show one lead's full detail + activity history
sales-agent stats                         Show pipeline counts by status
```

Run the agent autonomously, e.g. every hour:

```bash
npm run agent -- run --import data/sample-leads.csv --schedule "0 * * * *"
```

## Turning on real email sending

By default `OUTREACH_MODE=draft` — the agent never sends real email, it only writes drafts to `data/outbox/`. To actually send:

1. Set `OUTREACH_MODE=send` in `.env`.
2. Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL`.
3. Run `npm run agent -- run`.

Any Gmail/Google Workspace, Outlook, SendGrid, or generic SMTP account works — just point the `SMTP_*` variables at it.

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key, required for qualification and outreach drafting |
| `CLAUDE_MODEL` | Model id (default `claude-sonnet-5`) |
| `DATABASE_PATH` | SQLite file location (default `./data/sales-agent.db`) |
| `OUTREACH_MODE` | `draft` (safe default) or `send` |
| `SMTP_*` | SMTP credentials, only needed for `send` mode |
| `ICP_DESCRIPTION` | Free-text description of your Ideal Customer Profile — the main lever for qualification quality |
| `COMPANY_NAME` / `PRODUCT_PITCH` | Used to personalize outreach emails |
| `QUALIFICATION_THRESHOLD` | Score (0-100) a lead needs to be marked qualified (default `60`) |

## Adding a real lead source

Implement the `LeadSource` interface (`src/agent/leadSourcing.ts`):

```ts
export interface LeadSource {
  name: string;
  fetchLeads(): Promise<LeadInput[]>;
}
```

Then pass an instance of it to `SalesAgent.importFrom()` or wire it into the `run` CLI command. Nothing else in the pipeline needs to change — qualification, outreach, and CRM tracking work the same regardless of where leads came from.

## Development

```bash
npm run dev      # CLI with file watching (tsx watch)
npm run build    # compile to dist/
npm run lint     # typecheck only
npm test         # vitest — CRM logic, CSV parsing, and Claude response parsing (mocked, no network calls)
```

## Project structure

```
src/
  agent/
    SalesAgent.ts        orchestrator: import -> qualify -> outreach
    crm.ts                SQLite-backed lead/activity repository
    leadSourcing.ts        LeadSource interface + CsvLeadSource
    qualification.ts       Claude-based ICP scoring
    outreach.ts             Claude-based email drafting
  integrations/
    claude.ts               Anthropic SDK client
    email/
      draftStore.ts          writes drafts to data/outbox/
      smtpSender.ts            sends via nodemailer
  db/
    database.ts               SQLite connection + schema bootstrap
    schema.sql / schema.ts    table definitions
  cli/
    index.ts                  CLI entrypoint (commander)
    commands/                 import / run / leads / stats
  config.ts                  env-driven configuration
  types.ts                   shared types
data/
  sample-leads.csv           example CSV to try the agent with
  outbox/                    drafted emails land here (draft mode)
tests/                       vitest unit tests
```
