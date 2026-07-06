# Inventory Ops

AI-assisted inventory operations system for a US → Taiwan sports card dropshipping business.

**Phase 0**: Next.js 15 + Supabase scaffold with schema, RLS, auth, and empty dashboard pages. No agent business logic yet.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript 5 (strict)
- Tailwind CSS 4
- Supabase (Postgres + Auth + RLS)
- `@supabase/ssr` for cookie-based sessions
- `@tanstack/react-table`, `zod`, `react-hook-form`, `lucide-react`

## Prerequisites

- Node 20+
- pnpm 9+ (`brew install pnpm`)
- A Supabase project (create at https://supabase.com)
- Supabase CLI to push migrations (`brew install supabase/tap/supabase`)

## Setup

1. Install deps:
   ```bash
   pnpm install
   ```
2. Copy env template and fill in values:
   ```bash
   cp .env.local.example .env.local
   ```
   Only the `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, and `CRON_SECRET` values are required for Phase 0.
3. Apply migrations to your Supabase project:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   (Or paste the SQL in `supabase/migrations/*.sql` into the Supabase SQL editor manually.)
4. (Optional) Generate typed DB types:
   ```bash
   supabase gen types typescript --linked > lib/db-types.ts
   ```
5. Run the dev server:
   ```bash
   pnpm dev
   ```
   Visit http://localhost:3000, sign up, and land on the empty dashboard.

## Deployment

Push to GitHub → import into Vercel → add every env var from `.env.local.example` → deploy.

Cron jobs (agents) are commented out in `vercel.json`; they activate in Phase 1+.

## Roadmap

See `docs/agents.md` for how the 6 agents slot into `app/api/agents/*` in later phases.
