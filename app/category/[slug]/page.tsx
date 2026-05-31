import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCategoryBySlug, getAllCategorySlugs } from "@/lib/queries";
import { BusinessExplorer } from "@/components/BusinessExplorer";
import { CategoryIcon } from "@/components/CategoryIcon";
import { LocationMap } from "@/components/LocationMap";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/schema-org";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Category not found" };
  const { category } = data;
  return {
    title: `${category.name} in Marshall County, TN`,
    description:
      category.description ??
      `Find ${category.name.toLowerCase()} businesses across Marshall County, Tennessee.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();
  const { category, businesses } = data;

  // Map pins for the located, locally-owned businesses in this category.
  const mapPoints = businesses
    .filter((b) => !b.isChain && b.latitude != null && b.longitude != null)
    .map((b) => ({
      latitude: b.latitude as number,
      longitude: b.longitude as number,
      name: b.name,
      slug: b.slug,
      city: b.city,
    }));

  return (
    <div className="container-page py-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: siteConfig.url },
          { name: "Businesses", url: `${siteConfig.url}/businesses` },
          { name: category.name, url: `${siteConfig.url}/category/${category.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-faint">
        <Link href="/" className="hover:text-clay">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/businesses" className="hover:text-clay">Businesses</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-ink-soft">{category.name}</span>
      </nav>

      <header className="mt-6 flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-clay-soft text-clay-dark">
          <CategoryIcon slug={category.slug} className="h-7 w-7" />
        </span>
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 text-pretty leading-relaxed text-ink-soft">{category.description}</p>
          ) : null}
        </div>
      </header>

      {mapPoints.length > 1 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            {category.name} on the map
          </h2>
          <LocationMap points={mapPoints} />
        </section>
      ) : null}

      <div className="mt-8">
        <Suspense fallback={<div className="h-24" />}>
          <BusinessExplorer businesses={businesses} showCategoryFilter={false} defaultLocalOnly />
        </Suspense>
      </div>
    </div>
  );
}
