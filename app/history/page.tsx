import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOWNS } from "@/lib/site";
import { HistoryTabs } from "@/components/HistoryTabs";
import { JsonLd } from "@/components/JsonLd";
import { buildHistoryJsonLd } from "@/lib/schema-org";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Marshall County, TN History: Lewisburg & Its Towns" },
  description:
    "How Marshall County, Tennessee and its towns came to be: Lewisburg, Chapel Hill, Cornersville, Petersburg, and Belfast, from 1807 settlement to Pencil City and the Tennessee Walking Horse.",
  alternates: { canonical: "/history" },
};

export default function HistoryPage() {
  return (
    <>
      <JsonLd data={buildHistoryJsonLd()} />

      <div className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            A little local history
          </p>
          <h1 className="text-balance text-3xl sm:text-4xl">How these towns came to be</h1>
          <p className="mt-3 text-pretty leading-relaxed text-ink-soft">
            Five towns, one county seat, and a couple of centuries between them. Marshall
            County was carved from four older counties in 1836; the places inside it are
            older still. Pick a place and read a bit of its story.
          </p>
        </div>

        <div className="mt-10">
          <HistoryTabs />
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-card bg-paper-2 p-8 text-center">
          <h2 className="text-2xl">See who&apos;s here today</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            The history is half the story. Browse the local businesses keeping these towns
            going now.
          </p>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {TOWNS.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/${t.slug}`}
                  className="inline-flex rounded-pill border border-line bg-card px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:border-pine hover:text-pine"
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/businesses"
            className="mt-6 inline-flex items-center gap-1.5 rounded-pill bg-pine px-6 py-3 text-sm font-semibold text-white transition hover:bg-pine-dark"
          >
            Browse all businesses
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
