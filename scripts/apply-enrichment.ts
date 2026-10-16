/**
 * Apply enrichment batches to the database.
 *
 * The enrichment workflow (see COWORK.md) researches businesses and writes
 * structured records to data/enrichment/*.json. This script applies those
 * records to the live DB. It is the WRITE half of "automated batches" — the
 * research half happens via web/browser tooling and produces the JSON.
 *
 * Run locally (your machine can reach Neon; the prep sandbox cannot):
 *     npx tsx scripts/apply-enrichment.ts                 # apply every batch
 *     npx tsx scripts/apply-enrichment.ts batch-2026-05-30.json   # one file
 *     npx tsx scripts/apply-enrichment.ts --dry-run       # preview, write nothing
 *
 * Properties:
 * - Matches an existing Business by `slug`, else by `name`+`city` (case-insensitive).
 *   Update-only: it never CREATES businesses (adding net-new businesses is a
 *   seed-data job, not enrichment). Unmatched records are reported, not invented.
 * - All-or-nothing per file: every record is validated (types, hours, enums,
 *   dates) and matched to exactly one business + category BEFORE the first
 *   write. One invalid or unmatched record rejects the whole file: it is
 *   reported, nothing from it is written, and the run exits EXIT_REJECTED (2).
 * - Idempotent: re-running the same batch converges to the same state.
 * - Only fields present in a record are written; absent, null and blank ("")
 *   fields are left untouched.
 * - Enforces the gold bar: a record may only reach GOLD if every criterion in
 *   goldGaps() below is satisfied; otherwise it is written as STANDARD with a note.
 * - Classification (categoryName, subcategory, tags) follows schema/TAXONOMY.md.
 *   A subcategory off its category's closed list (lib/taxonomy.ts) is not
 *   written; the record is held at STANDARD with a reviewFlag instead.
 * - An address change clears latitude/longitude so scripts/geocode.ts re-pins it.
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { BusinessStatus, QualityTier } from "../app/generated/prisma/client";
import { slugify } from "../lib/utils";
import { SUBCATEGORIES } from "../lib/taxonomy";

const ENRICH_DIR = join(process.cwd(), "data", "enrichment");
const DRY = process.argv.includes("--dry-run");
const fileArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
/** Exit code for a file rejected before any write; the watcher quarantines it. */
const EXIT_REJECTED = 2;

/** One day's block: `closed: true` = closed all day, otherwise opens/closes ("HH:MM", 24h). */
type HoursBlock = { day: number; opens?: string; closes?: string; closed?: boolean };

interface EnrichmentRecord {
  // --- match key (one required) ---
  slug?: string;
  name?: string;
  city?: string;
  // --- verified fields (all optional; only present ones are written) ---
  verifiedName?: string; // overrides display name if branding differs
  categoryName?: string; // an existing Category, by name or slug
  subcategory?: string; // primary axis: one closed value per category (see TAXONOMY.md)
  tags?: string[]; // cross-cutting facets (cuisine, attributes); connect-or-create by name
  tagline?: string; // card one-liner; word-boundary truncated to CARD_TAGLINE_MAX
  shortDescription?: string; // the 1–2 sentence page lead (also meta fallback)
  internalContext?: string; // internal-only brief
  priceRange?: string;
  phone?: string;
  website?: string;
  streetAddress?: string;
  postalCode?: string;
  hours?: HoursBlock[];
  hoursNote?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  lastActiveAt?: string; // ISO date of most recent Google activity (optional, informational)
  activitySource?: string;
  sourceUrl?: string;
  verifiedBy?: string;
  status?: keyof typeof BusinessStatus; // "PUBLISHED" | "CLOSED" | ...
  qualityTier?: keyof typeof QualityTier; // requested tier; downgraded if bar unmet
  reviewFlag?: string; // if set, record is held at STANDARD and surfaced for review
}

/** Missing = undefined, null, or a blank string (LLMs emit "" for "unknown"). */
function present<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "");
}

