/**
 * Apply enrichment batches to the database.
 *
 * The enrichment workflow (see ENRICHMENT.md) researches businesses and writes
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
 * - Idempotent: re-running the same batch converges to the same state.
 * - Only fields present in a record are written; absent fields are left untouched.
 * - Enforces the gold bar: a record may only reach GOLD if every criterion in
 *   GOLD_STANDARD.md is satisfied; otherwise it is written as STANDARD with a note.
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { BusinessStatus, QualityTier } from "../app/generated/prisma/client";
import { slugify } from "../lib/utils";

const ENRICH_DIR = join(process.cwd(), "data", "enrichment");
const DRY = process.argv.includes("--dry-run");
const fileArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));

type HoursBlock =
  | { day: number; opens: string; closes: string }
  | { day: number; closed: true };

interface EnrichmentRecord {
  // --- match key (one required) ---
  slug?: string;
  name?: string;
  city?: string;
  // --- verified fields (all optional; only present ones are written) ---
  verifiedName?: string; // overrides display name if branding differs
  categoryName?: string; // must be an existing Category name
  subcategory?: string;
  shortDescription?: string; // the 1–2 line public copy
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

function present<T>(v: T | undefined | null): v is T {
  return v !== undefined && v !== null;
}

/** Returns the list of unmet GOLD criteria for a record (empty = passes). */
function goldGaps(r: EnrichmentRecord): string[] {
  const gaps: string[] = [];
  if (!present(r.verifiedName) && !present(r.name) && !present(r.slug)) gaps.push("name");
  // Hours criterion: a day-by-day schedule OR a documented hoursNote (e.g.
  // "By appointment", seasonal) satisfies it — matches GOLD_STANDARD prose, where
  // genuinely by-appointment businesses can still be Gold.
  const hasSchedule = present(r.hours) && r.hours.length > 0;
  const hasHoursNote = present(r.hoursNote) && r.hoursNote.trim().length > 0;
  if (!hasSchedule && !hasHoursNote) gaps.push("hours");
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

async function resolveBusiness(r: EnrichmentRecord) {
  if (r.slug) {
    const b = await prisma.business.findUnique({ where: { slug: r.slug } });
    if (b) return [b];
  }
  if (r.name) {
    return prisma.business.findMany({
      where: {
        name: { equals: r.name, mode: "insensitive" },
        ...(r.city ? { city: { equals: r.city, mode: "insensitive" } } : {}),
      },
    });
  }
  return [];
}

async function applyRecord(r: EnrichmentRecord) {
  const matches = await resolveBusiness(r);
  const label = r.slug ?? `${r.name ?? "?"}${r.city ? ` (${r.city})` : ""}`;

  if (matches.length === 0) return { label, outcome: "NO MATCH" as const };
  if (matches.length > 1)
    return { label, outcome: `AMBIGUOUS (${matches.length} matches)` as const };
  const biz = matches[0];

  // Resolve category by name -> id, if provided.
  let categoryId: string | undefined;
  if (r.categoryName) {
    const cat = await prisma.category.findUnique({ where: { slug: slugify(r.categoryName) } });
    if (!cat) return { label, outcome: `UNKNOWN CATEGORY "${r.categoryName}"` as const };
    categoryId = cat.id;
  }

  // Decide final tier: enforce the gold bar.
  const gaps = goldGaps(r);
  let tier: QualityTier = QualityTier.STANDARD;
  let note: string | null = r.reviewFlag ?? null;
  const wantsGold = r.qualityTier === "GOLD";
  if (r.reviewFlag) {
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
    verifiedBy: r.verifiedBy ?? "enrich-apply",
  };
  if (present(r.verifiedName)) data.name = r.verifiedName;
  if (present(categoryId)) data.categoryId = categoryId;
  if (present(r.subcategory)) data.subcategory = r.subcategory;
  if (present(r.shortDescription)) data.shortDescription = r.shortDescription;
  if (present(r.internalContext)) data.internalContext = r.internalContext;
  if (present(r.priceRange)) data.priceRange = r.priceRange;
  if (present(r.phone)) data.phone = r.phone;
  if (present(r.website)) data.website = r.website;
  if (present(r.streetAddress)) data.streetAddress = r.streetAddress;
  if (present(r.postalCode)) data.postalCode = r.postalCode;
  if (present(r.hoursNote)) data.hoursNote = r.hoursNote;
  if (present(r.googlePlaceId)) data.googlePlaceId = r.googlePlaceId;
  if (present(r.googleMapsUrl)) data.googleMapsUrl = r.googleMapsUrl;
  if (present(r.lastActiveAt)) data.lastActiveAt = new Date(r.lastActiveAt);
  if (present(r.activitySource)) data.activitySource = r.activitySource;
  if (present(r.sourceUrl)) data.sourceUrl = r.sourceUrl;
  if (present(r.status)) data.status = BusinessStatus[r.status];

  if (DRY) {
    return { label, outcome: `DRY ${tier}${note ? ` — ${note}` : ""}`, biz };
  }

  await prisma.$transaction(async (tx) => {
    await tx.business.update({ where: { id: biz.id }, data });
    if (present(r.hours)) {
      // Hours are owned by enrichment: replace the full set for this business.
      await tx.businessHours.deleteMany({ where: { businessId: biz.id } });
      for (const h of r.hours) {
        await tx.businessHours.create({
          data:
            "closed" in h
              ? { businessId: biz.id, dayOfWeek: h.day, opens: "00:00", closes: "00:00", isClosed: true }
              : { businessId: biz.id, dayOfWeek: h.day, opens: h.opens, closes: h.closes },
        });
      }
    }
  });
  return { label, outcome: `${tier}${note ? ` — ${note}` : ""}`, biz };
}

async function main() {
  let files = fileArgs.length
    ? fileArgs
    : readdirSync(ENRICH_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.log(`No enrichment files in ${ENRICH_DIR}.`);
    return;
  }

  const summary = { gold: 0, standard: 0, unreviewed: 0, flagged: 0, problems: [] as string[] };

  for (const file of files) {
    const path = file.includes("/") ? file : join(ENRICH_DIR, file);
    const records = JSON.parse(readFileSync(path, "utf8")) as EnrichmentRecord[];
    console.log(`\n=== ${file} (${records.length} records)${DRY ? " [dry-run]" : ""} ===`);
    for (const r of records) {
      const res = await applyRecord(r);
      console.log(`  ${res.label.padEnd(34)} ${res.outcome}`);
      if (res.outcome.startsWith("GOLD") || res.outcome.startsWith("DRY GOLD")) summary.gold++;
      else if (res.outcome.includes("STANDARD")) summary.standard++;
      else if (res.outcome.includes("UNREVIEWED")) summary.unreviewed++;
      else summary.problems.push(`${res.label}: ${res.outcome}`);
      if (res.outcome.includes("Requested GOLD but missing") || res.outcome.includes("review"))
        summary.flagged++;
    }
  }

  console.log(
    `\nSummary: ${summary.gold} gold, ${summary.standard} standard, ${summary.unreviewed} unreviewed.`,
  );
  if (summary.problems.length) {
    console.log(`Needs attention (${summary.problems.length}):`);
    for (const p of summary.problems) console.log(`  - ${p}`);
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
