/**
 * Build the enrichment worklist: businesses that need a deeper research pass.
 *
 *     npx tsx scripts/enrich-worklist.ts            # write the worklist file
 *     npx tsx scripts/enrich-worklist.ts --print    # also print it to stdout
 *
 * The "queue" is just DB state, not a separate table. A business is queued when
 * it is UNREVIEWED — which is exactly how the admin Intake "Approve" action
 * stamps a freshly-promoted listing (dataSource="intake", status=DRAFT,
 * qualityTier=UNREVIEWED, reviewFlag set). As records get enriched up to
 * STANDARD/GOLD they fall off the queue automatically.
 *
 * This is the READ/seed half. It writes a research-friendly JSON list that the
 * enrichment research pass (Cowork / a Claude Code Workflow) consumes to produce
 * data/enrichment/*.json batch records, which apply-enrichment.ts then writes to
 * Neon (matched by slug). It NEVER writes to the DB and NEVER writes into
 * data/enrichment/ (that dir is the watcher's hot zone — see MEMORY).
 *
 * Output: data/enrich-worklist-<UTC date>.json (gitignored; carries the
 * submitter's internalContext, so keep it local).
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";

const PRINT = process.argv.includes("--print");

async function main() {
  // Queue = anything not yet reviewed. Intake-approved listings land here; you
  // can widen the filter (e.g. drop the qualityTier clause to also re-touch
  // STANDARD records) if you ever want a deeper sweep.
  const rows = await prisma.business.findMany({
    where: { qualityTier: "UNREVIEWED" },
    orderBy: [{ createdAt: "desc" }],
    select: {
      slug: true, // match key for apply-enrichment.ts
      name: true,
      city: true,
      streetAddress: true,
      phone: true,
      website: true,
      status: true,
      dataSource: true,
      reviewFlag: true,
      internalContext: true, // holds the submitter's typed type + note for intake rows
      category: { select: { name: true } },
      subcategory: true,
      createdAt: true,
    },
  });

  const worklist = rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    city: b.city,
    streetAddress: b.streetAddress,
    phone: b.phone,
    website: b.website,
    currentCategory: b.category.name,
    currentSubcategory: b.subcategory,
    source: b.dataSource,
    reviewFlag: b.reviewFlag,
    context: b.internalContext,
    createdAt: b.createdAt.toISOString(),
  }));

  const stamp = new Date().toISOString().slice(0, 10);
  const path = join(process.cwd(), "data", `enrich-worklist-${stamp}.json`);
  writeFileSync(path, JSON.stringify(worklist, null, 2), "utf8");

  const intakeCount = worklist.filter((w) => w.source === "intake").length;
  console.log(`Enrichment queue: ${worklist.length} business(es) UNREVIEWED (${intakeCount} from intake)`);
  console.log(`Wrote -> ${path}`);
  if (PRINT) console.log(JSON.stringify(worklist, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