const STRING_FIELDS = [
  "slug", "name", "city", "verifiedName", "categoryName", "subcategory", "tagline",
  "shortDescription", "internalContext", "priceRange", "phone", "website", "streetAddress",
  "postalCode", "hoursNote", "googlePlaceId", "googleMapsUrl", "lastActiveAt",
  "activitySource", "sourceUrl", "verifiedBy", "status", "qualityTier", "reviewFlag",
] as const;
const isTime = (v: unknown) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** Why a record can't be applied (empty = valid). Pure: runs before any DB access. */
function recordErrors(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return ["not a JSON object"];
  const loose = raw as Record<string, unknown>;
  const typeErrors = STRING_FIELDS.filter((k) => loose[k] != null && typeof loose[k] !== "string");
  if (typeErrors.length) return typeErrors.map((k) => `${k} must be a string`);

  const r = raw as EnrichmentRecord;
  const errs: string[] = [];
  if (!present(r.slug) && !present(r.name)) errs.push("needs a slug or name to match on");
  // Enrichment intent: a real record declares qualityTier and/or verifiedBy. A
  // scratch export (match keys + current values) has neither and must never be
  // applied — doing so silently rewrites tier/provenance on every row.
  if (!present(r.qualityTier) && !present(r.verifiedBy))
    errs.push("no enrichment intent (missing qualityTier/verifiedBy)");
  const statuses: string[] = Object.values(BusinessStatus);
  if (present(r.status) && !statuses.includes(r.status))
    errs.push(`status "${r.status}" is not one of ${statuses.join(", ")}`);
  const tiers: string[] = Object.values(QualityTier);
  if (present(r.qualityTier) && !tiers.includes(r.qualityTier))
    errs.push(`qualityTier "${r.qualityTier}" is not one of ${tiers.join(", ")}`);
  if (present(r.lastActiveAt) && Number.isNaN(Date.parse(r.lastActiveAt)))
    errs.push(`lastActiveAt "${r.lastActiveAt}" is not a date`);
  if (r.tags != null && !(Array.isArray(r.tags) && r.tags.every((t) => typeof t === "string")))
    errs.push("tags must be an array of strings");
  if (r.hours != null && !Array.isArray(r.hours)) errs.push("hours must be an array");
  else
    (r.hours ?? []).forEach((block: unknown, i) => {
      const h = (block ?? {}) as Record<string, unknown>;
      const at = `hours[${i}]`;
      if (![0, 1, 2, 3, 4, 5, 6].includes(h.day as number))
        errs.push(`${at}.day must be an integer 0-6 (0 = Sunday), got ${JSON.stringify(h.day)}`);
      if (h.closed != null && typeof h.closed !== "boolean")
        errs.push(`${at}.closed must be true or false, got ${JSON.stringify(h.closed)}`);
      // Closed only when closed === true; closed:false is an open day and needs times.
      else if (h.closed !== true && !(isTime(h.opens) && isTime(h.closes)))
        errs.push(
          `${at} needs opens and closes as HH:MM (24h) or closed: true, got opens ${JSON.stringify(h.opens)}, closes ${JSON.stringify(h.closes)}`,
        );
    });
  return errs;
}

/**
 * Max length for the card `tagline`. The card (BusinessCard.tsx) clamps to two
 * lines at text-sm; ~80 chars fills that without a mid-word CSS cut. This is a
 * data-level guardrail — authored taglines should target ~60–75 chars. Stored
 * copy is word-boundary truncated to this so cards never show "…BB…".
 */
const CARD_TAGLINE_MAX = 80;

/** Trim a tagline to CARD_TAGLINE_MAX at a whole-word boundary. */
function capTagline(s: string): { value: string; truncated: boolean } {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= CARD_TAGLINE_MAX) return { value: t, truncated: false };
  const slice = t.slice(0, CARD_TAGLINE_MAX);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return { value: cut.replace(/[\s,;:.\-–—]+$/, ""), truncated: true };
}

/** Returns the list of unmet GOLD criteria for a record (empty = passes). */
function goldGaps(r: EnrichmentRecord): string[] {
  const gaps: string[] = [];
  if (!present(r.verifiedName) && !present(r.name) && !present(r.slug)) gaps.push("name");
  // Hours criterion: a day-by-day schedule OR a documented hoursNote (e.g.
  // "By appointment", seasonal) satisfies it — matches GOLD_STANDARD prose, where
  // genuinely by-appointment businesses can still be Gold.
  const hasSchedule = present(r.hours) && r.hours.length > 0;
  if (!hasSchedule && !present(r.hoursNote)) gaps.push("hours");
  // NOTE: a recent-activity signal (lastActiveAt ≤90d) is NO LONGER a Gold gate
  // (2026-05-31) — it required stalking socials to verify. Freshness is enforced
  // instead by re-checking website+Google on a cadence and stamping lastVerifiedAt.
  // `lastActiveAt`/`activitySource` remain optional, informational fields.
  if (!present(r.internalContext)) gaps.push("context");
  if (!present(r.shortDescription)) gaps.push("description");
  if (!present(r.categoryName)) gaps.push("category");
  if (!present(r.subcategory)) gaps.push("subcategory");
  return gaps;
}

function labelOf(raw: unknown): string {
  const r = (raw ?? {}) as EnrichmentRecord;
  return String(present(r.slug) ? r.slug : `${r.name ?? "?"}${present(r.city) ? ` (${r.city})` : ""}`);
}

