/**
 * READ-ONLY sweep. Counts and lists published businesses that have a street
 * address but NO latitude/longitude — exactly the rows whose listing page shows
 * the Details address while the map says "A street address isn't listed."
 *
 * Writes nothing. Run:  npx tsx scripts/sweep-address-no-coords.ts
 *
 * Root cause: app/business/[slug]/page.tsx derives `precise` from
 * latitude/longitude only; the "address isn't listed" copy fires whenever
 * coords are null, regardless of whether streetAddress is set. The fix for the
 * data side is `npm run geocode`; the copy itself is also misleading.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.business.count();
  const withAddress = await prisma.business.count({
    where: { streetAddress: { not: null } },
  });
  const withCoords = await prisma.business.count({
    where: { latitude: { not: null }, longitude: { not: null } },
  });

  // The mismatch: has a street address, but no coordinates -> misleading map copy.
  const affected = await prisma.business.findMany({
    where: { streetAddress: { not: null }, latitude: null },
    select: { name: true, streetAddress: true, city: true, status: true, slug: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });

  console.log(`Total businesses:           ${total}`);
  console.log(`  with a street address:    ${withAddress}`);
  console.log(`  with coordinates:         ${withCoords}`);
  console.log(`\nMISMATCH (address shown, map says "not listed"): ${affected.length}\n`);

  for (const b of affected) {
    console.log(`  [${b.status}] ${b.name} — ${b.streetAddress}, ${b.city}  (/business/${b.slug})`);
  }
}

main()
  .catch((e) => {
    console.error("Sweep failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
