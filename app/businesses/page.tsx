import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllBusinesses } from "@/lib/queries";
import { BusinessExplorer } from "@/components/BusinessExplorer";
import { siteConfig } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Businesses",
  description: `Browse and search every business and service in the ${siteConfig.name} directory. Filter by category and town across Marshall County, Tennessee.`,
  alternates: { canonical: "/businesses" },
};

export default async function BusinessesPage() {
  const businesses = await getAllBusinesses();

  return (
    <div className="container-page py-12">
      <header className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
          The directory
        </p>
        <h1 className="text-3xl sm:text-4xl">All businesses</h1>
        <p className="mt-3 text-pretty leading-relaxed text-ink-soft">
          Locally owned businesses and services across {siteConfig.region}. Search by name, filter
          by category and town, or uncheck “Locally owned only” to include national chains.
        </p>
      </header>

      <Suspense fallback={<div className="h-24" />}>
        <BusinessExplorer businesses={businesses} defaultLocalOnly />
      </Suspense>
    </div>
  );
}
