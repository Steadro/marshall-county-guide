/**
 * Export the live Business table from Neon to a research-friendly CSV.
 *
 *   npx tsx scripts/export-businesses.ts
 *
 * Writes data/businesses-export-<UTC date>.csv. Neon is the system of record;
 * the seed CSV (data/businesses-seed.csv) drifts as enrichment/community-adds
 * land directly in the DB, so this is the current snapshot for analysis.
 *
 * NOTE: includes `internalContext` (internal-only notes). The output path is
 * gitignored (public repo) — keep it local; don't commit it.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /["\,\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const COLUMNS: Array<[string, (b: BizRow) => unknown]> = [
  ["slug", (b) => b.slug],
  ["name", (b) => b.name],
  ["legalName", (b) => b.legalName],
  ["categoryName", (b) => b.category.name],
  ["categorySlug", (b) => b.category.slug],
  ["subcategory", (b) => b.subcategory],
  ["tags", (b) => b.tags.map((t) => t.name).join("|")],
  ["status", (b) => b.status],
  ["qualityTier", (b) => b.qualityTier],
  ["featured", (b) => b.featured],
  ["isChain", (b) => b.isChain],
  ["streetAddress", (b) => b.streetAddress],
  ["city", (b) => b.city],
  ["state", (b) => b.state],
  ["postalCode", (b) => b.postalCode],
  ["latitude", (b) => b.latitude],
  ["longitude", (b) => b.longitude],
  ["phone", (b) => b.phone],
  ["email", (b) => b.email],
  ["website", (b) => b.website],
  ["facebookUrl", (b) => b.facebookUrl],
  ["instagramUrl", (b) => b.instagramUrl],
  ["twitterUrl", (b) => b.twitterUrl],
  ["youtubeUrl", (b) => b.youtubeUrl],
  ["priceRange", (b) => b.priceRange],
  ["foundingYear", (b) => b.foundingYear],
  ["tagline", (b) => b.tagline],
  ["shortDescription", (b) => b.shortDescription],
  ["description", (b) => b.description],
  ["hours", (b) =>
    b.hours
      .map((h) => `${DAYS[h.dayOfWeek]}: ${h.isClosed ? "closed" : `${h.opens}-${h.closes}`}`)
      .join("; "),
  ],
  ["hoursNote", (b) => b.hoursNote],
  ["googlePlaceId", (b) => b.googlePlaceId],
  ["googleMapsUrl", (b) => b.googleMapsUrl],
  ["lastActiveAt", (b) => b.lastActiveAt],
  ["activitySource", (b) => b.activitySource],
  ["dataSource", (b) => b.dataSource],
  ["sourceUrl", (b) => b.sourceUrl],
  ["lastVerifiedAt", (b) => b.lastVerifiedAt],
  ["verifiedBy", (b) => b.verifiedBy],
  ["reviewFlag", (b) => b.reviewFlag],
  ["internalContext", (b) => b.internalContext],
  ["createdAt", (b) => b.createdAt],
  ["updatedAt", (b) => b.updatedAt],
];

type BizRow = Awaited<ReturnType<typeof fetchRows>>[number];

function fetchRows() {
  return prisma.business.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true } },
      hours: {
        select: { dayOfWeek: true, opens: true, closes: true, isClosed: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });
}

async function main() {
  const rows = await fetchRows();
  const header = COLUMNS.map(([h]) => h).join(",");
  const body = rows.map((b) => COLUMNS.map(([, get]) => csvCell(get(b))).join(",")).join("\r\n");
  const csv = `﻿${header}\r\n${body}\r\n`; // BOM + CRLF: opens cleanly in Excel and parses fine for analysis

  const stamp = new Date().toISOString().slice(0, 10);
  const path = join(process.cwd(), "data", `businesses-export-${stamp}.csv`);
  writeFileSync(path, csv, "utf8");

  const byTier: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const b of rows) {
    byTier[b.qualityTier] = (byTier[b.qualityTier] ?? 0) + 1;
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
  }
  console.log(`Wrote ${rows.length} businesses -> ${path}`);
  console.log("By qualityTier:", byTier);
  console.log("By status:", byStatus);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
