"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { BusinessCard as BusinessCardData } from "@/lib/queries";
import { TOWNS } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Government & Civic listings, grouped by jurisdiction instead of a flat grid.
 * Most names repeat their jurisdiction ("Marshall County …", "Chapel Hill …"),
 * so we group under a header and strip the prefix from each item — far cleaner
 * than restating "Marshall County" on every card. Jurisdiction is derived from
 * the name prefix (county) or the city (towns); a structured field can replace
 * this later without changing the UI.
 */

const COUNTY = "Marshall County";
// Towns in anchor order (county seat first), used to order the groups.
const TOWN_ORDER: string[] = TOWNS.map((t) => t.name);

function jurisdictionOf(b: BusinessCardData): { group: string; display: string } {
  const name = b.name;
  if (name.startsWith(`${COUNTY} `)) {
    return { group: COUNTY, display: name.slice(COUNTY.length + 1).trim() || name };
  }
  const cityOf = `City of ${b.city} `;
  if (name.startsWith(cityOf)) return { group: b.city, display: name.slice(cityOf.length).trim() || name };
  if (name.startsWith(`${b.city} `)) return { group: b.city, display: name.slice(b.city.length + 1).trim() || name };
  return { group: b.city, display: name };
}

function groupRank(group: string): number {
  if (group === COUNTY) return -1; // county first
  const i = TOWN_ORDER.indexOf(group);
  return i === -1 ? TOWN_ORDER.length : i;
}

interface Group {
  name: string;
  items: { business: BusinessCardData; display: string }[];
}

export function GovernmentDirectory({ businesses }: { businesses: BusinessCardData[] }) {
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const b of businesses) {
      const { group, display } = jurisdictionOf(b);
      if (!map.has(group)) map.set(group, { name: group, items: [] });
      map.get(group)!.items.push({ business: b, display });
    }
    const arr = [...map.values()];
    for (const g of arr) g.items.sort((a, z) => a.display.localeCompare(z.display));
    arr.sort((a, z) => groupRank(a.name) - groupRank(z.name) || a.name.localeCompare(z.name));
    return arr;
  }, [businesses]);

  const [active, setActive] = useState<string>(""); // "" = all jurisdictions
  const visible = active ? groups.filter((g) => g.name === active) : groups;

  return (
    <div>
      {groups.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by jurisdiction">
          <JurisdictionButton label="All" active={active === ""} onClick={() => setActive("")} />
          {groups.map((g) => (
            <JurisdictionButton
              key={g.name}
              label={g.name}
              count={g.items.length}
              active={active === g.name}
              onClick={() => setActive((a) => (a === g.name ? "" : g.name))}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-10">
        {visible.map((g) => (
          <section key={g.name}>
            <div className="mb-3 flex items-baseline gap-2 border-b border-line/70 pb-2">
              <h2 className="font-serif text-xl text-ink">{g.name}</h2>
              <span className="text-sm text-ink-faint">
                {g.items.length} {g.items.length === 1 ? "office" : "offices"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map(({ business: b, display }) => {
                const summary = b.tagline || b.shortDescription;
                return (
                  <Link
                    key={b.id}
                    href={`/business/${b.slug}`}
                    className="group flex flex-col gap-1.5 rounded-card bg-card p-4 shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <h3 className="font-serif text-base font-semibold leading-snug text-ink group-hover:text-pine-dark">
                      {display}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-ink-faint">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {b.city}
                    </p>
                    {summary ? (
                      <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                        {summary}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function JurisdictionButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-pill border px-3 py-1.5 text-sm font-medium transition",
        active
          ? "border-pine bg-pine-soft text-pine-dark"
          : "border-line bg-paper text-ink-soft hover:border-pine/50",
      )}
    >
      {label}
      {count != null ? <span className="ml-1 text-ink-faint">{count}</span> : null}
    </button>
  );
}
