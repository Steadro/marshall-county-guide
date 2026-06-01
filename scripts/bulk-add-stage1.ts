/**
 * Stage 1 community-guide backfill: create 6 new categories and upsert the
 * verified, zero-controversy civic/community/venue/medical entities sourced
 * from the June 2026 community-guide research report.
 *
 *   npx tsx scripts/bulk-add-stage1.ts --dry-run   # preview create/update plan
 *   npx tsx scripts/bulk-add-stage1.ts             # apply to Neon
 *
 * Idempotent: matches existing rows by slug, then by name+city (case-insensitive).
 * New rows are created PUBLISHED; existing rows are only ENRICHED (address/phone/
 * website/foundingYear/provenance) — their name, category, status, qualityTier,
 * and editorial copy are left untouched. Churches, rural VFDs, and entities
 * without a confirmed address/scope are intentionally excluded (later pass).
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/utils";
import { BusinessStatus, QualityTier } from "../app/generated/prisma/client";

const DRY = process.argv.includes("--dry-run");
const VERIFIED_AT = new Date("2026-06-01T00:00:00Z");
const SOURCE = "Community guide research (2026)";

const CITY_ZIP: Record<string, string> = {
  Lewisburg: "37091",
  "Chapel Hill": "37034",
  Cornersville: "37047",
  Petersburg: "37144",
};

const CATEGORIES: Array<{ slug: string; name: string; description: string; icon: string; sortOrder: number }> = [
  { slug: "government-and-civic", name: "Government & Civic", description: "County and municipal offices, courts, post offices, and the public library.", icon: "Building", sortOrder: 50 },
  { slug: "public-safety", name: "Public Safety", description: "Sheriff, police, fire, EMS, and animal control.", icon: "Shield", sortOrder: 51 },
  { slug: "schools", name: "Schools", description: "Public schools and the career-technical center.", icon: "School", sortOrder: 52 },
  { slug: "places-of-worship", name: "Places of Worship", description: "Churches and congregations across the county.", icon: "Church", sortOrder: 53 },
  { slug: "community-and-nonprofit", name: "Community & Nonprofit", description: "Chamber, civic clubs, senior services, and assistance organizations.", icon: "Users", sortOrder: 54 },
  { slug: "wedding-and-event-venues", name: "Wedding & Event Venues", description: "Farms, barns, and lodges for weddings and events.", icon: "PartyPopper", sortOrder: 55 },
];

interface Entity {
  name: string;
  category: string; // slug
  city: keyof typeof CITY_ZIP;
  streetAddress?: string;
  phone?: string;
  website?: string;
  description?: string;
  subcategory?: string;
  foundingYear?: number;
}

const ENTITIES: Entity[] = [
  // --- Government & Civic ---
  { name: "Marshall County Mayor's Office", category: "government-and-civic", city: "Lewisburg", streetAddress: "101 W Commerce St", phone: "(931) 359-1279", website: "https://marshallcountytn.gov/mayor-s-office", description: "Office of the County Mayor (Mike Keny); county executive administration, in the Courthouse Annex." },
  { name: "Marshall County Courthouse", category: "government-and-civic", city: "Lewisburg", streetAddress: "Public Square", description: "Historic 1929 courthouse on the Public Square; houses the Circuit, Chancery, and General Sessions courts." },
  { name: "Marshall County Clerk", category: "government-and-civic", city: "Lewisburg", streetAddress: "101 W Commerce St", phone: "(931) 359-1072", description: "County Clerk (Daphne Girts): vehicle titles, business licenses, and marriage licenses." },
  { name: "Marshall County Trustee", category: "government-and-civic", city: "Lewisburg", streetAddress: "101 W Commerce St", phone: "(931) 359-4800", description: "County Trustee (Scottie Poarch): property-tax collection and county banking." },
  { name: "Marshall County Assessor of Property", category: "government-and-civic", city: "Lewisburg", streetAddress: "101 W Commerce St", phone: "(931) 359-3238", description: "Property assessment office (Jennifer Neill)." },
  { name: "Marshall County Register of Deeds", category: "government-and-civic", city: "Lewisburg", streetAddress: "101 W Commerce St", phone: "(931) 359-4933", description: "Land and property records (Curtis Johnson)." },
  { name: "Marshall County Circuit Court Clerk", category: "government-and-civic", city: "Lewisburg", streetAddress: "302 Public Square", phone: "(931) 359-0536", description: "Circuit and General Sessions court records (Mike Wiles)." },
  { name: "Marshall County Clerk & Master", category: "government-and-civic", city: "Lewisburg", streetAddress: "302 Public Square", phone: "(931) 359-2181", description: "Chancery Court clerk (Cecilia Spivy)." },
  { name: "Marshall County Highway Department", category: "government-and-civic", city: "Lewisburg", streetAddress: "1593 Old Columbia Rd", phone: "(931) 359-4031", website: "https://mchwy.com", description: "County road maintenance and paving (Jerry Williams)." },
  { name: "Marshall County Election Commission", category: "government-and-civic", city: "Lewisburg", streetAddress: "230 College St", phone: "(931) 359-4894", description: "Voter registration and elections; Hardison Office Annex, Suite 120." },
  { name: "Marshall County Solid Waste & Recycling", category: "government-and-civic", city: "Lewisburg", streetAddress: "611 Hawkins Dr", phone: "(931) 359-0547", website: "https://marshallcountyrecycles.com", description: "Convenience centers and recycling for the county." },
  { name: "Marshall County Veterans Service Office", category: "government-and-civic", city: "Lewisburg", streetAddress: "230 College St", phone: "(931) 359-5482", description: "Veterans benefits assistance; Hardison Office Annex, Suite 210." },
  { name: "Marshall County Emergency Management Agency", category: "government-and-civic", city: "Lewisburg", streetAddress: "230 College St", phone: "(931) 359-5810", description: "Emergency preparedness and response coordination; Hardison Office Annex, Suite 125." },
  { name: "Marshall County Health Department", category: "government-and-civic", city: "Lewisburg", streetAddress: "1031 War Eagle Dr", phone: "(931) 359-1551", description: "County public-health clinic and services." },
  { name: "City of Lewisburg City Hall", category: "government-and-civic", city: "Lewisburg", streetAddress: "131 E Church St", phone: "(931) 359-1544", website: "https://lewisburgtn.gov", description: "Lewisburg municipal government and city utilities." },
  { name: "Chapel Hill Town Hall", category: "government-and-civic", city: "Chapel Hill", streetAddress: "4650 Nashville Hwy", phone: "(931) 364-7632", website: "https://townofchapelhilltn.gov", description: "Town of Chapel Hill municipal offices; banquet hall available for rental." },
  { name: "Cornersville Town Hall", category: "government-and-civic", city: "Cornersville", streetAddress: "118 S Main St", phone: "(931) 293-4482", website: "https://cornersvilletn.org", description: "Town of Cornersville municipal offices (Mayor Melisa Peters)." },
  { name: "Petersburg Town Hall", category: "government-and-civic", city: "Petersburg", website: "https://petersburgtn.gov", description: "Town of Petersburg municipal offices; incorporated 1814." },
  { name: "Lewisburg Post Office", category: "government-and-civic", city: "Lewisburg", streetAddress: "557 E Commerce St", phone: "(931) 359-3232", description: "United States Postal Service branch." },
  { name: "Chapel Hill Post Office", category: "government-and-civic", city: "Chapel Hill", streetAddress: "102 N Horton Pkwy", phone: "(931) 364-2681", description: "United States Postal Service branch." },
  { name: "Cornersville Post Office", category: "government-and-civic", city: "Cornersville", streetAddress: "501 N Main St", phone: "(800) 275-8777", description: "United States Postal Service branch." },
  { name: "Petersburg Post Office", category: "government-and-civic", city: "Petersburg", phone: "(800) 275-8777", description: "United States Postal Service branch." },
  { name: "Marshall County Memorial Library", category: "government-and-civic", city: "Lewisburg", streetAddress: "310 Old Farmington Rd", phone: "(931) 359-3335", description: "Main county public library: 123,000+ items and 20 public computers (Director Shekera Stanley)." },
  { name: "Marshall County Library - Chapel Hill Branch", category: "government-and-civic", city: "Chapel Hill", streetAddress: "206 Depot St", phone: "(931) 364-2266", description: "Chapel Hill branch of the county public library." },
  { name: "Lone Oak Cemetery", category: "government-and-civic", city: "Lewisburg", description: "Historic 19th-century public cemetery south of Lewisburg off Cornersville Hwy; 6,000+ interments, including 260+ military graves." },

  // --- Public Safety ---
  { name: "Marshall County Sheriff's Office", category: "public-safety", city: "Lewisburg", streetAddress: "209 1st Ave N", phone: "(931) 359-6122", description: "County law enforcement (Sheriff Billy Lamb)." },
  { name: "Marshall County Jail", category: "public-safety", city: "Lewisburg", streetAddress: "150 E Church St", phone: "(931) 359-0555", description: "County detention facility." },
  { name: "Lewisburg Police Department", category: "public-safety", city: "Lewisburg", streetAddress: "101 Water St", phone: "(931) 359-4044", description: "City police department; 24 patrol officers plus K9 (Chief Scott Braden)." },
  { name: "Lewisburg Fire Department", category: "public-safety", city: "Lewisburg", streetAddress: "118 Water St", phone: "(931) 359-4544", description: "City fire department; ISO Class 3, two stations (Chief Drew Hawkins)." },
  { name: "Marshall County EMS", category: "public-safety", city: "Lewisburg", streetAddress: "728 S Ellington Pkwy", phone: "(931) 359-6394", description: "County ambulance service; nine ambulances, Class A licensed (Director John Reese)." },
  { name: "Marshall County Animal Control", category: "public-safety", city: "Lewisburg", streetAddress: "206 Legion Ave", phone: "(931) 359-7215", description: "County animal control and shelter (206 Legion Ave, Suite C)." },
  { name: "Chapel Hill Volunteer Fire Department", category: "public-safety", city: "Chapel Hill", streetAddress: "119 N Horton Pkwy", phone: "(931) 364-4135", description: "Town volunteer fire department." },
  { name: "Cornersville Fire & Rescue", category: "public-safety", city: "Cornersville", streetAddress: "410 S Main St", phone: "(931) 293-2211", description: "Town fire and rescue (Chief Josh Young)." },

  // --- Schools ---
  { name: "Marshall County Schools District Office", category: "schools", city: "Lewisburg", streetAddress: "700 Jones Circle", phone: "(931) 359-1581", website: "https://mcstn.net", description: "District office for Marshall County Schools (Director Dr. Justin Perry); 10 schools, ~5,400 students." },
  { name: "Cornersville Elementary School", category: "schools", city: "Cornersville", streetAddress: "485 N Main St", phone: "(931) 246-4230", description: "Public elementary school, grades PK-6." },
  { name: "Cornersville High School", category: "schools", city: "Cornersville", streetAddress: "323 S Main St", phone: "(931) 246-4170", description: "Public school, grades 7-12 (Bulldogs)." },
  { name: "Chapel Hill Elementary School", category: "schools", city: "Chapel Hill", streetAddress: "415 S Horton Pkwy", phone: "(931) 246-4255", description: "Public elementary school, grades PK-3." },
  { name: "Delk-Henson Intermediate School", category: "schools", city: "Chapel Hill", streetAddress: "425 S Horton Pkwy", phone: "(931) 536-0491", description: "Public intermediate school, grades 4-6." },
  { name: "Forrest School", category: "schools", city: "Chapel Hill", streetAddress: "310 N Horton Pkwy", phone: "(931) 246-4733", description: "Public school, grades 7-12 (Rockets)." },
  { name: "Oak Grove Elementary School", category: "schools", city: "Lewisburg", streetAddress: "1645 Franklin Pike", phone: "(931) 270-0892", description: "Public elementary school, grades PK-1." },
  { name: "Marshall Elementary School", category: "schools", city: "Lewisburg", streetAddress: "401 Tiger Dr", phone: "(931) 359-7149", description: "Public elementary school, grades 2-3." },
  { name: "Westhills Elementary School", category: "schools", city: "Lewisburg", streetAddress: "1351 N Ellington Pkwy", phone: "(931) 359-3909", description: "Public elementary school, grades 4-6." },
  { name: "Lewisburg Middle School", category: "schools", city: "Lewisburg", streetAddress: "500 Tiger Blvd", phone: "(931) 359-1265", description: "Public middle school, grades 7-8." },
  { name: "Marshall County High School", category: "schools", city: "Lewisburg", streetAddress: "661 W Ellington Pkwy", phone: "(931) 359-1549", description: "Public high school, grades 9-12 (Tigers)." },
  { name: "Spot-Lowe Technology Center", category: "schools", city: "Lewisburg", phone: "(931) 359-4911", description: "Career and technical education center on the Marshall County High School campus." },

  // --- Community & Nonprofit ---
  { name: "Marshall County Chamber of Commerce", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "227 2nd Ave N", phone: "(931) 359-3863", website: "https://marshallchamber.org", description: "County chamber of commerce; 200+ members, established in the 1920s." },
  { name: "Marshall County Senior Citizens Center", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "230 College St", phone: "(931) 359-1808", website: "https://mctnsc.com", description: "Senior center programs and services (Frances Murdock); Hardison Office Annex, Suite 140." },
  { name: "VFW Post 5109", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "148 E Church St", phone: "(931) 359-9115", website: "https://vfw-lewisburg.com", description: "Veterans of Foreign Wars post (Bill Lowe Wheatley Post), chartered 1945." },
  { name: "Salvation Army Service Center & Thrift Store", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "130 The Acres", phone: "(931) 359-7484", description: "Assistance services and thrift store." },
  { name: "Catholic Charities of Middle Tennessee - Marshall Office", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "1280 S Ellington Pkwy", description: "Local office of Catholic Charities of Middle Tennessee (Suite 101)." },
  { name: "Neighborhood Service Center (SCHRA)", category: "community-and-nonprofit", city: "Lewisburg", streetAddress: "1794 Mooresville Hwy", phone: "(931) 359-6393", description: "South Central Human Resource Agency: utility and rent assistance." },

  // --- Wedding & Event Venues ---
  { name: "Cascata Springs", category: "wedding-and-event-venues", city: "Lewisburg", streetAddress: "2164 Mooresville Hwy", phone: "(931) 993-6477", website: "https://cascatasprings.com", description: "Italian-inspired waterfront wedding villa with a lakeside veranda, hilltop lodge, and on-site lodging." },
  { name: "Flat Rock Farms", category: "wedding-and-event-venues", city: "Lewisburg", streetAddress: "1190 W Ellington Pkwy", phone: "(615) 815-5326", website: "https://flatrockfarms.com", description: "125-acre former Tennessee Walking Horse farm and event venue; capacity 30-500." },
  { name: "Retreat at the River", category: "wedding-and-event-venues", city: "Lewisburg", streetAddress: "3560 Riverview Rd", phone: "(615) 664-8533", website: "https://retreatattheriver.com", description: "6-acre riverside wedding and event venue." },
  { name: "The Fly Farm at Big Rock Creek", category: "wedding-and-event-venues", city: "Lewisburg", streetAddress: "1949 Verona Caney Rd", phone: "(615) 390-2902", website: "https://theflyfarm.com", description: "155-acre venue in the Verona community with flower fields, two streams, and a barn; capacity ~150." },
  { name: "Bullbourne Ranch", category: "wedding-and-event-venues", city: "Cornersville", streetAddress: "209 Lynnville Rd", phone: "(615) 619-2645", website: "https://bullbourneranch.com", description: "White-washed luxury barn event venue on a working bison ranch." },

  // --- Arts & Entertainment (existing category) ---
  { name: "Marshall County Historical Museum", category: "arts-and-entertainment", city: "Lewisburg", streetAddress: "230 College St", phone: "(931) 359-4489", description: "Local history museum (established 1996) with primitive tools, looms, military memorabilia, quilts, and the Historical Quarterly archive; Hardison Office Annex." },
  { name: "The Historic Dixie Theatre", category: "arts-and-entertainment", city: "Lewisburg", streetAddress: "110 W Church St", phone: "(931) 270-7529", website: "https://dixietheatre.org", description: "1936 Art Deco community theatre on the courthouse square; 299 seats, listed on the National Register.", subcategory: "Theatre" },

  // --- Health & Medical (existing category) ---
  { name: "Marshall Medical Center", category: "health-and-medical", city: "Lewisburg", streetAddress: "1080 N Ellington Pkwy", phone: "(931) 359-6241", website: "https://mauryregional.com/locations/marshall-medical-center", description: "25-bed Critical Access Hospital, part of Maury Regional Health.", subcategory: "Hospital" },
  { name: "Lewisburg Family Practice", category: "health-and-medical", city: "Lewisburg", streetAddress: "1090 N Ellington Pkwy", phone: "(931) 359-6241", description: "Maury Regional Medical Group primary care; walk-in five days a week, FQHC site with a sliding fee scale (Suite 102)." },
  { name: "AJ Medical Services", category: "health-and-medical", city: "Lewisburg", streetAddress: "529 W Commerce St", phone: "(931) 270-9729", description: "Howard J. Rupard Rural Health Clinic: family medicine, diagnostic radiology, and urgent care." },

  // --- Fitness & Recreation (existing category): public parks & rec ---
  { name: "Lewisburg Recreation Center", category: "fitness-and-recreation", city: "Lewisburg", streetAddress: "1551 Mooresville Hwy", phone: "(931) 359-2482", description: "70,000 sq ft recreation center on 81 acres: indoor pool, fitness center, gym, racquetball, and meeting rooms (Director Cary Whitesell)." },
  { name: "Ewell Butler Golf Course", category: "fitness-and-recreation", city: "Lewisburg", streetAddress: "1551 Mooresville Hwy", phone: "(931) 359-2482", description: "Par-36 nine-hole municipal golf course at the Recreation Center; 2,887 yards with a practice range." },
  { name: "Rock Creek Park & Greenway", category: "fitness-and-recreation", city: "Lewisburg", description: "City park and greenway trail." },
  { name: "Jones Park", category: "fitness-and-recreation", city: "Lewisburg", description: "Downtown neighborhood park." },
  { name: "Harmon Park (Kiddie Park)", category: "fitness-and-recreation", city: "Lewisburg", description: "City children's park." },
  { name: "New Lake", category: "fitness-and-recreation", city: "Lewisburg", description: "City-owned recreation lake." },
  { name: "Southside Softball Park", category: "fitness-and-recreation", city: "Lewisburg", description: "City softball complex." },
  { name: "Southside Soccer Park", category: "fitness-and-recreation", city: "Lewisburg", description: "City soccer complex." },
  { name: "Richard Cashion Youth Sports Complex", category: "fitness-and-recreation", city: "Lewisburg", description: "Youth sports fields." },
  { name: "Marshall County Show Grounds", category: "fitness-and-recreation", city: "Lewisburg", description: "Walking-horse show grounds; hosts the Marshall County Horsemen's Association show and Walking for the Angels." },

  // --- Enrichment for likely-existing entries (financial + funeral homes) ---
  { name: "Apex Bank - Chapel Hill", category: "financial", city: "Chapel Hill", streetAddress: "118 S Horton Pkwy", phone: "(931) 246-7105", website: "https://apexbank.com", foundingYear: 1931, description: "Community bank branch (Apex Bank, chartered 1931)." },
  { name: "First Commerce Bank - Chapel Hill", category: "financial", city: "Chapel Hill", streetAddress: "4641 Nashville Hwy", phone: "(931) 364-7888", website: "https://firstcommercebank.net", foundingYear: 2002, description: "Community bank branch; First Commerce Bank is headquartered in Lewisburg." },
  { name: "Anderson Funeral Home", category: "other", city: "Lewisburg", streetAddress: "825 Wakefield St", phone: "(931) 359-2414", website: "https://andersonfuneralhome.com", foundingYear: 1934, description: "Family funeral home (Owner Gloria Quarles)." },
  { name: "J.B. Mayberry & Sons Funeral Home", category: "other", city: "Lewisburg", streetAddress: "426 Heil Quaker Ave", phone: "(931) 359-4988", website: "https://mayberryandsonsfuneralhome.com", foundingYear: 1953, description: "Family funeral home." },
];

function tierFor(e: Entity): QualityTier {
  return e.streetAddress || e.phone ? QualityTier.STANDARD : QualityTier.UNREVIEWED;
}

async function main() {
  console.log(`\n=== Stage 1 bulk add ${DRY ? "(DRY RUN — no writes)" : "(APPLYING TO NEON)"} ===\n`);

  // 1) Categories
  for (const c of CATEGORIES) {
    if (!DRY) {
      await prisma.category.upsert({
        where: { slug: c.slug },
        create: c,
        update: { name: c.name, description: c.description, icon: c.icon, sortOrder: c.sortOrder },
      });
    }
    console.log(`category: ${c.slug}${DRY ? " (would upsert)" : " ok"}`);
  }

  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  // In dry run the 6 new categories may not exist yet; tolerate that.
  for (const c of CATEGORIES) if (!catId.has(c.slug)) catId.set(c.slug, `(new:${c.slug})`);

  // 2) Entities
  let created = 0;
  let updated = 0;
  const perCat: Record<string, number> = {};

  for (const e of ENTITIES) {
    const slug = slugify(e.name);
    const categoryId = catId.get(e.category);
    if (!categoryId) {
      console.warn(`  ! unknown category "${e.category}" for ${e.name} — skipping`);
      continue;
    }

    const existing =
      (await prisma.business.findUnique({ where: { slug }, select: { id: true, name: true } })) ??
      (await prisma.business.findFirst({
        where: { name: { equals: e.name, mode: "insensitive" }, city: { equals: e.city, mode: "insensitive" } },
        select: { id: true, name: true },
      }));

    perCat[e.category] = (perCat[e.category] ?? 0) + 1;

    if (existing) {
      // Enrich only: contact + provenance. Leave name/category/status/qualityTier/copy.
      const data: Record<string, unknown> = { lastVerifiedAt: VERIFIED_AT, dataSource: SOURCE };
      if (e.streetAddress) data.streetAddress = e.streetAddress;
      data.postalCode = CITY_ZIP[e.city];
      if (e.phone) data.phone = e.phone;
      if (e.website) { data.website = e.website; data.sourceUrl = e.website; }
      if (e.foundingYear) data.foundingYear = e.foundingYear;
      updated++;
      console.log(`  UPDATE  ${existing.name}  [${e.category}]`);
      if (!DRY) await prisma.business.update({ where: { id: existing.id }, data });
    } else {
      created++;
      console.log(`  CREATE  ${e.name}  [${e.category}]${e.streetAddress ? "" : "  (no address -> town map)"}`);
      if (!DRY) {
        await prisma.business.create({
          data: {
            slug,
            name: e.name,
            categoryId,
            subcategory: e.subcategory ?? null,
            description: e.description ?? null,
            shortDescription: e.description ? e.description.split(/(?<=[.!?])\s/)[0].slice(0, 160) : null,
            streetAddress: e.streetAddress ?? null,
            city: e.city,
            state: "TN",
            postalCode: CITY_ZIP[e.city] ?? null,
            phone: e.phone ?? null,
            website: e.website ?? null,
            sourceUrl: e.website ?? null,
            foundingYear: e.foundingYear ?? null,
            status: BusinessStatus.PUBLISHED,
            qualityTier: tierFor(e),
            dataSource: SOURCE,
            lastVerifiedAt: VERIFIED_AT,
            verifiedBy: "research",
          },
        });
      }
    }
  }

  console.log(`\n--- ${DRY ? "PLAN" : "DONE"} ---`);
  console.log(`entities: ${ENTITIES.length}  |  create: ${created}  update: ${updated}`);
  console.log("per category:", perCat);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
