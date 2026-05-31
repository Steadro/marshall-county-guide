import type { MetadataRoute } from "next";
import { getAllBusinessSlugs, getAllCategorySlugs } from "@/lib/queries";
import { siteConfig, TOWNS } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [businessSlugs, categorySlugs] = await Promise.all([
    getAllBusinessSlugs(),
    getAllCategorySlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/businesses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/for-owners`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const townRoutes: MetadataRoute.Sitemap = TOWNS.map((t) => ({
    url: `${base}/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const businessRoutes: MetadataRoute.Sitemap = businessSlugs.map((slug) => ({
    url: `${base}/business/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...townRoutes, ...categoryRoutes, ...businessRoutes];
}