async function resolveBusiness(r: EnrichmentRecord) {
  const include = { category: { select: { slug: true, name: true } } };
  if (present(r.slug)) {
    const b = await prisma.business.findUnique({ where: { slug: r.slug }, include });
    if (b) return [b];
  }
  if (present(r.name)) {
    return prisma.business.findMany({
      where: {
        name: { equals: r.name, mode: "insensitive" },
        ...(present(r.city) ? { city: { equals: r.city, mode: "insensitive" } } : {}),
      },
      include,
    });
  }
  return [];
}

/** DB reads only: the one business a record updates and its target category, or why not. */
async function resolve(r: EnrichmentRecord) {
  const matches = await resolveBusiness(r);
  if (matches.length === 0) return "NO MATCH";
  if (matches.length > 1) return `AMBIGUOUS (${matches.length} matches)`;
  const biz = matches[0];
  if (!present(r.categoryName)) return { r, biz, category: biz.category, categoryId: undefined };
  // By slug or by name: "Event Venues" lives at slug wedding-and-event-venues.
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: slugify(r.categoryName) },
        { name: { equals: r.categoryName.trim(), mode: "insensitive" } },
      ],
    },
  });
  if (!category) return `UNKNOWN CATEGORY "${r.categoryName}"`;
  return { r, biz, category, categoryId: category.id };
}

type Resolved = Exclude<Awaited<ReturnType<typeof resolve>>, string>;

/** Written on every apply; left out of the per-record "writes" list. */
const BOOKKEEPING = new Set(["qualityTier", "reviewFlag", "lastVerifiedAt", "verifiedBy"]);

async function applyRecord({ r, biz, category, categoryId }: Resolved) {
  // Closed subcategory list: an off-list value is not written. It rides in the
  // note instead, which holds the record at STANDARD for review (fit-or-flag).
  let subcategory: string | undefined;
  let subcategoryFlag: string | undefined;
  if (present(r.subcategory)) {
    const want = r.subcategory.trim();
    const list = SUBCATEGORIES[category.slug];
    subcategory = list ? list.find((s) => s.toLowerCase() === want.toLowerCase()) : want;
    if (!subcategory)
      subcategoryFlag = `subcategory "${want}" is not on the ${category.name} list (TAXONOMY.md)`;
  }

  // Decide final tier: enforce the gold bar.
  const gaps = goldGaps(r);
  let tier: QualityTier = QualityTier.STANDARD;
  let note: string | null = [r.reviewFlag, subcategoryFlag].filter(present).join("; ") || null;
  const wantsGold = r.qualityTier === "GOLD";
  if (note) {
    tier = QualityTier.STANDARD; // flagged records never auto-promote
  } else if (wantsGold && gaps.length === 0) {
    tier = QualityTier.GOLD;
  } else if (wantsGold && gaps.length > 0) {
    tier = QualityTier.STANDARD;
    note = `Requested GOLD but missing: ${gaps.join(", ")}`;
  } else if (r.qualityTier === "STANDARD") {
    tier = QualityTier.STANDARD;
  } else if (r.qualityTier === "UNREVIEWED") {
    tier = QualityTier.UNREVIEWED;
  }

  const data: Record<string, unknown> = {
    qualityTier: tier,
    reviewFlag: note,
    lastVerifiedAt: new Date(),
    verifiedBy: present(r.verifiedBy) ? r.verifiedBy : "enrich-apply",
  };
  let taglineWarning: string | null = null;
  if (present(r.verifiedName)) data.name = r.verifiedName;
  if (present(categoryId)) data.categoryId = categoryId;
  if (present(subcategory)) data.subcategory = subcategory;
  if (present(r.tags)) {
    // Tags are owned by enrichment: replace the full set (set:[] then add), and
    // connect-or-create each by slug so the vocab self-populates. Dedupe by slug
    // so a repeated name can't double-create; a tag with no slug ("", "—") is dropped.
    const bySlug = new Map<string, string>();
    for (const t of r.tags) {
      const slug = slugify(t);
      if (slug) bySlug.set(slug, t.trim());
    }
    data.tags = {
      set: [],
      connectOrCreate: [...bySlug].map(([slug, name]) => ({
        where: { slug },
        create: { slug, name },
      })),
    };
  }
  if (present(r.tagline)) {
    const capped = capTagline(r.tagline);
    data.tagline = capped.value;
    if (capped.truncated) taglineWarning = `tagline truncated to ${capped.value.length}c`;
  }
  if (present(r.shortDescription)) data.shortDescription = r.shortDescription;
  if (present(r.internalContext)) data.internalContext = r.internalContext;
  if (present(r.priceRange)) data.priceRange = r.priceRange;
  if (present(r.phone)) data.phone = r.phone;
  if (present(r.website)) data.website = r.website;
  if (present(r.streetAddress)) data.streetAddress = r.streetAddress;
  if (present(r.postalCode)) data.postalCode = r.postalCode;
  // A moved address strands the old pin: clear it so scripts/geocode.ts re-pins.
  // (city is only a match key here, never written, so it can't move.)
  const moved = (["streetAddress", "postalCode"] as const).some(
    (k) => present(r[k]) && r[k]?.trim() !== biz[k]?.trim(),
  );
  if (moved) {
    data.latitude = null;
    data.longitude = null;
  }
  if (present(r.hoursNote)) data.hoursNote = r.hoursNote;
  if (present(r.googlePlaceId)) data.googlePlaceId = r.googlePlaceId;
  if (present(r.googleMapsUrl)) data.googleMapsUrl = r.googleMapsUrl;
  if (present(r.lastActiveAt)) data.lastActiveAt = new Date(r.lastActiveAt);
  if (present(r.activitySource)) data.activitySource = r.activitySource;
  if (present(r.sourceUrl)) data.sourceUrl = r.sourceUrl;
  if (present(r.status)) data.status = BusinessStatus[r.status];

  const writes = Object.keys(data).filter((k) => !BOOKKEEPING.has(k));
  if (present(r.hours)) writes.push("hours");
  const outcome =
    `${DRY ? "DRY " : ""}${tier}${note ? ` — ${note}` : ""}` +
    `${taglineWarning ? ` [${taglineWarning}]` : ""} (writes: ${writes.join(", ") || "nothing"})`;
  if (DRY) return { tier, note, outcome };

  await prisma.$transaction(async (tx) => {
    await tx.business.update({ where: { id: biz.id }, data });
    if (present(r.hours)) {
      // Hours are owned by enrichment: replace the full set for this business.
      await tx.businessHours.deleteMany({ where: { businessId: biz.id } });
      for (const h of r.hours) {
        await tx.businessHours.create({
          data:
            h.closed === true
              ? { businessId: biz.id, dayOfWeek: h.day, opens: "00:00", closes: "00:00", isClosed: true }
              : { businessId: biz.id, dayOfWeek: h.day, opens: h.opens!, closes: h.closes! },
        });
      }
    }
  });
  return { tier, note, outcome };
}

