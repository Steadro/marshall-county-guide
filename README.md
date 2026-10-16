# Marshall County Guide

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

A polished, public directory of local businesses across **Marshall County, Tennessee** — the county
seat **Lewisburg** plus Chapel Hill, Cornersville, Petersburg, and Belfast. Curated and
design-forward, with strong local SEO baked in. **230+ businesses across 20+ categories.**

Live at **[marshallcountyguide.com](https://marshallcountyguide.com)**. A community project — no ads,
no paid placement, no sponsored listings.

Built with Next.js (App Router) + TypeScript + Tailwind CSS v4 + Prisma 7 / PostgreSQL.
Deploys on Vercel.

---

## Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | Next.js 16 (App Router), React 19, SSG/ISR          |
| Language  | TypeScript (strict)                                 |
| Styling   | Tailwind CSS v4 (CSS-first theme), `next/font`      |
| Data      | Prisma 7 + PostgreSQL (driver adapter `@prisma/adapter-pg`) |
| Icons     | lucide-react                                        |
| Hosting   | Vercel + a hosted Postgres (Neon recommended)       |

Design system, "Courthouse Green": Fraunces (serif headlines) + Inter (body), a limestone/paper
base, deep green-ink text, a rolling-hills pine primary, and a goldenrod accent. All tokens live in
[`app/globals.css`](app/globals.css) under `@theme`, so the whole look can be retuned in one place.

---

## Prerequisites

- **Node.js 20+** (built and tested on Node 24)
- A **PostgreSQL database**. A free [Neon](https://neon.tech) project is the recommended path
  (Vercel is serverless and can't reach a DB on your laptop). Develop against a Neon **branch**,
  never the production database: a branch is a copy-on-write clone, so you get real data and
  can't break the live site.

---

## Quick start

```bash
# 1. Configure environment FIRST: npm install runs `prisma generate`, which needs DATABASE_URL
cp .env.example .env
#    then edit .env and set DATABASE_URL to a Neon branch (never production)

# 2. Install dependencies
npm install

# 3. Empty database only: build the schema from prisma/migrations, then load the CSV.
#    Skip both if your branch was cut from production; it already has schema and data.
npx prisma migrate deploy
npm run seed

# 4. (Optional) Geocode addresses for maps. Free, no key needed.
npm run geocode

# 5. Run it
npm run dev          # http://localhost:3000
```

The seed loads the original CSV import. The live directory has grown past it in Neon, so a branch
of production is the way to see real data.

To verify a production build locally:

```bash
npm run build && npm run start
```

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env`. Never commit `.env` (it's git-ignored).

| Variable                    | Required | Purpose                                                                 |
| --------------------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`              | **Yes**  | Postgres connection string. Use the **pooled** string in production.    |
| `NEXT_PUBLIC_SITE_URL`      | Prod     | Public base URL (no trailing slash). Drives canonical URLs, sitemap, OG. |
| `GEOCODER`                  | No       | Blank = free US Census + OpenStreetMap geocoding. `google` or `mapbox` = paid provider instead. |
| `GOOGLE_GEOCODING_API_KEY`  | No       | Required when `GEOCODER=google`.                                        |
| `MAPBOX_TOKEN`              | No       | Required when `GEOCODER=mapbox`.                                        |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Prod | Browser key for the maps: Maps JavaScript API (category maps) + Maps Embed API (business pages). Referrer-restrict it. |
| `N8N_CONTACT_WEBHOOK_URL` / `N8N_INTAKE_WEBHOOK_URL` | No | Server-only n8n webhooks for form notifications. Submissions are saved to the DB either way. |
| `N8N_WEBHOOK_SECRET`        | No       | Sent as `x-mcg-secret` to the webhooks; have n8n require it.            |
| `IP_HASH_SALT`              | No       | Salt for hashed submitter IPs (falls back to `SESSION_SECRET`).         |

The admin and moderation variables are covered under [Admin and submissions](#admin-and-submissions).

> **Note:** `latitude`/`longitude` are empty in the seed. Pages work fine without them, the map is
> simply hidden. Run `npm run geocode` to fill them in: it's free and needs no key (US Census
> first, then OpenStreetMap for anything Census can't match). Set `GEOCODER` only to use Google or
> Mapbox instead. The step skips rows that already have coordinates or lack a street address, so
> it's safe to re-run.

> **Heads-up (harmless):** the `pg` driver prints a one-line `sslmode=require` deprecation warning
> during seed/build. It does not affect anything. To silence it, switch your `DATABASE_URL`
> to `...?sslmode=verify-full` (identical behavior today for Neon's trusted certificate).

---

## Scripts

| Script                 | What it does                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Start the dev server                                         |
| `npm run build`        | Production build (prerenders every business/category/town)   |
| `npm run start`        | Serve the production build                                   |
| `npm run seed`         | Load the CSV into an empty database (refuses once businesses exist) |
| `npm run geocode`      | Fill latitude/longitude from addresses (free, no key)        |
| `npm run db:migrate`   | `prisma migrate dev`: turn a schema change into a migration (Neon branch only) |
| `npm run db:studio`    | Open Prisma Studio to browse/edit data                       |
| `npm run enrich:apply` | Apply data-quality enrichment batches from `data/enrichment/*.json` |

---

## Project structure

```
app/
  layout.tsx               Root layout: fonts, header/footer, global metadata
  page.tsx                 Homepage (hero, spotlight, categories, towns)
  businesses/page.tsx      All businesses + client search/filter
  business/[slug]/         Listing page + LocalBusiness JSON-LD + OG image
  category/[slug]/         Category landing pages
  [town]/page.tsx          Per-town pages (local SEO)
  about/page.tsx           Mission / about page
  privacy/page.tsx         What the site collects and who processes it
  history/page.tsx         Local history of the county + towns
  for-owners/page.tsx      Info for business owners & local governments
  contact/page.tsx         Contact form (update/add/remove a listing)
  add-business/            Public "Add your business" intake form
  admin/                   Curator area: listings editor + submissions queue (login required)
  api/contact/route.ts     Contact handler: honeypot + rate limit -> n8n webhook -> Resend
  sitemap.ts, robots.ts    Generated sitemap.xml + robots.txt
  generated/prisma/        Prisma client (generated; git-ignored)
components/                UI: cards, placeholder art, explorer, map, badges…
lib/
  prisma.ts                Prisma 7 client singleton (pg driver adapter)
  queries.ts               All DB queries + derived types
  schema-org.ts            LocalBusiness / Breadcrumb / WebSite JSON-LD
  placeholder.ts, utils.ts, site.ts, geocode.ts
prisma/
  schema.prisma            Data model, annotated inline; Prisma migrates + generates from it
  migrations/              Migration history (see Database and migrations)
  seed.ts                  CSV → empty-DB bootstrap (refuses once businesses exist)
schema/
  TAXONOMY.md              Closed category / subcategory / tag vocabulary (classification)
scripts/
  geocode.ts               Standalone geocoding pass
  hash-password.ts         Generate the admin credential env vars
  apply-enrichment.ts      Apply data-quality enrichment batches (npm run enrich:apply)
  auto-enrich-push.ps1     Local watcher that applies new enrichment batches to Neon
  sql/                     Historical hand-run SQL, now folded into the baseline migration
data/
  businesses-seed.csv      Original import the seed loads (Neon is the system of record)
  enrichment/              Data-quality enrichment batches (JSON)
```

---

## Data model & content

- **Schema:** `prisma/schema.prisma` is the data model, annotated inline; Prisma migrates and
  generates from it. The model maps 1:1 onto schema.org `LocalBusiness` and is built to add
  business self-service later (`User`, `Claim`, `ownerId`, `claimStatus`) **without a migration** —
  those tables stay dormant in v1.
- **Provenance & freshness:** every record carries `dataSource`/`sourceUrl`/`lastVerifiedAt`. Seed
  rows start `UNVERIFIED`; a record is moved to `PUBLISHED` once its details are confirmed.
- **Data quality tiers:** each business has a `qualityTier` — `UNREVIEWED` (as imported) →
  `STANDARD` (name/category/contact confirmed against a primary source) → `GOLD` (six criteria, all
  dated and sourced: verified name, hours, an internal context brief, a two-line public description,
  and a verified category + subcategory). The bar is enforced in code by
  [`scripts/apply-enrichment.ts`](scripts/apply-enrichment.ts), which only promotes a record to
  `GOLD` when every criterion is met and otherwise holds it at `STANDARD`. GOLD listings get a subtle
  gold tint on their cards.
- **Classification:** every business has one `category` and one primary `subcategory` (venue/type),
  plus `tags` (cuisine, attributes, and secondary types). The closed vocabulary lives in
  [`schema/TAXONOMY.md`](schema/TAXONOMY.md): 9 consumer browse categories over the 22 DB categories,
  per-category subcategory lists, and a fit-or-flag rule. The browse also supports **multi-type** —
  a place can show under more than one type chip via a type-tag (e.g. a donut shop in both Bakery and
  Restaurant). The subcategory lists live in `lib/taxonomy.ts`: `scripts/apply-enrichment.ts`
  refuses off-list values, and `scripts/normalize-taxonomy.ts` maps drifted values onto them.
- **Enrichment pipeline:** batches are drafted as `data/enrichment/*.json` (gitignored — they hold
  the maintainer's local research notes, so they stay off GitHub). A local watcher
  ([`scripts/auto-enrich-push.ps1`](scripts/auto-enrich-push.ps1)) applies new batches to Neon via
  `npm run enrich:apply <file>` and archives the applied file; `npm run enrich:dry` previews without
  writing. Neon is the system of record. (ISR means enrichment shows up live within ~1h, no redeploy.)
  A batch that fails validation moves to `data/enrichment/.needs-attention/` instead; check it now
  and then. To install the watcher on Windows, run once from the repo root in PowerShell:
  `schtasks /Create /SC MINUTE /MO 15 /TN "MCG auto-enrich" /TR "wscript.exe `"$PWD\scripts\run-enrich-push-hidden.vbs`""`
- **Editing content:** Neon is the system of record; the CSV is the original import, not a live
  source. Edit listings in [`/admin`](#admin-and-submissions); new businesses come in through the
  intake queue. Slugs are stable and unique (chains are de-collided by city/street).

---

## Database and migrations

- **Empty database:** `npx prisma migrate deploy` builds the schema from `prisma/migrations`, then
  `npm run seed` loads the CSV. The seed refuses once the `Business` table has rows, because
  listings removed in Neon are still in the CSV and a re-seed would bring them back.
  `npm run seed -- --force` overrides that, so don't use it on a database with real data.
- **Changing the schema:** edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <change>`
  against your Neon branch, and commit the new migration folder. Once it merges, run
  `npx prisma migrate deploy` against production's direct (non-pooled) connection string.
- **Never `prisma db push` or hand-run SQL on production.** That is how the live schema drifted
  from its migrations; `prisma/migrations/*_baseline_live_schema` caught the history back up.

---

## Admin and submissions

`/admin` is the curator area: a single login held in env vars, no user accounts.

1. Run `npx tsx scripts/hash-password.ts "a-long-random-password"`. It prints `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH` (scrypt) and a fresh `SESSION_SECRET`. Set `ADMIN_EMAIL` to the address
   you'll log in with, then add all three to `.env` and to the Vercel project env. The plaintext
   password is never stored.
2. Sign in at `/admin/login`. `/admin` lists every listing and opens an editor for each one.
3. `/admin/intake` is the review queue for the public forms (`/add-business` and `/contact`), which
   save to the `Submission` table. Approving a business intake creates a DRAFT listing and opens it
   in the editor. Nothing publishes on its own.

| Variable                 | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `ADMIN_EMAIL`            | The `/admin` login email.                                                  |
| `ADMIN_PASSWORD_HASH`    | scrypt hash from `scripts/hash-password.ts`.                               |
| `SESSION_SECRET`         | Signs the admin session cookie. Rotate it to log everyone out.             |
| `INTAKE_ANALYSIS_TOKEN`  | Bearer token for `POST /api/intake/[id]/analysis`, where an automation (n8n → Claude API) writes its triage onto a submission. The endpoint returns 503 until this is set. |
| `MODERATION_EXTRA_WORDS` | Comma-separated extra terms for the submission content screen (`lib/content-filter.ts`), kept out of this public repo. A match flags the submission for review; it never blocks it. |

---

## SEO

SEO is a primary feature, not polish:

- **`LocalBusiness` JSON-LD** on every business page, with the `@type` refined per category
  (`Restaurant`, `Store`, `AutomotiveBusiness`, …) and `BreadcrumbList` structured data.
- Per-page `<title>` / meta description, canonical URLs, Open Graph + Twitter tags.
- A **dynamic OG image** per business (`opengraph-image`) using the same deterministic art.
- Generated `sitemap.xml` (every business, category, and town) and `robots.txt`.
- Static/ISR rendering + `next/font` for fast Core Web Vitals.

Validate structured data with Google's [Rich Results Test](https://search.google.com/test/rich-results).

---

## Deploy to Vercel

1. Push this repo to GitHub and **import the project** in Vercel.
2. Set **Environment Variables** (Project → Settings → Environment Variables):
   - `DATABASE_URL` — your **pooled** Neon connection string. (Required at build time, too: the
     `postinstall` `prisma generate` and the static build both need it.)
   - `NEXT_PUBLIC_SITE_URL` — your production URL, e.g. `https://marshallcountyguide.com`.
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, plus the [admin variables](#admin-and-submissions) if
     you use `/admin`. (Geocoding runs from your machine, so `GEOCODER` isn't needed here.)
3. Build settings: defaults work. `prisma generate` runs automatically via `postinstall`.
4. **Bootstrap a new, empty production database** once, from your machine with `DATABASE_URL`
   set to the prod database's direct (non-pooled) connection string. After that the seed refuses
   to run there, and schema changes reach production only through `npx prisma migrate deploy`.
   ```bash
   npx prisma migrate deploy
   npm run seed          # load the businesses
   npm run geocode       # optional; free, no key needed
   ```
5. Deploy. Then submit `https://your-domain/sitemap.xml` to Google Search Console.

---

## Definition of done (v1), status

- [x] With `.env` in place, `npm install && npx prisma migrate deploy && npm run seed && npm run dev`
      brings up the directory on an empty database
- [x] All routes render; every business reachable by a unique slug; no broken links
- [x] Valid `LocalBusiness` JSON-LD on listing pages (validate in Rich Results Test)
- [x] Deterministic placeholder cards for every business (no empty image slots)
- [x] Responsive 360px → desktop; semantic, keyboard-navigable, WCAG-minded
- [x] Lighthouse: SEO 100, Accessibility 97 (homepage), Performance 99 desktop / ~88 mobile —
      ongoing polish on mobile performance and per-page accessibility

## Out of scope for v1

Business self-service / claim flow (owner accounts), reviews/ratings, and payments. The schema
reserves space for these (`User`, `Claim`, `ownerId`, `claimStatus`).
