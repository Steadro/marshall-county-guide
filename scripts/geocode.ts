/**
 * Fill latitude/longitude for businesses that have a street address but no
 * coordinates yet. Idempotent: skips rows that already have coords or lack a
 * street address.
 *
 * By default uses free, no-key geocoders: US Census first, then OpenStreetMap
 * Nominatim for anything Census can't match (good for rural Hwy/Rd addresses).
 * Set GEOCODER=google|mapbox (+ key) in .env to use a paid provider instead.
 *
 *   npm run geocode
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { resolveGeocoder, geocodeCensus, geocodeNominatim, formatAddress } from "../lib/geocode";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const paid = resolveGeocoder();
  if (paid) {
    console.log(`Geocoding with paid provider: ${paid.name}`);
  } else {
    console.log("Geocoding with free providers: US Census, then Nominatim for misses.");
  }

  const pending = await prisma.business.findMany({
    where: { latitude: null, streetAddress: { not: null } },
    select: {
      id: true,
      name: true,
      streetAddress: true,
      city: true,
      state: true,
      postalCode: true,
    },
  });
  console.log(`${pending.length} businesses need coordinates.\n`);

  let ok = 0;
  let viaCensus = 0;
  let viaNominatim = 0;
  let failed = 0;

  for (const b of pending) {
    const address = formatAddress(b);
    let result = null;
    let via = "";

    try {
      if (paid) {
        result = await paid.geocode(address);
        via = paid.name;
      } else {
        result = await geocodeCensus(address);
        if (result) {
          via = "census";
        } else {
          // Fall back to Nominatim (politely rate-limited).
          await sleep(1100);
          result = await geocodeNominatim(address);
          via = "nominatim";
        }
      }
    } catch (e) {
      console.log(`  ! error: ${b.name}: ${(e as Error).message}`);
    }

    if (result) {
      await prisma.business.update({
        where: { id: b.id },
        data: { latitude: result.latitude, longitude: result.longitude },
      });
      ok += 1;
      if (via === "nominatim") viaNominatim += 1;
      else viaCensus += 1;
      console.log(`  ok (${via}): ${b.name}`);
    } else {
      failed += 1;
      console.log(`  no match: ${b.name} (${address})`);
    }
  }

  console.log(
    `\nGeocoding done: ${ok} located (${viaCensus} census, ${viaNominatim} nominatim), ${failed} unmatched.`,
  );
  const withCoords = await prisma.business.count({ where: { latitude: { not: null } } });
  const total = await prisma.business.count();
  console.log(`${withCoords}/${total} businesses now have coordinates.`);
}

main()
  .catch((e) => {
    console.error("Geocode failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
