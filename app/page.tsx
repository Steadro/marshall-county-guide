import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  getSpotlightBusinesses,
  getCategoriesWithCounts,
  getCityCounts,
  getRestaurantsForPicker,
  getAllBusinesses,
} from "@/lib/queries";
import { siteConfig, TOWNS } from "@/lib/site";
import { buildBrowseGroups } from "@/lib/category-groups";
import { BusinessCard } from "@/components/BusinessCard";
import { GoldNote } from "@/components/GoldNote";
import { SectionHeading } from "@/components/SectionHeading";
import { HomeSearch } from "@/components/HomeSearch";
import { RotatingPlace } from "@/components/RotatingPlace";
import { VisitorBand } from "@/components/VisitorBand";
import { BrowseTabs } from "@/components/BrowseTabs";
import { DinnerPicker } from "@/components/DinnerPicker";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteJsonLd } from "@/lib/schema-org";

export const revalidate = 3600;

export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [spotlight, categories, cityCounts, restaurants, allBiz] = await Promise.all([
    getSpotlightBusinesses(6),
    getCategoriesWithCounts(),
    getCityCounts(),
    getRestaurantsForPicker(),
    getAllBusinesses(),
  ]);

  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const townsWithCount = TOWNS.map((t) => ({
    slug: t.slug,
    name: t.name,
    count: cityCounts.get(t.name.toLowerCase()) ?? 0,
  }));

  // Up to 3 sample business names per category for the browse tiles.
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
  const { commercial: browseGroups, civic: browseCivic } = buildBrowseGroups(
    categories,
    samples,
  );

  return (
    <>
      <JsonLd data={buildSiteJsonLd()} />

      {/* Hero: full-bleed courthouse background, weighted right, text over a
          left scrim. (Stand-in image; swap for the right-weighted hi-res later.) */}
      <section className="relative isolate overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/lewisburg-courthouse.jpg"
            alt="The historic Marshall County Courthouse on Courthouse Square in downtown Lewisburg, Tennessee"
            fill
            priority
            sizes="100vw"
            quality={60}
            className="object-cover object-[82%_center] sm:object-[70%_center]"
          />
          {/* Left scrim: keeps the headline legible over the open gutter. Heavier
              on mobile (text spans most of the width); reveals the courthouse on
              the right at sm+. */}
          <div className="absolute inset-0 bg-gradient-to-r from-paper from-30% via-paper/85 to-paper/40 sm:from-40% sm:via-paper/70 sm:to-transparent" />
          {/* Gentle bottom fade into the page below */}
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
        </div>

        <div className="container-page py-8 sm:py-10 lg:py-10">
          <div className="max-w-2xl">
            {/* Fluid size + nowrap locks the headline to exactly three lines at
                every width, so "places that make" never wraps. */}
            <h1 className="leading-[1.05] [font-size:clamp(1.5rem,6.5vw,3.75rem)]">
              <span className="block whitespace-nowrap">Discover the</span>
              <span className="block whitespace-nowrap">places that make</span>
              <span className="block whitespace-nowrap">
                <RotatingPlace />
              </span>
            </h1>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-ink-soft">
              {siteConfig.tagline} Browse {total} local restaurants, shops, makers, and services
              across the county.
            </p>

            <HomeSearch />

            <div className="mt-6 flex flex-wrap items-center justify-start gap-x-8 gap-y-3 text-sm text-ink-soft">
              <Stat value={String(total)} label="places" />
              <span className="hidden h-4 w-px bg-line-strong sm:block" />
              <Stat value={String(categories.length)} label="categories" />
              <span className="hidden h-4 w-px bg-line-strong sm:block" />
              <Stat value={String(TOWNS.length)} label="towns" />
            </div>
          </div>
        </div>

        {/* Attribution (required by the image's CC BY-SA 3.0 license) */}
        <a
          href="https://commons.wikimedia.org/wiki/File:Marshall_County_Tennessee_Courthouse.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-3 z-10 rounded bg-paper/70 px-1.5 py-0.5 text-[10px] text-ink-faint backdrop-blur-sm hover:text-pine"
        >
          Courthouse photo: Ichabod, CC BY-SA 3.0
        </a>
      </section>

      {/* Just visiting? — a front door for visitors, before the resident-focused browse */}
      <VisitorBand />

      {/* Spotlight: rotates daily so every business gets a turn */}
      {spotlight.length > 0 ? (
        <section className="container-page pt-8 pb-12">
          <div className="rounded-[1.75rem] bg-paper-2 p-6 ring-1 ring-line sm:p-8 lg:p-10">
            <SectionHeading
              eyebrow="In the spotlight"
              title="A few local businesses worth a look"
              description="Refreshed daily, so every local business gets its turn."
              action={{ href: "/businesses", label: "Browse all" }}
            />
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spotlight.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
            {spotlight.some((b) => b.qualityTier === "GOLD") ? (
              <GoldNote className="mt-5" />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Categories */}
      <section id="categories" className="scroll-mt-20 bg-paper-2 py-16">
        <div className="container-page">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-creek-dark">
                Browse
              </p>
              <h2 className="text-balance text-2xl sm:text-3xl">Find a local business or service</h2>
              <p className="mt-2 text-pretty leading-relaxed text-ink-soft">
                Look by category, or by the community it’s in.
              </p>
            </div>
            <DinnerPicker
              restaurants={restaurants}
              towns={TOWNS.map((t) => ({ slug: t.slug, name: t.name }))}
            />
          </div>
          <div className="mt-8">
            <BrowseTabs
              groups={browseGroups}
              civic={browseCivic}
              towns={townsWithCount}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-8">
        <div className="overflow-hidden rounded-card bg-ink px-8 py-12 text-center text-paper sm:py-16">
          <h2 className="mx-auto max-w-2xl text-balance text-2xl text-paper sm:text-3xl">
            Know a local business we’re missing?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-paper/70">
            This guide is always growing. The more complete it is, the more it helps our community
            thrive.
          </p>
          <Link
            href="/about"
            className="mt-7 inline-flex items-center gap-1.5 rounded-pill bg-pine px-6 py-3 text-sm font-semibold text-white transition hover:bg-pine-dark"
          >
            About this project
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-serif text-2xl font-semibold text-ink">{value}</span>
      <span>{label}</span>
    </span>
  );
}
