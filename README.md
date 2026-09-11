# Park Pilot

Live URL : 
An AI theme-park trip planner. Pick any of the ~130 parks on
[queue-times.com](https://queue-times.com/), add your travellers, and get a
minute-by-minute touring plan built from **today's live wait times**.

- **Live wait board** for every park — grouped by land, colour-coded, auto-refreshing,
  with a distinct visual identity (colour + icon motif) per park.
- **Curated ride data** for the major US Disney & Universal parks (height limits,
  toddler-friendly, ride intensity, Lightning Lane) so plans for those parks are sharper.
- **Multi-day trips** — set your dates, assign a park (or two, for a park-hopping day)
  to each day, and build/save a plan per day from one trip view.
- **AI touring planner**, bring your own key — Anthropic, OpenAI, Groq, Google Gemini,
  OpenRouter, or any OpenAI-compatible endpoint. Rope-drop order, Lightning Lane picks,
  geographic routing, midday breaks, Rider Switch for little kids, parade/fireworks anchors.
- **Live-search concierge content** (Groq `compound` / OpenRouter `:online`) — hard-ticket
  event warnings, hidden gems, photo spots, and current merch picks woven into the plan.
- **Re-optimize** any plan against the current live waits, or **refine** it in plain
  English ("we're tired, cut the afternoon").
- **Accounts**, saved travellers, saved plans, and a first-timer checklist that adapts
  when someone in your party is under 4.

Live wait times are **Powered by Queue-Times.com**. Not affiliated with any park operator.

## Stack

Next.js 15 (App Router) · Tailwind + shadcn/ui · Auth.js v5 (credentials) · Prisma
with the **libSQL / Turso** driver adapter · TanStack Query · the `openai` SDK talking
to whichever OpenAI-compatible endpoint the user configures (see below).

The database is SQLite everywhere: a plain file in dev, a hosted [Turso](https://turso.tech/)
database in production (which runs fine on serverless — no Postgres needed).

## Local development

```bash
npm install
cp .env.example .env           # then set AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev         # creates prisma/dev.db
npm run db:seed                # optional demo account: demo@parkpilot.app / disneyworld
npm run dev
```

Open http://localhost:3000. Sign up, add travellers, and connect a provider in
**Settings** to unlock the planner.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` locally. `libsql://<db>.turso.io` in production. |
| `DATABASE_AUTH_TOKEN` | prod only | Turso database token. Unset locally. |
| `AUTH_SECRET` | yes | `openssl rand -base64 32`. Also encrypts stored API keys — changing it invalidates them. |
| `ANTHROPIC_API_KEY` | no | Optional server-wide fallback (Anthropic only). Normally each user connects their own provider in Settings. |
| `ANTHROPIC_MODEL` | no | Default model for the fallback key above. Defaults to `claude-sonnet-5`. |

**No provider key is required as an env var.** Each user picks a provider in Settings —
**Anthropic, OpenAI, Groq, Google Gemini, OpenRouter, or a custom OpenAI-compatible
endpoint** (`src/lib/ai/providers.ts`) — pastes a key, it's verified live against that
provider, encrypted (AES-256-GCM) and stored on their account, and never sent back to
the browser. Groq and Google Gemini both have genuinely free tiers (no card) if you
want $0 usage; OpenRouter also routes to free models (openrouter.ai/models?max_price=0).
Every provider is called through the same OpenAI-compatible chat-completions shape, so
adding another one later is a one-line entry in `providers.ts`, not a new integration.

## Tests

```bash
npm test
```

Covers the crowd-curve projection, planner context building (age/height eligibility),
the itinerary validator, and secret encryption.

## Deploying (Vercel + Turso)

**1. Push to GitHub.**

**2. Create the production database (Turso).**

```bash
curl -sSfL https://get.tur.so/install.sh | bash   # install the CLI
turso auth login
turso db create park-pilot
turso db show park-pilot --url                     # -> DATABASE_URL
turso db tokens create park-pilot                  # -> DATABASE_AUTH_TOKEN
./scripts/db-push-turso.sh park-pilot              # applies prisma/migrations/* to Turso
```

**3. Import the repo in Vercel** and set project environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the `libsql://…` URL from step 2 |
| `DATABASE_AUTH_TOKEN` | the token from step 2 |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | *(optional)* only if you want one shared Anthropic key instead of per-user |

**4. Deploy.** `npm run build` runs `prisma generate` automatically.

**5. On the live site:** sign up, add your travellers, open **Settings**, pick a
provider (Groq or Google Gemini if you want it free), paste a key. Done.

### Applying later schema changes

`scripts/db-push-turso.sh` applies the **whole** migration history — use it once on a
fresh database. For an incremental change:

```bash
npx prisma migrate dev --name <change>                 # updates prisma/dev.db locally
turso db shell park-pilot < prisma/migrations/<new-migration-folder>/migration.sql
```

then redeploy.

## How the planner works

1. `src/lib/planner/context.ts` assembles a compact brief: park hours, traveller
   profiles (youngest age, minimum height), must-do / skip lists, the **live wait
   snapshot**, a time-of-day crowd-curve heuristic, and curated ride metadata where
   available. Rides the whole party can't ride (height/age) are flagged.
2. `src/app/api/ai/plan/route.ts` sends that to Claude, which returns a strict JSON
   itinerary (`src/lib/ai/prompts.ts` has the rules).
3. `src/lib/planner/validate.ts` deterministically checks the result — no overlaps,
   within park hours, height/age not violated — and surfaces (never silently drops)
   anything questionable as a warning on the plan.

queue-times.com only exposes *current* waits, so the time-of-day intelligence is a
labelled estimate, and show/parade times are best-effort — the app tells you to verify
them in the official park app.

## Adding curated data for another park

Fetch the park's ride ids from `https://queue-times.com/parks/<id>/queue_times.json`
and add an entry to `PARK_OVERLAYS` in `src/lib/data/overlay.ts` (and optionally
`PARK_META` in `src/lib/data/parks-meta.ts`). Everything else is automatic.
