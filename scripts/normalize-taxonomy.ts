/**
 * One-time taxonomy normalization (subcategory + tags axes).
 *
 *   npx tsx scripts/normalize-taxonomy.ts            # dry-run (default): print plan
 *   npx tsx scripts/normalize-taxonomy.ts --apply    # write to Neon
 *
 * Encodes schema/TAXONOMY.md: every category has a CLOSED canonical subcategory
 * list. This maps the drifted values the gold run wrote onto that list, moving
 * cuisine/specialty/attribute nuance into `tags` (which were empty after the gold
 * run, so the replace-on-write is safe).
 *
 * Rules:
 * - Clean remap: set subcategory (+ derived tags). qualityTier / verifiedBy /
 *   lastVerifiedAt are LEFT UNTOUCHED — this is relabeling, not re-verification.
 * - Tags are only written when we DERIVE them (so a value already canonical never
 *   wipes existing tags). Tag set is the COMPLETE derived list (set + connectOrCreate).
 * - Fit-or-flag: a value not in the map and not already canonical is left as-is,
 *   gets a reviewFlag, and is pinned to STANDARD for maintainer review.
 * - Category MOVES (TAXONOMY-sanctioned) are applied and reported, not flagged.
 * - HOLD values (open category decisions) are skipped untouched and reported.
 *
 * Idempotent enough for a one-shot: canonical values map to themselves and don't
 * touch tags; only originally-drifted rows derive tags. Intended to run ONCE.
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../lib/prisma";
import { QualityTier } from "../app/generated/prisma/client";
import { slugify } from "../lib/utils";

const APPLY = process.argv.includes("--apply");

type Rule = { sub: string; tags?: string[]; cat?: string; flag?: string };

// Closed canonical subcategory lists per category slug (TAXONOMY.md). Used for
// identity matches + idempotency (a canonical value maps to itself, no tag touch).
const CANON: Record<string, string[]> = {
  // v2: tightened to consumer-meaningful venue types. Diner folds into Restaurant,
  // Deli into Fast Food, Coffee Shop into Cafe, Pub & Bar into Bar & Grill —
  // the splits a diner-goes-here vs restaurant-goes-there don't change a choice.
  "restaurant-and-food": ["Restaurant","Cafe","Bakery","Bar & Grill","Fast Food","Food Truck","Dessert & Ice Cream","Juice & Smoothie Bar"],
  "automotive": ["Auto Repair","Tire & Auto Repair","Auto Repair & Towing","Auto Parts & Accessories","Car Wash","Body Shop","Dealership"],
  "retail-and-shopping": ["Dollar & Variety","Supercenter","Grocery","Convenience & Travel Stop","Hardware Store","Farm & Feed","Florist","Boutique","Antiques & Vintage","Home Decor","Smoke & Vape Shop","Liquidation & Discount","Jewelry"],
  "financial": ["Bank","Credit Union","CPA & Accounting","Tax Preparation","Investment & Advisory","Insurance"],
  "professional-services": ["Law Firm","Insurance Agency","Funeral Home","Web & IT Services","Marketing & Design","Photography"],
  "health-and-medical": ["Family Medicine","Urgent Care","Hospital","Dentistry","Pharmacy","Optometry","Specialty Clinic"],
  "beauty-and-personal-care": ["Hair Salon","Barber Shop","Nail Salon","Spa","Salon Suites","Dry Cleaning"],
  "home-and-trades": ["Plumbing, Electrical & HVAC","HVAC & Refrigeration","Tree & Lawn Service","Concrete & Masonry","Construction","Roofing","Landscaping","Handyman","Propane & Gas"],
  "fitness-and-recreation": ["City Park","State Park","Greenway & Trail","Gym & Fitness Center","Recreation Center","Golf Course","Sports Complex","Studio","Show Grounds"],
  "manufacturing": ["Automotive Components","Metal Fabrication & Machining","Plastics & Film","Packaging","Food Processing","Electronics","Printing","Distribution & Warehousing","Industrial Equipment","Consumer Goods"],
  "pets-and-animals": ["Veterinary","Pet Grooming","Boarding & Daycare","Pet Supplies"],
  "real-estate": ["Residential Real Estate","Commercial Real Estate","Realty & Auction"],
  "agriculture": ["Farm & Ranch Supply","Livestock & Breeding","Crop & Produce","Winery & Vineyard"],
  "childcare-and-education": ["Childcare & Preschool","Tutoring & Enrichment","Early Intervention Services"],
  "arts-and-entertainment": ["Museum","Theatre","Gallery","Cinema","Live Music Venue"],
  // v2: one venue type; barn/outdoor/farm become tags, not separate subcategories.
  "wedding-and-event-venues": ["Event Venue"],
  "government-and-civic": ["City Hall","County Government Office","Court & Clerk","Post Office","Public Library","Public Works","Cemetery"],
  "schools": ["Elementary School","Intermediate School","Middle School","High School","Middle & High School","District Administration","Career & Technical"],
  "public-safety": ["Fire Department","Police Department","Sheriff's Office","EMS","Animal Control","Detention Facility"],
  "community-and-nonprofit": ["Chamber of Commerce","Senior Center","Social Services","Veterans Organization","Thrift & Donations"],
  "places-of-worship": ["Church","Other Place of Worship"],
};

// Drifted value (lowercased) -> canonical rule. Cuisine/specialty/attribute -> tags.
const MAP: Record<string, Record<string, Rule>> = {
  "restaurant-and-food": {
    "mexican": { sub: "Restaurant", tags: ["Mexican"] },
    "pizza": { sub: "Restaurant", tags: ["Pizza"] },
    "italian": { sub: "Restaurant", tags: ["Italian"] },
    "asian": { sub: "Restaurant", tags: ["Asian"] },
    "bbq": { sub: "Restaurant", tags: ["BBQ"] },
    "southern/home-cooking": { sub: "Restaurant", tags: ["Southern"] },
    "southern/american": { sub: "Restaurant", tags: ["Southern", "American"] },
    "burgers & american": { sub: "Restaurant", tags: ["Burgers", "American"] },
    "cafe & coffee": { sub: "Cafe" },
    "coffee shop": { sub: "Cafe" },
    "ice cream & dessert": { sub: "Dessert & Ice Cream" },
    "deli & sandwiches": { sub: "Fast Food", tags: ["Sandwiches"] },
    "deli": { sub: "Fast Food", tags: ["Sandwiches"] },
    "mexican fast food": { sub: "Fast Food", tags: ["Mexican"] },
    "fast food seafood": { sub: "Fast Food", tags: ["Seafood"] },
    "country diner": { sub: "Restaurant", tags: ["Southern"] },
    "diner": { sub: "Restaurant" },
    "pub & bar": { sub: "Bar & Grill" },
    "nutrition & smoothies": { sub: "Juice & Smoothie Bar" },
    "travel stop & southern bbq": { sub: "Convenience & Travel Stop", cat: "Retail & Shopping", tags: ["BBQ"] },
    "country store & burgers": { sub: "Restaurant", tags: ["Burgers"], flag: "subcategory: General Store w/ grill -- old country store that also served burgers (now closed); confirm whether this is Retail (general store) or Restaurant" },
  },
  "automotive": {
    "auto parts & supplies": { sub: "Auto Parts & Accessories" },
    "auto & diesel repair / towing": { sub: "Auto Repair & Towing", tags: ["diesel"] },
    "tires & brakes": { sub: "Tire & Auto Repair" },
  },
  "retail-and-shopping": {
    "women's boutique": { sub: "Boutique", tags: ["women's"] },
    "women's apparel & gifts": { sub: "Boutique", tags: ["women's", "gifts"] },
    "apparel": { sub: "Boutique" },
    "gas station & convenience store": { sub: "Convenience & Travel Stop" },
    "grocery & deli": { sub: "Grocery", tags: ["deli"] },
    "grocery & general store": { sub: "Grocery", tags: ["general-store"] },
    "home decor & boutique": { sub: "Home Decor", tags: ["boutique"] },
    "jewelry": { sub: "Jewelry" },
  },
  "financial": {
    "community bank": { sub: "Bank", tags: ["community-bank"] },
    "community bank branch": { sub: "Bank", tags: ["community-bank"] },
    "cpa / accounting": { sub: "CPA & Accounting" },
    "cpa / tax preparation": { sub: "CPA & Accounting", tags: ["tax-preparation"] },
    "federal credit union": { sub: "Credit Union" },
    "community credit union": { sub: "Credit Union", tags: ["community"] },
    "investment & financial advisory": { sub: "Investment & Advisory" },
    "fraternal financial services": { sub: "Insurance", tags: ["fraternal"] },
  },
  "professional-services": {
    "criminal defense & personal injury law": { sub: "Law Firm", tags: ["criminal-defense", "personal-injury"] },
    "criminal defense & family law": { sub: "Law Firm", tags: ["criminal-defense", "family-law"] },
    "personal injury & family law": { sub: "Law Firm", tags: ["personal-injury", "family-law"] },
    "independent insurance agency": { sub: "Insurance Agency", tags: ["independent"] },
    "web design & it services": { sub: "Web & IT Services" },
    "photography": { sub: "Photography" },
  },
  "health-and-medical": {
    "general dentistry": { sub: "Dentistry" },
    "general & cosmetic dentistry": { sub: "Dentistry", tags: ["cosmetic"] },
    "urgent care & family medicine": { sub: "Urgent Care", tags: ["family-medicine"] },
    "pharmacy & drugstore": { sub: "Pharmacy" },
    "retail pharmacy": { sub: "Pharmacy", tags: ["retail"] },
    "independent pharmacy": { sub: "Pharmacy", tags: ["independent"] },
    "critical access hospital": { sub: "Hospital", tags: ["critical-access"] },
  },
  "beauty-and-personal-care": {
    "nail salon & tanning": { sub: "Nail Salon", tags: ["tanning"] },
  },
  "home-and-trades": {
    "concrete products & masonry": { sub: "Concrete & Masonry" },
    "plumbing, electrical & hvac supply": { sub: "Plumbing, Electrical & HVAC", tags: ["supply"] },
    "handyman": { sub: "Handyman" },
    "propane & gas supplier": { sub: "Propane & Gas" },
    "propane & gas dealer": { sub: "Propane & Gas" },
  },
  "fitness-and-recreation": {
    "public golf course": { sub: "Golf Course" },
    "municipal recreation center": { sub: "Recreation Center" },
    "city park & lake": { sub: "City Park", tags: ["lake"] },
    "city park & greenway trail": { sub: "City Park", tags: ["greenway"] },
    "youth sports complex": { sub: "Sports Complex", tags: ["youth"] },
    "softball complex": { sub: "Sports Complex", tags: ["softball"] },
    "soccer complex": { sub: "Sports Complex", tags: ["soccer"] },
    "pilates": { sub: "Studio", tags: ["pilates"] },
    "equestrian show grounds": { sub: "Show Grounds", tags: ["equestrian"] },
  },
  "manufacturing": {
    "custom fabrication & machining": { sub: "Metal Fabrication & Machining" },
    "aluminum die casting": { sub: "Metal Fabrication & Machining", tags: ["die-casting"] },
    "shoe warehouse & distribution": { sub: "Distribution & Warehousing", tags: ["footwear"] },
    "automotive hose manufacturing": { sub: "Automotive Components", tags: ["hoses"] },
    "automotive structures": { sub: "Automotive Components", tags: ["structures"] },
    "automotive trim & structural parts": { sub: "Automotive Components", tags: ["trim"] },
    "corrugated packaging": { sub: "Packaging", tags: ["corrugated"] },
    "defense & aerospace electronics": { sub: "Electronics", tags: ["defense", "aerospace"] },
    "stretch film & polyethylene film": { sub: "Plastics & Film", tags: ["film"] },
    "specialty food production": { sub: "Food Processing", tags: ["specialty"] },
    "commercial printing": { sub: "Printing" },
    "hvac manufacturing": { sub: "Distribution & Warehousing", tags: ["hvac"] },
    "conveyor & material handling equipment": { sub: "Industrial Equipment", tags: ["material-handling"] },
    "pencil & school supplies manufacturing": { sub: "Consumer Goods", tags: ["stationery"] },
  },
  "agriculture": {
    "herb farm": { sub: "Crop & Produce", tags: ["herbs"] },
    "winery & tasting room": { sub: "Winery & Vineyard" },
    "horse and livestock breeder": { sub: "Livestock & Breeding" },
  },
  "childcare-and-education": {
    "preschool & daycare": { sub: "Childcare & Preschool" },
    "disability & early intervention services": { sub: "Early Intervention Services" },
  },
  "arts-and-entertainment": {
    "history museum": { sub: "Museum" },
    "community theatre": { sub: "Theatre" },
  },
  "real-estate": {
    "real estate & auction": { sub: "Realty & Auction" },
  },
  "wedding-and-event-venues": {
    "barn wedding venue": { sub: "Event Venue", tags: ["barn"] },
    "barn venue": { sub: "Event Venue", tags: ["barn"] },
    "farm & barn venue": { sub: "Event Venue", tags: ["barn", "farm"] },
    "wedding venue": { sub: "Event Venue" },
    "wedding & event venue": { sub: "Event Venue" },
    "outdoor wedding & event venue": { sub: "Event Venue", tags: ["outdoor"] },
    "outdoor venue": { sub: "Event Venue", tags: ["outdoor"] },
  },
  "public-safety": {
    "emergency medical services": { sub: "EMS" },
    "county sheriff": { sub: "Sheriff's Office" },
    "county detention facility": { sub: "Detention Facility" },
    "volunteer fire department": { sub: "Fire Department", tags: ["volunteer"] },
    "volunteer fire and rescue": { sub: "Fire Department", tags: ["volunteer"] },
    "municipal fire department": { sub: "Fire Department", tags: ["municipal"] },
    "municipal police department": { sub: "Police Department", tags: ["municipal"] },
  },
  "community-and-nonprofit": {
    "human services agency": { sub: "Social Services" },
    "social services & financial assistance": { sub: "Social Services" },
    "social services & thrift": { sub: "Thrift & Donations", tags: ["social-services"] },
  },
  "schools": {
    "public elementary school": { sub: "Elementary School", tags: ["public"] },
    "public intermediate school": { sub: "Intermediate School", tags: ["public"] },
    "public high school": { sub: "High School", tags: ["public"] },
    "public middle school": { sub: "Middle School", tags: ["public"] },
    "public middle and high school": { sub: "Middle & High School", tags: ["public"] },
    "public middle/high school": { sub: "Middle & High School", tags: ["public"] },
    "school district administration": { sub: "District Administration" },
    "career & technical education": { sub: "Career & Technical" },
  },
  // Civic office-level granularity: collapse to County Government Office, preserve
  // the specific function as a TAG (lossless). Reported so the maintainer can
  // decide whether to keep office-level subcategories instead.
  "government-and-civic": {
    "municipal government": { sub: "City Hall" },
    "court clerk": { sub: "Court & Clerk" },
    "chancery court clerk": { sub: "Court & Clerk" },
    "county clerk": { sub: "County Government Office", tags: ["county-clerk"] },
    "county road maintenance": { sub: "Public Works", tags: ["roads"] },
    "solid waste & recycling": { sub: "Public Works", tags: ["solid-waste"] },
    "municipal cemetery": { sub: "Cemetery" },
    "county executive office": { sub: "County Government Office", tags: ["mayor"] },
    "register of deeds": { sub: "County Government Office", tags: ["register-of-deeds"] },
    "veterans services": { sub: "County Government Office", tags: ["veterans"] },
    "property assessment": { sub: "County Government Office", tags: ["assessor"] },
    "county courthouse": { sub: "County Government Office", tags: ["courthouse"] },
    "election administration": { sub: "County Government Office", tags: ["elections"] },
    "emergency management": { sub: "County Government Office", tags: ["emergency-management"] },
    "county tax office": { sub: "County Government Office", tags: ["trustee"] },
    "public health clinic": { sub: "County Government Office", tags: ["public-health"] },
  },
  "other": {
    "funeral home & crematory": { sub: "Funeral Home", cat: "Professional Services", tags: ["crematory"] },
    "funeral home": { sub: "Funeral Home", cat: "Professional Services" },
  },
};

// Open category decision (TAXONOMY) — leave untouched, just report.
const HOLD: Record<string, Set<string>> = {
  other: new Set(["self-storage", "hotel & lodging", "laundromat", "motel / budget hotel"]),
};

function resolve(catSlug: string, sub: string | null): { rule: Rule | null; kind: "remap" | "identity" | "hold" | "flag" } {
  const key = (sub ?? "").trim().toLowerCase();
  if (HOLD[catSlug]?.has(key)) return { rule: null, kind: "hold" };
  const m = MAP[catSlug]?.[key];
  if (m) return { rule: m, kind: m.flag ? "flag" : "remap" };
  const canon = CANON[catSlug]?.find((c) => c.toLowerCase() === key);
  if (canon) return { rule: { sub: canon }, kind: "identity" };
  return {
    rule: { sub: sub ?? "", flag: `subcategory not in TAXONOMY for ${catSlug}: "${sub ?? "(none)"}"` },
    kind: "flag",
  };
}

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const catIdByName = new Map(cats.map((c) => [c.name, c.id]));

  const rows = await prisma.business.findMany({
    select: {
      id: true, slug: true, subcategory: true, qualityTier: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  const plan: any[] = [];
  const counts = { remap: 0, identity: 0, flag: 0, hold: 0, moves: 0, tagsAdded: 0 };

  for (const b of rows) {
    const { rule, kind } = resolve(b.category.slug, b.subcategory);
    if (kind === "hold" || !rule) {
      counts.hold++;
      plan.push({ slug: b.slug, cat: b.category.name, from: b.subcategory, action: "HOLD (awaiting category decision)" });
      continue;
    }
    const move = rule.cat && rule.cat !== b.category.name ? rule.cat : null;
    if (move) counts.moves++;
    if (rule.tags?.length) counts.tagsAdded++;
    counts[kind === "flag" ? "flag" : kind === "identity" ? "identity" : "remap"]++;
    plan.push({
      slug: b.slug, cat: b.category.name, from: b.subcategory,
      toSub: rule.sub, toCat: move, tags: rule.tags ?? [], kind,
      flag: rule.flag ?? null, wasTier: b.qualityTier,
    });
  }

  // Report
  const moved = plan.filter((p) => p.toCat);
  const flagged = plan.filter((p) => p.kind === "flag");
  const held = plan.filter((p) => p.action);
  console.log(`\n=== TAXONOMY NORMALIZATION ${APPLY ? "(APPLY)" : "(dry-run)"} — ${rows.length} businesses ===`);
  console.log(`clean remaps: ${counts.remap}, already-canonical: ${counts.identity}, tag sets derived: ${counts.tagsAdded}`);
  console.log(`category moves: ${counts.moves}, FLAGGED (->STANDARD): ${counts.flag}, HELD (untouched): ${counts.hold}`);

  if (moved.length) {
    console.log(`\n--- category moves (${moved.length}) ---`);
    for (const p of moved) console.log(`  ${p.slug}: ${p.cat} -> ${p.toCat} / ${p.from} -> ${p.toSub}${p.tags.length ? ` +[${p.tags}]` : ""}`);
  }
  if (flagged.length) {
    console.log(`\n--- flagged, held at STANDARD for your decision (${flagged.length}) ---`);
    for (const p of flagged) console.log(`  ${p.slug} (${p.cat}): ${p.flag}`);
  }
  if (held.length) {
    console.log(`\n--- held untouched, open category decision (${held.length}) ---`);
    for (const p of held) console.log(`  ${p.slug}: ${p.cat} / ${p.from}`);
  }

  writeFileSync(join(process.cwd(), "data", "_gold-staging", "taxonomy-plan.json"), JSON.stringify(plan, null, 2), "utf8");
  console.log(`\nFull plan -> data/_gold-staging/taxonomy-plan.json`);

  if (!APPLY) {
    console.log(`\n(dry-run) nothing written. Re-run with --apply to commit.`);
    await prisma.$disconnect();
    return;
  }

  // Apply
  let written = 0;
  for (const p of plan) {
    if (p.action) continue; // held
    const data: Record<string, unknown> = { subcategory: p.toSub };
    if (p.toCat) {
      const cid = catIdByName.get(p.toCat);
      if (!cid) { console.log(`  SKIP ${p.slug}: unknown target category ${p.toCat}`); continue; }
      data.categoryId = cid;
    }
    if (p.tags.length) {
      const bySlug = new Map<string, string>();
      for (const t of p.tags) { const n = String(t).trim(); if (n) bySlug.set(slugify(n), n); }
      data.tags = { set: [], connectOrCreate: [...bySlug].map(([slug, name]) => ({ where: { slug }, create: { slug, name } })) };
    }
    if (p.flag) {
      data.reviewFlag = p.flag;
      data.qualityTier = QualityTier.STANDARD; // fit-or-flag: pin for review
    }
    await prisma.business.update({ where: { id: rows.find((r) => r.slug === p.slug)!.id }, data });
    written++;
  }
  console.log(`\nApplied ${written} updates (${counts.hold} held untouched).`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
