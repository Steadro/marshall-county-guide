/**
 * Seed the directory from data/businesses-seed.csv.
 *
 * - Idempotent: upserts Categories and Businesses by their stable `slug`, so
 *   re-running refreshes data without creating duplicates.
 * - Robust CSV parse (handles quoted fields containing commas).
 * - Unique, stable business slugs; chains with multiple locations are
 *   de-collided by city, then street, then a numeric suffix.
 * - Geocoding is a SEPARATE step (scripts/geocode.ts) so this stays fast and
 *   never clobbers coordinates on re-run.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { BusinessStatus, QualityTier } from "../app/generated/prisma/client";
import { slugify } from "../lib/utils";

// --- Category metadata: display order + landing-page intro copy --------------
// Keyed by the exact `category` value in the CSV.
const CATEGORY_META: Record<string, { sortOrder: number; description: string }> = {
  "Restaurant & Food": {
    sortOrder: 1,
    description:
      "Where Marshall County eats, from downtown cafes and BBQ joints to family diners and sweet local creameries.",
  },
  "Retail & Shopping": {
    sortOrder: 2,
    description:
      "Boutiques, antique malls, hardware stores, and everyday essentials across Lewisburg and the surrounding towns.",
  },
  "Beauty & Personal Care": {
    sortOrder: 3,
    description: "Salons, barbers, and nail studios keeping the community looking its best.",
  },
  "Health & Medical": {
    sortOrder: 4,
    description: "Doctors, dentists, pharmacies, and clinics close to home.",
  },
  "Pets & Animals": {
    sortOrder: 5,
    description: "Veterinarians, groomers, boarding, daycare, and pet supplies across the county.",
  },
  Automotive: {
    sortOrder: 6,
    description: "Repair shops, tire centers, parts stores, and towing you can count on.",
  },
  "Home & Trades": {
    sortOrder: 7,
    description: "Plumbers, electricians, HVAC, concrete, and the trades that keep homes running.",
  },
  "Professional Services": {
    sortOrder: 8,
    description: "Attorneys, insurance agents, IT, and other professionals serving the area.",
  },
  Financial: {
    sortOrder: 9,
    description: "Community banks, credit unions, accountants, and financial advisors.",
  },
  "Real Estate": {
    sortOrder: 10,
    description: "Local agents and auction firms who know Marshall County ground.",
  },
  "Fitness & Recreation": {
    sortOrder: 11,
    description: "Gyms, recreation centers, and places to stay active.",
  },
  "Childcare & Education": {
    sortOrder: 12,
    description: "Childcare centers, preschools, and early-learning programs.",
  },
  "Arts & Entertainment": {
    sortOrder: 13,
    description: "Parks, recreation, and places to play in and around Lewisburg.",
  },
  Agriculture: {
    sortOrder: 14,
    description: "Farms, co-ops, vineyards, and the agricultural roots of the region.",
  },
  Manufacturing: {
    sortOrder: 15,
    description: "The makers and major employers driving the local economy.",
  },
  Other: {
    sortOrder: 16,
    description: "Lodging, storage, laundry, funeral homes, and other community services.",
  },
};

// National chains (exact CSV names). Flagged so the site can de-emphasize them
// and spotlight local/regional businesses instead. Locally-owned franchises and
// named local agents (e.g. "Guthrie's Ace Hardware", State Farm agents, Edward
// Jones advisors) are intentionally NOT treated as chains. They're local folks.
// Regional TN brands (e.g. LawLer's Barbecue) are also kept as local.
const NATIONAL_CHAINS = new Set<string>([
  // Automotive parts
  "Advance Auto Parts",
  "AutoZone",
  "O'Reilly Auto Parts",
  "NAPA Auto Parts",
  // Beauty
  "Great Clips",
  "SmartStyle",
  // Financial / tax
  "H&R Block",
  // Pharmacy / grocery
  "Walgreens",
  "Kroger Pharmacy",
  "Kroger",
  // Fast food
  "Burger King",
  "Captain D's",
  "Domino's Pizza",
  "KFC",
  "McDonald's",
  "Sonic Drive-In",
  "Subway",
  "Taco Bell",
  "Wendy's",
  // Discount / big-box retail
  "Dollar General",
  "Family Dollar",
  "Tractor Supply Co.",
  "Walmart Supercenter",
]);

// Hand-picked showcase businesses (exact CSV names). Spread across categories so
// the homepage "Featured" strip reads as an intentional editorial selection.
const FEATURED = new Set<string>([
  "LawLer's Barbecue",
  "Nash Family Creamery",
  "C & F Tire and Auto",
  "Woodfeather Farm Winery and Vineyard",
  "Henry Horton State Park",
  "David Jent Realty & Auction",
  "Old Hickory Smokehouse",
  "Lewisburg Parks Rec and Fitness",
]);

// --- CSV parsing ------------------------------------------------------------

/** RFC-4180-ish parser: handles quoted fields, embedded commas, and "" escapes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // ignore; handled by \n
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function clean(v: string | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// --- Slug de-collision ------------------------------------------------------

/** First number + first word of a street, slugified, e.g. "460 N Ellington" -> "460-n-ellington". */
function streetToken(street: string | null): string | null {
  if (!street) return null;
  const token = street.split(/[,]/)[0].split(/\s+/).slice(0, 3).join(" ");
  return slugify(token) || null;
}

