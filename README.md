# Marshall County Guide

A polished, public directory of local businesses across **Marshall County, Tennessee** — the county
seat **Lewisburg** plus Chapel Hill, Cornersville, Petersburg, and Belfast. Curated and
design-forward, with strong local SEO baked in. **150+ businesses across more than a dozen categories at launch.**

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

Design system, "warm & local-craft": Fraunces (serif headlines) + Inter (body), a cream/paper
base, deep ink text, and a clay/terracotta accent. All tokens live in
[`app/globals.css`](app/globals.css) under `@theme`, so the whole look can be retuned in one place.

---

## Prerequisites

- **Node.js 20+** (built and tested on Node 24)
- A **PostgreSQL database**. A free [Neon](https://neon.tech) project is the recommended path —
  it doubles as your dev and production database (Vercel is serverless and can't reach a DB on
  your laptop).

---

## Quick start

```bash
# 1. Install dependencies (runs `prisma generate` automatically)
npm install

# 2. Configure environment
cp .env.example .env
#    then edit .env and set DATABASE_URL (+ optional geocoding key)

# 3. Create the database schema
npx prisma migrate dev

# 4. Seed the businesses (idempotent, safe to re-run)
npm run seed

# 5. (Optional) Geocode addresses for maps, needs a geocoding key (see below)
npm run geocode

# 6. Run it
npm run dev          # http://localhost:3000
```

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
| `GEOCODER`                  | No       | `google` or `mapbox` to enable the geocode step. Blank = skip.          |
| `GOOGLE_GEOCODING_API_KEY`  | No       | Required when `GEOCODER=google`.                                        |
| `MAPBOX_TOKEN`              | No       | Required when `GEOCODER=mapbox`.                                        |

> **Note:** `latitude`/`longitude` are empty in the seed. Pages work fine without them, the map is
> simply hidden. Run `npm run geocode` once with a key to fill them in. The step skips rows that
> already have coordinates or lack a street address, so it's safe to re-run.

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
| `npm run seed`         | Upsert categories + businesses from the CSV (idempotent)     |
| `npm run geocode`      | Fill latitude/longitude from addresses (needs a key)         |
| `npm run db:migrate`   | `prisma migrate dev`                                         |
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
  for-owners/page.tsx      Info for business owners
  sitemap.ts, robots.ts    Generated sitemap.xml + robots.txt
  generated/prisma/        Prisma client (generated; git-ignored)
components/                UI: cards, placeholder art, explorer, map, badges…
lib/
  prisma.ts                Prisma 7 client singleton (pg driver adapter)
  queries.ts               All DB queries + derived types
  schema-org.ts            LocalBusiness / Breadcrumb / WebSite JSON-LD
  placeholder.ts, utils.ts, site.ts, geocode.ts
prisma/
  schema.prisma            Data model Prisma migrates from (operative schema)
  seed.ts                  CSV → DB seeder (enrichment-safe; see below)
schema/
  schema.prisma            Annotated reference copy of the data model
scripts/
  geocode.ts               Standalone geocoding pass
  apply-enrichment.ts      Apply data-quality enrichment batches (npm run enrich:apply)
  sql/                     Hand-written additive SQL migrations
data/
  businesses-seed.csv      Source data for every business
  enrichment/              Data-quality enrichment batches (JSON; gitignored, maintainer-local)
```

---

## Data model & content

- **Schema:** `prisma/schema.prisma` is the operative schema Prisma migrates and generates from
  (`schema/schema.prisma` is an annotated reference copy). The model maps 1:1 onto schema.org
  `LocalBusiness` and is built to add business self-service later (`User`, `Claim`, `ownerId`,
  `claimStatus`) **without a migration** — those tables stay dormant in v1.
- **Provenance & freshness:** every record carries `dataSource`/`sourceUrl`/`lastVerifiedAt`. Seed
  rows start `UNVERIFIED`; a record is moved to `PUBLISHED` once its details are confirmed.
- **Data quality tiers:** each business has a `qualityTier` — `UNREVIEWED` (as imported) →
  `STANDARD` (name/category/contact confirmed against a primary source) → `GOLD` (six criteria, all
  dated and sourced: verified name, hours, an internal context brief, a two-line public description,
  and a verified category + subcategory). The bar is enforced in code by
  [`scripts/apply-enrichment.ts`](scripts/apply-enrichment.ts), which only promotes a record to
  `GOLD` when every criterion is met and otherwise holds it at `STANDARD`. GOLD listings get a subtle
  gold tint on their cards.
- **Enrichment pipeline:** enrichment batches are JSON files in `data/enrichment/` that update
  existing records to the quality bar. `npm run enrich:apply <file>` / `npm run enrich:dry` apply or
  preview a batch, and [`.github/workflows/enrich.yml`](.github/workflows/enrich.yml) runs that in CI
  against the configured database (open a PR for a dry-run preview; merge to `main` to apply). ISR
  means enrichment shows up live within ~1h with no redeploy. The batch files are the maintainer's
  working research data and are gitignored, so this repo ships the pipeline, not the batches.
- **Editing content:** add/extend rows in `data/businesses-seed.csv` and re-run `npm run seed` (it
  only creates new rows and refreshes `UNREVIEWED` ones — it never overwrites enriched records), or
  edit directly via `npm run db:studio`. Slugs are stable and unique (chains are de-collided by
  city/street).

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
   - Optionally `GEOCODER` + the matching key.
3. Build settings: defaults work. `prisma generate` runs automatically via `postinstall`.
4. **Apply the schema + seed to your production database** once, from your machine pointed at the
   prod `DATABASE_URL`:
   ```bash
   npx prisma migrate deploy
   npm run seed          # load the businesses
   npm run geocode       # optional, if you have a key
   ```
5. Deploy. Then submit `https://your-domain/sitemap.xml` to Google Search Console.

---

## Definition of done (v1), status

- [x] `npm install && prisma migrate dev && npm run seed && npm run dev` brings up the full directory
- [x] All routes render; every business reachable by a unique slug; no broken links
- [x] Valid `LocalBusiness` JSON-LD on listing pages (validate in Rich Results Test)
- [x] Deterministic placeholder cards for every business (no empty image slots)
- [x] Responsive 360px → desktop; semantic, keyboard-navigable, WCAG-minded
- [x] Lighthouse: SEO 100, Accessibility 97 (homepage), Performance 99 desktop / ~88 mobile —
      ongoing polish on mobile performance and per-page accessibility

## Out of scope for v1

Business self-service / claim flow, auth, reviews/ratings, payments, and an admin CMS. The schema
reserves space for these; editing happens via the CSV/seed or Prisma Studio for now.
