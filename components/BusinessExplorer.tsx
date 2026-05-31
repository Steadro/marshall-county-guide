"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { BusinessCard as BusinessCardData } from "@/lib/queries";
import { BusinessCard } from "@/components/BusinessCard";
import { GoldNote } from "@/components/GoldNote";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

export function BusinessExplorer({
  businesses,
  initialCategory,
  initialTown,
  showCategoryFilter = true,
  showTownFilter = true,
  defaultLocalOnly = false,
}: {
  businesses: BusinessCardData[];
  initialCategory?: string;
  initialTown?: string;
  showCategoryFilter?: boolean;
  showTownFilter?: boolean;
  defaultLocalOnly?: boolean;
}) {
  // Seed the search box from `?q=` so the homepage search can deep-link here.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [town, setTown] = useState(initialTown ?? "");
  const [localOnly, setLocalOnly] = useState(defaultLocalOnly);

  const hasChains = useMemo(() => businesses.some((b) => b.isChain), [businesses]);

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();
    for (const b of businesses) map.set(b.category.slug, b.category.name);
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [businesses]);

  const townOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    for (const b of businesses) set.add(b.city);
    return [...set].sort().map((c) => ({ value: c, label: c }));
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (localOnly && b.isChain) return false;
      if (category && b.category.slug !== category) return false;
      if (town && b.city !== town) return false;
      if (!q) return true;
      const haystack = [
        b.name,
        b.category.name,
        b.city,
        b.tagline ?? "",
        b.shortDescription ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [businesses, query, category, town, localOnly]);

  const hasFilters = query || category || town || localOnly;
  const hasGold = useMemo(() => filtered.some((b) => b.qualityTier === "GOLD"), [filtered]);

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-line/70 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses…"
            aria-label="Search businesses"
            className="w-full rounded-pill border border-line bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/20"
          />
        </div>

        {showCategoryFilter || showTownFilter ? (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal
              className="hidden h-4 w-4 text-ink-faint sm:block"
              aria-hidden="true"
            />
            {showCategoryFilter ? (
              <>
                <label className="sr-only" htmlFor="filter-category">
                  Filter by category
                </label>
                <select
                  id="filter-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/20"
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            {showTownFilter ? (
              <>
                <label className="sr-only" htmlFor="filter-town">
                  Filter by town
                </label>
                <select
                  id="filter-town"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/20"
                >
                  <option value="">All towns</option>
                  {townOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        ) : null}

        {hasChains ? (
          <label
            className={cn(
              "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-pill border px-3 py-2.5 text-sm font-medium transition",
              localOnly
                ? "border-clay bg-clay-soft text-clay-dark"
                : "border-line bg-paper text-ink-soft hover:border-clay/50",
            )}
          >
            <input
              type="checkbox"
              checked={localOnly}
              onChange={(e) => setLocalOnly(e.target.checked)}
              className="h-4 w-4 accent-clay"
            />
            Locally owned only
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <p aria-live="polite">
          <span className="font-semibold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "business" : "businesses"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setTown("");
              setLocalOnly(false);
            }}
            className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-ink-soft transition hover:bg-paper-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      {hasGold ? <GoldNote className="mt-3" /> : null}

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-card border border-dashed border-line-strong bg-card/60 p-12 text-center">
          <p className="font-serif text-lg text-ink">No businesses match your search.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try a different term, or clear the filters to see everything.
          </p>
        </div>
      )}
    </div>
  );
}
