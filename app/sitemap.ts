import type { MetadataRoute } from "next";
import { getSitemapBusinesses, getCategoriesWithCounts } from "@/lib/queries";
import { siteConfig, TOWNS } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [businesses, categories] = await Promise.all([
    getSitemapBusinesses(),
    // Only categories with at least one visible listing (empty ones are noindex).
    getCategoriesWithCounts(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/businesses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/history`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/for-owners`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const townRoutes: MetadataRoute.Sitemap = TOWNS.map((t) => ({
    url: `${base}/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const businessRoutes: MetadataRoute.Sitemap = businesses.map((b) => ({
    url: `${base}/business/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...townRoutes, ...categoryRoutes, ...businessRoutes];
}
