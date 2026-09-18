# AI Sales Employee (B2B)

An AI-powered B2B sales tool: it tracks real leads (local businesses worth a
cold outreach) and includes a working **AI website builder**, used to
generate a demo site for a prospect as the outreach hook itself &mdash; "here's
a real website for your business, built in 30 seconds."

The website-builder half of this app is a real, working pipeline:

```
Natural language prompt
  -> AI plans a structured WebsiteSpec (sitemap, theme, copy, sections)
  -> Spec is validated against a strict schema
  -> A fixed library of React components renders that spec
  -> Live preview (desktop / tablet / mobile)
  -> Natural-language edits patch the spec and re-render
  -> Export a real, standalone Next.js project (zip)
```

## Why this repo, and the lead behind it

The seeded lead (see "Database setup" below) is a real, small grill
restaurant in Al-Balad, Riyadh &mdash; **Mashaweer Rest & Cafe** &mdash; found via
web search with only a Facebook presence and no indexed website. It's used
here as the first real test case for "find a prospect with no website, then
generate one for them." Treat the "no website" finding as a lead, not a
certainty: verify directly (call, WhatsApp, or check their Google Business
Profile) before using this for real outreach.

## Architecture

```
app/                      Next.js App Router (UI + API routes)
  api/leads/...            Lead CRUD
  api/projects/...         Project CRUD, AI plan/modify, sections, theme,
                            pages, assets, versions, export
  leads/, projects/        Tool UI (dashboard, leads, project list/builder)
  preview/[projectId]/     Isolated route that renders a generated site
                            from its stored spec — used inside the builder's
                            live-preview iframe

lib/
  types.ts, schema.ts       WebsiteSpec/Lead/Project types + Zod validation.
                            Every AI output (plan or edit) is validated here
                            before it is stored or rendered — this is the
                            safety boundary: the app never eval()s or executes
                            AI-authored code, it only ever renders AI-authored
                            *data* through a fixed component set.
  ai/                       Provider abstraction (see below)
  components/               The reusable website component library (Navbar,
                            Hero, Features, Pricing, Testimonials, FAQ,
                            Gallery, Menu, Reservation, LocationHours, ...)
                            plus SiteRenderer, which maps a WebsiteSpec's
                            sections onto these components.
  codegen/exportProject.ts  Builds a standalone Next.js project (zip) from a
                            WebsiteSpec, reusing the same component files.
  repo/                     SQLite data access (leads, projects, versions,
                            chat messages, assets)
  db.ts                     better-sqlite3 connection + migrations
```

### AI provider abstraction

`lib/ai/provider.ts` defines a small `AIProvider` interface
(`planWebsite`, `modifyWebsite`). Two implementations exist behind it:

- `lib/ai/anthropic-provider.ts` &mdash; calls the Claude API with a system
  prompt describing the exact WebsiteSpec shape, and validates the JSON
  response before accepting it (one retry with the validation error fed
  back to the model if it fails).
- `lib/ai/mock-provider.ts` &mdash; a fully offline, deterministic provider
  that parses the prompt for website type / personality / language / city
  and composes a real spec from template content. It also implements
  `modifyWebsite` for the exact edit phrases described in the product spec
  (sticky navbar, primary color, "more luxurious", add a reviews section,
  add a contact page, replace hero image, improve mobile).

`lib/ai/index.ts` picks Anthropic automatically when `ANTHROPIC_API_KEY` is
set, otherwise falls back to the mock provider &mdash; so the whole app (plan,
edit, preview, export) is testable with zero API keys and zero network
calls.

### Safety

- AI never generates executable code that this app runs. It only ever
  produces a JSON `WebsiteSpec`, which is validated against a strict Zod
  schema (`lib/schema.ts`) before it's stored, and rendered through a fixed
  set of vetted React components (`lib/components/`).
- Code generation for export is template-based and deterministic
  (`lib/codegen/exportProject.ts`) &mdash; it interpolates validated spec data
  into known-safe file templates, never runs anything the AI wrote.
- Uploaded assets are re-named with a random id (never using the client's
  filename) and restricted to a small image MIME allow-list and size cap.

## Setup

```bash
npm install
cp .env.example .env.local   # then optionally add ANTHROPIC_API_KEY
npm run db:init               # creates the SQLite DB and seeds one real lead
npm run dev
```

Open http://localhost:3000.

### Environment variables

See `.env.example`:

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Leave empty to run entirely on the offline mock AI provider. |
| `ANTHROPIC_MODEL` | No | Defaults to a recent Claude model; override if needed. |
| `DATABASE_PATH` | No | Defaults to `./data/app.db` (SQLite, created automatically). |

### Database setup

The app uses SQLite via `better-sqlite3` &mdash; no external database server is
needed. `npm run db:init` (or simply starting the app once) creates
`data/app.db` and runs migrations automatically. `npm run db:init` also
seeds one real lead (see above).

### Development commands

```bash
npm run dev         # start the dev server
npm run lint        # lint
npm run typecheck   # tsc --noEmit
```

### Production build

```bash
npm run build
npm start
```

## Using it

1. **Leads** (`/leads`): add a real prospect (name, category, city, WhatsApp).
   Click "Generate Website" on a lead to jump into website creation with
   their details pre-filled.
2. **New Website** (`/projects/new`): describe the site in plain language,
   or pick an example prompt.
3. **Builder** (`/projects/[id]`): left is the AI chat (natural-language
   edits apply to the live site immediately), center is the live preview
   with desktop/tablet/mobile toggles, right has tabs for direct field/theme
   editing, page management, the image asset library, and version history.
4. **Export**: the toolbar's Export button downloads a complete, independent
   Next.js project (own `package.json`, components, content, sitemap,
   robots.txt) that runs with `npm install && npm run dev` on its own, with
   no dependency on this app, a database, or an AI provider.

## Roadmap (architecture already allows these)

One-click deployment, custom domains, authentication/teams, payments,
reusable templates, AI image/video generation, and analytics can all be
added without restructuring: the AI layer is provider-agnostic, projects
are already versioned, and export already produces a deployable static
Next.js project.
