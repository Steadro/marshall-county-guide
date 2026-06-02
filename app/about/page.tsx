import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, RefreshCw, MapPinned } from "lucide-react";
import { siteConfig, TOWNS } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name}, a curated, community-minded directory of local businesses and services across Marshall County, Tennessee.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        About this project
      </p>
      <h1 className="text-balance text-4xl sm:text-5xl">
        A love letter to local business in Marshall County.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a curated guide to the restaurants, shops, makers, trades, and
        services of Marshall County, Tennessee, from the county seat of Lewisburg to the towns
        around it. It started from a simple idea: small towns are full of remarkable businesses
        that deserve a beautiful, easy place to be found online.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Value
          Icon={HeartHandshake}
          title="Community first"
          body="Free to list, free to browse. The goal is foot traffic and pride for local business, not ad revenue."
        />
        <Value
          Icon={RefreshCw}
          title="Kept fresh"
          body="Every listing tracks where its data came from and when it was last checked, so the guide stays trustworthy."
        />
        <Value
          Icon={MapPinned}
          title="Truly local"
          body="Towns across Marshall County and the communities around them, the places neighbors actually go."
        />
      </div>

      <div className="prose mt-12 max-w-none">
        <h2 className="text-2xl">How it’s built</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Listings are gathered from public sources and organized by hand. Because details like
          hours and phone numbers change, each one is marked with its source and review status.
          We’re always verifying and adding to the guide. If you spot something out of date, or
          run a business that belongs here, we’d love to hear from you.
        </p>

        <h2 className="mt-10 text-2xl">Towns we cover</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {TOWNS.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/${t.slug}`}
                className="inline-flex rounded-pill border border-line bg-card px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:border-pine hover:text-pine"
              >
                {t.name}, TN
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <section
        aria-labelledby="open-heading"
        className="mt-12 rounded-card border border-line bg-card p-6 shadow-soft ring-1 ring-line/70"
      >
        <h2 id="open-heading" className="text-2xl">
          Built in the open
        </h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          No ads. No paid placement. No sponsored listings, no pay-to-rank, no kickbacks &mdash; a
          business can&apos;t buy its way up the page, because there&apos;s nothing to buy. This is a
          community project; what shows up is editorial, based on what&apos;s useful to neighbors.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Curious how the site works? The whole thing is open source. If you&apos;re a tech-minded
          neighbor, take a look under the hood &mdash; or open an issue if you spot something off.
        </p>
        <a
          href="https://github.com/Steadro/marshall-county-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
        >
          View the source on GitHub
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <section
        aria-labelledby="disclaimer-heading"
        className="mt-12 rounded-card border border-line bg-paper-2/60 p-6"
      >
        <h2 id="disclaimer-heading" className="text-base font-semibold text-ink">
          Independent &amp; unaffiliated
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {siteConfig.name} is an independent community project. It is not affiliated with,
          endorsed by, or operated by Marshall County, the City of Lewisburg, or any other local,
          county, state, or government body. Listings are compiled from publicly available
          information, and inclusion here is not an endorsement of any business. Business names,
          logos, and trademarks belong to their respective owners. If a listing is yours and you’d
          like it updated or removed, just{" "}
          <Link href="/for-owners" className="font-medium text-pine hover:text-pine-dark">
            let us know
          </Link>
          .
        </p>
      </section>

      <div className="mt-14 rounded-card bg-paper-2 p-8 text-center">
        <h2 className="text-2xl">Explore the directory</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          Start browsing every business, or jump straight to a category.
        </p>
        <Link
          href="/businesses"
          className="mt-6 inline-flex items-center gap-1.5 rounded-pill bg-pine px-6 py-3 text-sm font-semibold text-white transition hover:bg-pine-dark"
        >
          Browse all businesses
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function Value({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card bg-card p-6 shadow-soft ring-1 ring-line/70">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pine-soft text-pine-dark">
        <Icon className="h-5 w-5" aria-hidden={true} />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
