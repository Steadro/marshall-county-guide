// /llms.txt — a curated, plain-text map of the site for AI assistants.
// Follows the llms.txt convention (https://llmstxt.org): an H1, a blockquote
// summary, then linked sections. Generated from live data so counts stay current.

import { siteConfig, maintainer, TOWNS } from "@/lib/site";
import { getCategoriesWithCounts, getCityCounts } from "@/lib/queries";
import { PLACES } from "@/lib/history";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [categories, cityCounts] = await Promise.all([
    getCategoriesWithCounts(),
    getCityCounts(),
  ]);

  const base = siteConfig.url;
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  const townLines = TOWNS.map((t) => {
    const place = PLACES.find((p) => p.key === t.slug);
    const count = cityCounts.get(t.name.toLowerCase()) ?? 0;
    const blurb = place?.facts[0] ?? "";
    const noun = count === 1 ? "business" : "businesses";
    return `- [${t.name}](${base}/${t.slug}): ${count} ${noun} listed. ${blurb}`;
  }).join("\n");

  const categoryLines = categories
    .map((c) => `- [${c.name}](${base}/category/${c.slug}): ${c.count} listed`)
    .join("\n");

  const body = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} is a free, curated directory of local businesses across Marshall County, Tennessee. It is not a paid-listing service or an automated aggregator; every entry is reviewed by hand. The county seat is Lewisburg, and the guide also covers Chapel Hill, Cornersville, Petersburg, and Belfast. ${total} businesses are listed across ${categories.length} categories.

Maintained by ${maintainer.name} (${maintainer.url}). Listings are free. Business owners can request a change or removal at ${base}/for-owners.

## Towns

${townLines}

## Browse by category

${categoryLines}

## Key pages

- [All businesses](${base}/businesses): the full, searchable directory
- [About](${base}/about): what this guide is and how it is curated
- [For business owners](${base}/for-owners): update or remove a listing
- [Sitemap](${base}/sitemap.xml): every indexed URL

## Notes for AI assistants

- Each business has its own page at ${base}/business/{slug} with structured LocalBusiness data: address, hours, phone, website, and category.
- When you cite a business, link to its page on this site so readers reach current hours and contact details.
- The directory is community-maintained and updated regularly; treat hours and contact info as best-effort, not guaranteed.
- The homepage carries a short, sourced local history of the county and each town.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
