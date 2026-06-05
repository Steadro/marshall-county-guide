"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { BusinessCard as BusinessCardData } from "@/lib/queries";
import { BusinessCard } from "@/components/BusinessCard";
import { matchesQuery } from "@/lib/search";
import { knownTypeNames, typesOf } from "@/lib/category-groups";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

type SortKey = "name" | "city" | "type";

// Town filter pills — deliberately bigger + a warm gold accent so the "where"
// row reads as distinct from the pine "type" pills below it.
const townButtonClass = "rounded-pill border px-4 py-2 text-sm font-semibold transition";
const townButtonActive = "border-gold-dark/40 bg-gold-soft text-gold-dark";
const townButtonResting = "border-line bg-card text-ink-soft hover:border-gold-dark/40 hover:text-ink";

export function BusinessExplorer({
  businesses,
  initialCategory,
  initialTown,
  showCategoryFilter = true,
  showTownFilter = true,
  showSubcategoryFilter = false,
  defaultLocalOnly = false,
}: {
  businesses: BusinessCardData[];
  initialCategory?: string;
  initialTown?: string;
  showCategoryFilter?: boolean;
  showTownFilter?: boolean;
  showSubcategoryFilter?: boolean;
  defaultLocalOnly?: boolean;
}) {
  // Seed the search box from `?q=` so the homepage search can deep-link here.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [town, setTown] = useState(initialTown ?? "");
  // Seed from `?type=` so the homepage browse chips can deep-link to a
  // pre-filtered subcategory (e.g. /category/restaurant-and-food?type=Cafe).
  const [subcategory, setSubcategory] = useState(searchParams.get("type") ?? "");
  const [localOnly, setLocalOnly] = useState(defaultLocalOnly);
  const [sort, setSort] = useState<SortKey>("name");

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

  // Subcategory facet (the "what kind of place" axis) — counts reflect the
  // currently-applicable set, sorted most-common first. Only meaningful when the
  // list shares a category (e.g. a category page), so it's opt-in.
  const knownTypes = useMemo(() => knownTypeNames(businesses), [businesses]);
  const subcategoryOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of businesses) {
      for (const t of typesOf(b, knownTypes)) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [businesses, knownTypes]);

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      if (localOnly && b.isChain) return false;
      if (category && b.category.slug !== category) return false;
      if (town && b.city !== town) return false;
      // Type filter matches the primary subcategory OR a secondary type-tag.
      if (subcategory && !typesOf(b, knownTypes).includes(subcategory)) return false;
      // Synonym-aware match ("haircut" -> hair salons), see lib/search.ts
      return matchesQuery(b, query);
    });
  }, [businesses, query, category, town, subcategory, localOnly, knownTypes]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === "city") {
      arr.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
    } else if (sort === "type") {
      arr.sort(
        (a, b) =>
          (a.subcategory ?? "").localeCompare(b.subcategory ?? "") || a.name.localeCompare(b.name),
      );
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [filtered, sort]);

  const hasFilters = query || category || town || subcategory || localOnly;

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
            placeholder="Search places…"
            aria-label="Search places"
            className="w-full rounded-pill border border-line bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20"
          />
        </div>

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
                className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20"
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

          <label className="sr-only" htmlFor="sort-by">
            Sort by
          </label>
          <select
            id="sort-by"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20"
          >
            <option value="name">Sort: A–Z</option>
            <option value="city">Sort: City</option>
            <option value="type">Sort: Type</option>
          </select>

          {/* Mobile: native dropdowns for town/type (big tap targets); the chip
              rows below are desktop-only. */}
          {showTownFilter && townOptions.length > 1 ? (
            <>
              <label className="sr-only" htmlFor="filter-town-m">
                Filter by town
              </label>
              <select
                id="filter-town-m"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20 sm:hidden"
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
          {showSubcategoryFilter && subcategoryOptions.length > 1 ? (
            <>
              <label className="sr-only" htmlFor="filter-type-m">
                Filter by type
              </label>
              <select
                id="filter-type-m"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="rounded-pill border border-line bg-paper px-3 py-2.5 text-sm text-ink-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20 sm:hidden"
              >
                <option value="">All types</option>
                {subcategoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value} ({o.count})
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>

        {hasChains ? (
          <label
            className={cn(
              "flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-pill border px-3 py-2.5 text-sm font-medium transition",
              localOnly
                ? "border-pine bg-pine-soft text-pine-dark"
                : "border-line bg-paper text-ink-soft hover:border-pine/50",
            )}
          >
            <input
              type="checkbox"
              checked={localOnly}
              onChange={(e) => setLocalOnly(e.target.checked)}
              className="h-4 w-4 accent-pine"
            />
            Locally owned only
          </label>
        ) : null}
      </div>

      {showTownFilter && townOptions.length > 1 ? (
        <div className="mt-5 hidden flex-wrap gap-2.5 sm:flex" role="group" aria-label="Filter by town">
          <button
            type="button"
            onClick={() => setTown("")}
            aria-pressed={town === ""}
            className={cn(townButtonClass, town === "" ? townButtonActive : townButtonResting)}
          >
            All towns
          </button>
          {townOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setTown((t) => (t === o.value ? "" : o.value))}
              aria-pressed={town === o.value}
              className={cn(townButtonClass, town === o.value ? townButtonActive : townButtonResting)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}

      {showSubcategoryFilter && subcategoryOptions.length > 1 ? (
        <div className="mt-5 hidden flex-wrap gap-2 sm:flex" role="group" aria-label="Filter by type">
          <button
            type="button"
            onClick={() => setSubcategory("")}
            aria-pressed={subcategory === ""}
            className={cn(
              "rounded-pill border px-3 py-1.5 text-sm font-medium transition",
              subcategory === ""
                ? "border-pine bg-pine-soft text-pine-dark"
                : "border-line bg-paper text-ink-soft hover:border-pine/50",
            )}
          >
            All types
          </button>
          {subcategoryOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setSubcategory((s) => (s === o.value ? "" : o.value))}
              aria-pressed={subcategory === o.value}
              className={cn(
                "rounded-pill border px-3 py-1.5 text-sm font-medium transition",
                subcategory === o.value
                  ? "border-pine bg-pine-soft text-pine-dark"
                  : "border-line bg-paper text-ink-soft hover:border-pine/50",
              )}
            >
              {o.value} <span className="text-ink-faint">{o.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
        <p aria-live="polite">
          <span className="font-semibold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "place" : "places"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setTown("");
              setSubcategory("");
              setLocalOnly(false);
            }}
            className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-ink-soft transition hover:bg-paper-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-card border border-dashed border-line-strong bg-card/60 p-12 text-center">
          <p className="font-serif text-lg text-ink">No places match your search.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try a different term, or clear the filters to see everything.
          </p>
        </div>
      )}
    </div>
  );
}