async function main() {
  // Directory scan (the watcher path) only picks up real batch files. Names
  // starting with "_" or "." are scratch/working files and are skipped, so a
  // stray export dropped in this dir is never auto-applied. Explicit file args
  // bypass this (an operator naming a file knows what they're doing).
  let files = fileArgs.length
    ? fileArgs
    : readdirSync(ENRICH_DIR).filter(
        (f) => f.endsWith(".json") && !f.startsWith("_") && !f.startsWith("."),
      );
  if (files.length === 0) {
    console.log(`No enrichment files in ${ENRICH_DIR}.`);
    return;
  }

  const tiers: Record<QualityTier, number> = { GOLD: 0, STANDARD: 0, UNREVIEWED: 0 };
  let flagged = 0;
  const rejected: string[] = [];

  for (const file of files) {
    const path = file.includes("/") ? file : join(ENRICH_DIR, file);
    // Before any write: validate every record (no DB), then match each valid one
    // to exactly one business + category (DB reads only). Any problem = no writes.
    const problems: string[] = [];
    let records: unknown[] = [];
    try {
      const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
      if (Array.isArray(parsed)) records = parsed;
      else problems.push("file must be a JSON array of records");
    } catch (e) {
      problems.push(`unreadable: ${(e as Error).message}`);
    }
    console.log(`\n=== ${file} (${records.length} records)${DRY ? " [dry-run]" : ""} ===`);

    const ready: Resolved[] = [];
    for (const [i, raw] of records.entries()) {
      const where = `#${i + 1} ${labelOf(raw)}`;
      const errs = recordErrors(raw);
      if (errs.length) {
        problems.push(`${where}: ${errs.join("; ")}`);
        continue;
      }
      const res = await resolve(raw as EnrichmentRecord);
      if (typeof res === "string") problems.push(`${where}: ${res}`);
      else ready.push(res);
    }
    if (problems.length) {
      console.log(`  REJECTED, nothing written from this file (${problems.length} problem(s)):`);
      for (const p of problems) console.log(`    - ${p}`);
      rejected.push(file);
      continue;
    }

    for (const p of ready) {
      const res = await applyRecord(p);
      console.log(`  ${labelOf(p.r).padEnd(34)} ${res.outcome}`);
      tiers[res.tier]++;
      if (res.note) flagged++;
    }
  }

  console.log(
    `\nSummary: ${tiers.GOLD} gold, ${tiers.STANDARD} standard, ${tiers.UNREVIEWED} unreviewed (${flagged} flagged for review).`,
  );
  if (rejected.length) {
    console.log(`Rejected, nothing written (${rejected.length}): ${rejected.join(", ")}`);
    process.exitCode = EXIT_REJECTED;
  }
}

main()
  .catch((e) => {
    console.error("apply-enrichment failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
