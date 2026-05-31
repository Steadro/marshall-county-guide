# CLAUDE.md — Marshall County Business Directory

Conventions and context for working in this repo. This file holds the durable coding conventions. (The maintainer keeps two additional working docs — `PROJECT.md` for current state and runbooks, `DATA.md` for the data model and quality bar — locally; they are gitignored and not part of this public repo.)

Enrichment batches are JSON files in `data/enrichment/` that raise records to the quality bar; `scripts/apply-enrichment.ts` applies them and `.github/workflows/enrich.yml` runs that against a maintainer's database (PR = dry-run preview, merge to `main` = apply). The batch files are the maintainer's working data and are gitignored, so this repo ships the pipeline, not the batches.

## Project

Public, curated directory of businesses across Marshall County, TN — the county seat Lewisburg plus Chapel Hill, Cornersville, Petersburg, and Belfast. Design-forward passion project. Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres. Deploy on Vercel. Curated for v1 — no auth yet, but the schema is built to add business self-service later without a migration. (Brand scope is county-level; `city` still defaults to "Lewisburg" since it's the most common town, and Lewisburg is the anchor town page.)

## Source of truth

- **Data model:** `prisma/schema.prisma` is the operative schema Prisma migrates/generates from; `schema/schema.prisma` is the annotated reference (keep both `.prisma` files in sync). The model + schema.org mapping is documented in `DATA.md`. Don't redesign the model; extend only with clear reason.
- **Seed data:** `data/businesses-seed.csv` (LF line endings — see `.gitattributes`). Don't hand-edit it to fix code problems — fix the seed script instead.
- **Data quality + enrichment:** `DATA.md` defines the `qualityTier` bar (UNREVIEWED → STANDARD → GOLD) and the workflow; `scripts/apply-enrichment.ts` raises records to it.
- **State, decisions, runbooks:** `PROJECT.md`.

## Conventions

- TypeScript strict mode. Prefer Server Components; use Client Components only where interactivity needs it (search/filter).
- Listing pages must be statically generated (SSG/ISR) for SEO — no client-only data fetching for primary content.
- Styling via Tailwind + a small set of design tokens (warm/local-craft theme in §5 of the spec). Keep the theme centralized so it can be retuned.
- Keep dependencies minimal. Don't add a CMS, auth lib, or state manager for v1.
- Generated placeholder images must be deterministic per business (hash id/slug) so they're stable across builds.

## Data-handling rules

- Treat every field except `name`, `category`, `city`, `state` as possibly empty. Degrade gracefully — never render "undefined"/"null".
- Slugs must be unique and stable; chains have multiple locations (e.g. "Dollar General", "O'Reilly Auto Parts") — disambiguate slugs with city/street.
- `latitude`/`longitude` are empty in the seed; geocode at seed time with an API key (see spec §3). Pages must work whether or not coords exist (hide the map if absent).

## SEO is a primary feature, not polish

- `LocalBusiness` JSON-LD on every business page (mapping in `DATA.md`).
- Per-page title/description, canonical URLs, OG/Twitter tags, `sitemap.xml`, `robots.txt`.

## Definition of done

Key gates: full local bring-up via seed, valid structured data, Lighthouse SEO/Accessibility ≥ 95, responsive 360px→desktop. See `PROJECT.md` for full v1 status.

## Out of scope for v1

Auth, claim/self-service, reviews, payments, admin CMS. The schema reserves space for these (`User`, `Claim`, `claimStatus`, `ownerId`) — leave them dormant.
