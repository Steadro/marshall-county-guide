# COWORK.md — operating guide for Claude Cowork

This file tells **Claude Cowork** how to help with this project given the one
thing it keeps tripping on: **Cowork runs in a network-sandboxed environment.**
Read this before doing enrichment work. For *what* a good record looks like, the
source of truth is `DATA.md` (§2 the six Gold criteria, §3 the batch loop, record
format, and source-tiering). This file is about *how the work flows*, not the data spec.

## Your role in one line

**Research businesses and draft enrichment batch JSON into `data/enrichment/`.**
You do **not** apply to the database, and you **cannot** — but you no longer need a
human to ship it either. A local watcher on the maintainer's machine
(`scripts/auto-enrich-push.ps1`, a Task Scheduler job running every 15 min) applies
any new batch you write straight to Neon, then archives it locally. So just **write a
valid batch file and you're done** — it goes live (within ~15 min + ~1h ISR) on its
own. Think "author the record," not "ship the change."

Batch files are **never committed.** This repo is public; the notes inside your
batches are private research and stay on the maintainer's machine. Neon is the
system of record.

Two consequences of this being fully automatic, no-review-gate:
- **Correctness is on you.** There is no human dry-run review before it hits the DB.
  Get slugs/fields right, and when unsure set `reviewFlag` and leave it STANDARD.
- **Only write a batch when it's actually ready.** A half-finished file in
  `data/enrichment/` will get applied at the next 15-min tick. If you are
  mid-draft, keep it elsewhere until done, or expect it to ship.

## The hard boundary (read this twice)

Cowork's sandbox has **allowlist-only networking**. Concretely, you **cannot**:

- Reach **Neon / Postgres** (the database). No `prisma`, no `psql`, no DB writes. Ever.
- **Push to GitHub** or do any `git` network op (`push`, `ls-remote`, `fetch`). SSH is blocked.
- Run the apply step (`npm run enrich:apply`) successfully — it needs the DB you can't reach.

This is **by design** (a cloud sandbox should never hold the prod DB password), not a
bug to work around. Do not attempt these and report "blocked." Do not try clever
detours. If a task truly needs the network/DB/git, say so and hand it to the human or
to **Claude Code** (which runs on the maintainer's machine with real network, `.env`,
and SSH — that is the tool that touches Neon and GitHub, not you).

**Also:** do not run `git commit` / `git add` here. An interrupted git op in this
sandbox once left a stuck `.git/index.lock` that blocked the maintainer's local git.
Leave git entirely to the human / Claude Code.

## The enrichment loop and where you fit

```
[YOU: research + draft batch JSON]  ->  data/enrichment/YYYY-MM-DD-area-category.json
        |
        v
[local watcher (auto-enrich-push.ps1): applies the batch to Neon, every ~15 min]   <- automatic, not you
        |
        v
[batch moved to data/enrichment/.applied/ locally — never committed]
        |
        v
[site: ISR refreshes within ~1h]   -> no redeploy needed for enrichment
```

The watcher is `scripts/auto-enrich-push.ps1`; it runs `scripts/apply-enrichment.ts`
against Neon on the maintainer's machine. You never invoke either — you just produce
the file. There is no CI and no review gate: a valid batch goes live on its own.

## How to produce a batch (essentials; full spec in DATA.md §3)

1. **File:** `data/enrichment/YYYY-MM-DD-<area>-<category>.json` — an array of records.
   Work in slices of ~20 (e.g. Lewisburg retail, outer-town restaurants).
2. **Match key:** each record needs a `slug` (preferred) or `name` + `city`. The apply
   script matches by `slug`, else by `name`+`city` (case-insensitive). **Slugs must match
   the seed's `slugify`** — notably `&` becomes `and` (e.g. `el-patron-mexican-restaurant-and-grill`).
   Unmatched records are reported, not invented — enrichment only **updates** existing
   businesses, it never creates them.
3. **Source-tiering (non-negotiable):**
   - **Business's own website** = best source for story / about / what they do (`internalContext`, public copy).
   - **Google Business Profile / Google** = trust for **hours** and **phone**.
   - **Other sources** (random directories, aggregators) = generally discard.
   Append the `SOURCES … CONFIDENCE …` trailer to `internalContext` (DATA.md §3) so every
   record carries its own provenance.
4. **Gold is requested, not granted.** Set `"qualityTier": "GOLD"` only when you believe all
   **six** criteria are met (verified name, hours, internal context, two-line public copy,
   category, subcategory — see DATA.md §2). The apply script re-checks and downgrades if a
   criterion is missing. **Activity-recency is NOT a criterion** (it was dropped 2026-05-31).
5. **When unsure, flag — don't force.** On a conflict, rebrand, possible closure, or low
   confidence on hours/identity, set `"reviewFlag": "...short note..."` and leave it STANDARD.
   Because applies are now automatic, a flagged record still goes live — but as STANDARD,
   never GOLD, and its note shows in the apply log for the maintainer to revisit. So
   flagging caps the blast radius; it does not hold the record back. Never invent fields to
   force GOLD on a business you could not verify.

## Do / Don't

**Do**
- Research thoroughly (web search is available to you and is your main tool).
- Write the batch JSON to `data/enrichment/`.
- Reference `DATA.md` and `PROJECT.md` (local master docs in the repo root) for spec and state.
- Be explicit about confidence and what you could not verify.

**Don't**
- Don't try to reach Neon, push to GitHub, or run `git` / the apply script.
- Don't hand-edit `data/businesses-seed.csv` to fix problems (that is the seed job, not enrichment).
- Don't promise a live DB or GitHub connection. You produce files; the local watcher applies them.
- Don't invent records for businesses that aren't already in the DB.

## Quick reference

- **Batch dir:** `data/enrichment/` (gitignored — batches are local-only working data, never committed).
- **Apply (run by the watcher or Claude Code, not you):** `npm run enrich:apply <file>` / `npm run enrich:dry`.
- **Pipeline:** local — `scripts/auto-enrich-push.ps1` (Task Scheduler) applies new batches to Neon and archives them to `data/enrichment/.applied/`. No CI.
- **Spec:** `DATA.md` §2 (Gold bar) + §3 (batch loop, record format, source-tiering).
- **State / runbooks:** `PROJECT.md`.
