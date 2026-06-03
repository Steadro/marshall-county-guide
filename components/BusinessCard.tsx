import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import type { BusinessCard as BusinessCardData } from "@/lib/queries";
import { CategoryTag } from "@/components/CategoryTag";
import { cn } from "@/lib/utils";

/**
 * Compact, info-only card: category tag, name, town, and a two-line summary.
 * No imagery, keeping the directory dense and text-forward.
 *
 * GOLD-tier (gold-standard) businesses get a subtle warm gold tint (ring +
 * gradient) as a quiet trust signal. The tint is explained by a low-emphasis
 * legend on listing pages (GoldNote) rather than a per-card badge.
 */
export function BusinessCard({
  business,
  className,
}: {
  business: BusinessCardData;
  className?: string;
}) {
  const summary = business.tagline || business.shortDescription;
  const isGold = business.qualityTier === "GOLD";

  return (
    <Link
      href={`/business/${business.slug}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-card bg-card p-5 shadow-soft ring-1 ring-line/70",
        "transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lift",
        isGold &&
          "bg-gradient-to-b from-gold-soft/35 to-card ring-gold/45 hover:shadow-[var(--shadow-gold)] hover:ring-gold/60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <CategoryTag name={business.category.name} slug={business.category.slug} />
        {business.subcategory ? (
          <span className="text-xs font-medium text-ink-faint">{business.subcategory}</span>
        ) : null}
      </div>

      <h3 className="flex items-start justify-between gap-2 font-serif text-lg font-semibold leading-snug text-ink">
        <span className="group-hover:text-pine-dark">{business.name}</span>
        <ArrowUpRight
          className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </h3>

      <p className="flex items-center gap-1 text-xs text-ink-faint">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {business.city}
      </p>

      {summary ? (
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{summary}</p>
      ) : null}
    </Link>
  );
}
