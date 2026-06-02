import type { Metadata } from "next";
import {
  getCategoriesWithCounts,
  getCityCounts,
  getAllBusinesses,
} from "@/lib/queries";
import { TOWNS } from "@/lib/site";
import { buildBrowseGroups } from "@/lib/category-groups";
import { BrowseLab } from "@/components/browse-test/BrowseLab";

// Internal mockup: keep it out of search results and the sitemap.
export const metadata: Metadata = {
  title: "Browse layout lab (internal)",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default async function BrowseTestPage() {
  const [categories, cityCounts, allBiz] = await Promise.all([
    getCategoriesWithCounts(),
    getCityCounts(),
    getAllBusinesses(),
  ]);

  // Up to 3 sample business names per category (list is already ordered
  // featured -> non-chain -> name, so the first few are the strongest).
  const samples = new Map<string, string[]>();
  for (const b of allBiz) {
    const slug = b.category?.slug;
    if (!slug) continue;
    const arr = samples.get(slug) ?? [];
    if (arr.length < 3) {
      arr.push(b.name);
      samples.set(slug, arr);
    }
  }

  const { commercial, civic, total: totalCount } = buildBrowseGroups(
    categories,
    samples,
  );

  const towns = TOWNS.map((t) => ({
    slug: t.slug,
    name: t.name,
    count: cityCounts.get(t.name.toLowerCase()) ?? 0,
  }));

  return (
    <section className="bg-paper-2 py-12">
      <div className="container-page">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-creek-dark">
            Internal · layout lab
          </p>
          <h1 className="text-balance text-2xl sm:text-3xl">
            Three ways to break down the category wall
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-ink-soft">
            Same data, three structures. {commercial.length} commercial groups fold the
            shopping categories, and {civic.count} civic listings move into a separate,
            demoted <strong>Community &amp; Government</strong> section. Switch between
            layouts below. Category links are live; town chips are illustrative.
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            {totalCount} places · {categories.length} categories · not indexed, not
            linked from the live site.
          </p>
        </div>

        <BrowseLab
          groups={commercial}
          civic={civic}
          towns={towns}
          totalCount={totalCount}
        />
      </div>
    </section>
  );
}
