import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { getBusinessesByCity } from "@/lib/queries";
import { BusinessExplorer } from "@/components/BusinessExplorer";
import { JsonLd } from "@/components/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/schema-org";
import { TOWNS, townSlugToName, siteConfig } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return TOWNS.map((t) => ({ town: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town } = await params;
  const name = townSlugToName.get(town);
  if (!name) return { title: "Town not found" };
  const title = `Businesses in ${name}, TN`;
  const description = `A directory of local businesses and services in ${name}, Tennessee. Find restaurants, shops, trades, schools, and more in Marshall County.`;
  return {
    title,
    description,
    alternates: { canonical: `/${town}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteConfig.url}/${town}`,
    },
  };
}

export default async function TownPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town } = await params;
  const name = townSlugToName.get(town);
  if (!name) notFound();

  const businesses = await getBusinessesByCity(name);

  return (
    <div className="container-page py-10">
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: siteConfig.url },
          { name: `${name}, TN`, url: `${siteConfig.url}/${town}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-faint">
        <Link href="/" className="hover:text-pine">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-ink-soft">{name}</span>
      </nav>

      <header className="mt-6 max-w-2xl">
        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Marshall County, TN
        </p>
        <h1 className="text-3xl sm:text-4xl">Businesses in {name}</h1>
        <p className="mt-2 text-pretty leading-relaxed text-ink-soft">
          {businesses.length} {businesses.length === 1 ? "place" : "places"} in {name}, Tennessee.
        </p>
      </header>

      <div className="mt-8">
        {businesses.length > 0 ? (
          <Suspense fallback={<div className="h-24" />}>
            <BusinessExplorer businesses={businesses} showTownFilter={false} defaultLocalOnly />
          </Suspense>
        ) : (
          <div className="rounded-card border border-dashed border-line-strong bg-card/60 p-12 text-center">
            <p className="font-serif text-lg text-ink">No listings here yet.</p>
            <p className="mt-1 text-sm text-ink-soft">
              We’re still adding places in {name}. Check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