function makeUniqueSlug(
  used: Set<string>,
  name: string,
  city: string | null,
  street: string | null,
): string {
  const base = slugify(name);
  const candidates = [base];
  if (city) candidates.push(slugify(`${name} ${city}`));
  const st = streetToken(street);
  if (st) candidates.push(`${base}-${st}`);

  for (const c of candidates) {
    if (c && !used.has(c)) {
      used.add(c);
      return c;
    }
  }
  // Last resort: numeric suffix on the base.
  let n = 2;
  let candidate = `${base}-${n}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  used.add(candidate);
  return candidate;
}

// --- Seed -------------------------------------------------------------------

async function main() {
  const csvPath = join(process.cwd(), "data", "businesses-seed.csv");
  const text = readFileSync(csvPath, "utf8");
  const rows = parseCsv(text).filter((r) => r.some((cell) => cell.trim() !== ""));

  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col("name"),
    category: col("category"),
    address: col("address"),
    city: col("city"),
    state: col("state"),
    zip: col("zip"),
    phone: col("phone"),
    website: col("website"),
    shortDescription: col("short_description"),
    sourceUrl: col("source_url"),
  };

  const dataRows = rows.slice(1);
  console.log(`Parsed ${dataRows.length} business rows from CSV.`);

  // 1) Upsert categories from distinct CSV values.
  const categoryNames = [...new Set(dataRows.map((r) => clean(r[idx.category]) ?? "Other"))];
  const categoryIdByName = new Map<string, string>();
  for (const name of categoryNames) {
    const slug = slugify(name);
    const meta = CATEGORY_META[name] ?? { sortOrder: 99, description: "" };
    const category = await prisma.category.upsert({
      where: { slug },
      create: { slug, name, sortOrder: meta.sortOrder, description: meta.description || null },
      update: { name, sortOrder: meta.sortOrder, description: meta.description || null },
    });
    categoryIdByName.set(name, category.id);
  }
  console.log(`Upserted ${categoryNames.length} categories.`);

  // 2) Upsert businesses with unique, stable slugs.
  const usedSlugs = new Set<string>();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of dataRows) {
    const name = clean(r[idx.name]);
    if (!name) continue;
    const categoryName = clean(r[idx.category]) ?? "Other";
    const categoryId = categoryIdByName.get(categoryName)!;
    const city = clean(r[idx.city]) ?? "Lewisburg";
    const street = clean(r[idx.address]);
    const sourceUrl = clean(r[idx.sourceUrl]);

    const slug = makeUniqueSlug(usedSlugs, name, city, street);

    const fields = {
      name,
      categoryId,
      shortDescription: clean(r[idx.shortDescription]),
      streetAddress: street,
      city,
      state: clean(r[idx.state]) ?? "TN",
      postalCode: clean(r[idx.zip]),
      country: "US",
      phone: clean(r[idx.phone]),
      website: clean(r[idx.website]),
      status: BusinessStatus.UNVERIFIED,
      featured: FEATURED.has(name),
      isChain: NATIONAL_CHAINS.has(name),
      dataSource: sourceUrl,
      sourceUrl,
    };

    // Enrichment-safe: only CREATE new businesses, and only UPDATE records that
    // enrichment hasn't touched (qualityTier UNREVIEWED). Records that have been
    // promoted to STANDARD/GOLD are left alone so a re-seed never clobbers
    // enriched copy/status/category. latitude/longitude are never in `fields`,
    // so the geocode step's coords are preserved either way.
    const existing = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, qualityTier: true },
    });
    if (!existing) {
      await prisma.business.create({ data: { slug, ...fields } });
      created += 1;
    } else if (existing.qualityTier === QualityTier.UNREVIEWED) {
      await prisma.business.update({ where: { slug }, data: fields });
      updated += 1;
    } else {
      skipped += 1; // enriched record — preserve it
    }
  }

  console.log(`Businesses: ${created} created, ${updated} updated, ${skipped} skipped (enriched).`);
  const total = await prisma.business.count();
  const featuredCount = await prisma.business.count({ where: { featured: true } });
  console.log(`Done. ${total} businesses in the database (${featuredCount} featured).`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
