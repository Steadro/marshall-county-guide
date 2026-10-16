# CLAUDE.md — Marshall County Business Directory

Conventions and context for working in this repo. `README.md` covers setup, the data model, the quality tiers and runbooks; this file holds the durable coding conventions.

**If you are Claude Cowork, read `COWORK.md` first** — it explains your role (draft enrichment batches into `data/enrichment/`, never apply them) and the network boundary: Cowork's sandbox cannot reach Neon. The apply is automated and local: a watcher on the maintainer's machine (`scripts/auto-enrich-push.ps1`, Task Scheduler, every 15 min) applies new batches straight to Neon via `scripts/apply-enrichment.ts`, then archives each to `data/enrichment/.applied/` (gitignored). Batch files are never committed — Neon is the system of record, and this repo is public, so the research notes inside batches stay on the maintainer's machine. Writing a valid batch file is the whole job. Claude Code on the maintainer's machine is the tool that touches Neon directly.

## Project

Public, curated directory of businesses across Marshall County, TN — the county seat Lewisburg plus Chapel Hill, Cornersville, Petersburg, and Belfast. Design-forward passion project. Next.js (App Router) + TypeScript + Tailwind + Prisma/Postgres. Deploy on Vercel. Curated for v1 through a single curator login at `/admin`; the schema is built to add business self-service later without a migration. (Brand scope is county-level; `city` still defaults to "Lewisburg" since it's the most common town, and Lewisburg is the anchor town page.)

## Source of truth

- **Data model:** `prisma/schema.prisma` is the schema Prisma migrates and generates from, annotated inline. Don't redesign the model; extend only with clear reason.
- **Schema changes ship as migrations:** `prisma migrate dev` against a Neon branch, commit the migration, then `prisma migrate deploy` to production. Never `db push` or hand-run SQL on production; that drift is what `prisma/migrations/*_baseline_live_schema` had to repair.
- **Seed data:** `data/businesses-seed.csv` (LF line endings — see `.gitattributes`) is the original import, not a live source: Neon is the system of record, and `prisma/seed.ts` refuses to run once the Business table has rows. Don't hand-edit the CSV to fix code problems — fix the seed script instead.
- **Data quality + enrichment:** the `qualityTier` bar (UNREVIEWED → STANDARD → GOLD) is described in README and enforced by `scripts/apply-enrichment.ts`; COWORK.md is the batch spec.
- **Classification (committed):** `schema/TAXONOMY.md` is the closed vocabulary for category, subcategory, and tags — the 9 consumer browse categories over the 22 DB categories, the per-category subcategory lists, the tag axis, the fit-or-flag protocol, and multi-type (a place showing under more than one type chip via tags). `lib/category-groups.ts` is the presentation grouping; `lib/taxonomy.ts` holds the closed subcategory lists, which `scripts/apply-enrichment.ts` enforces on every write.

## Conventions

- TypeScript strict mode. Prefer Server Components; use Client Components only where interactivity needs it (search/filter).
- Listing pages must be statically generated (SSG/ISR) for SEO — no client-only data fetching for primary content.
- Styling via Tailwind + design tokens (the "Courthouse Green" theme: pine primary, goldenrod accent, limestone/paper surfaces). All tokens live in `app/globals.css` under `@theme` so the whole look retunes in one place.
- Keep dependencies minimal. Don't add a CMS, auth lib, or state manager for v1.
- Generated placeholder images must be deterministic per business (hash id/slug) so they're stable across builds.

## Data-handling rules

- Treat every field except `name`, `category`, `city`, `state` as possibly empty. Degrade gracefully — never render "undefined"/"null".
- Slugs must be unique and stable; chains have multiple locations (e.g. "Dollar General", "O'Reilly Auto Parts") — disambiguate slugs with city/street.
- `latitude`/`longitude` are empty in the seed; `npm run geocode` fills them for free (US Census, then OpenStreetMap; no key). Pages must work whether or not coords exist (hide the map if absent).

## SEO is a primary feature, not polish

- `LocalBusiness` JSON-LD on every business page (mapping in `lib/schema-org.ts`).
- Per-page title/description, canonical URLs, OG/Twitter tags, `sitemap.xml`, `robots.txt`.

## Definition of done

Key gates: full local bring-up via seed, valid structured data, Lighthouse SEO/Accessibility ≥ 95, responsive 360px→desktop.

## Out of scope for v1

Owner accounts and claim/self-service, reviews, payments. The schema reserves space for these (`User`, `Claim`, `claimStatus`, `ownerId`) — leave them dormant.
