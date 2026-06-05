"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DinnerPicker } from "@/components/DinnerPicker";
import type { BrowseCat, BrowseGroup, GroupAccent } from "@/lib/category-groups";
import type { RestaurantPick } from "@/lib/queries";
import { useSessionState } from "@/lib/useSessionState";

interface Town {
  slug: string;
  name: string;
}

const FOOD_CATEGORY_SLUG = "restaurant-and-food";

// Per-group accent classes, written as literal strings so Tailwind's scanner
// generates them. Brand tokens plus a few arbitrary oklch hues for variety.
const ACCENTS: Record<GroupAccent, { dot: string; iconWrap: string }> = {
  gold: { dot: "bg-gold", iconWrap: "bg-gold-soft text-gold-dark" },
  creek: { dot: "bg-creek", iconWrap: "bg-creek-soft text-creek-dark" },
  pine: { dot: "bg-pine", iconWrap: "bg-pine-soft text-pine-dark" },
  terracotta: {
    dot: "bg-[oklch(0.62_0.13_47)]",
    iconWrap: "bg-[oklch(0.94_0.04_50)] text-[oklch(0.48_0.12_45)]",
  },
  rose: {
    dot: "bg-[oklch(0.6_0.13_12)]",
    iconWrap: "bg-[oklch(0.94_0.03_12)] text-[oklch(0.48_0.11_15)]",
  },
  violet: {
    dot: "bg-[oklch(0.55_0.12_300)]",
    iconWrap: "bg-[oklch(0.93_0.035_300)] text-[oklch(0.47_0.1_300)]",
  },
  slate: {
    dot: "bg-[oklch(0.6_0.02_230)]",
    iconWrap: "bg-[oklch(0.92_0.012_230)] text-ink-soft",
  },
};

export function BrowseDirectory({
  groups,
  civic,
  restaurants,
  towns,
}: {
  groups: BrowseGroup[];
  civic: BrowseGroup;
  restaurants?: RestaurantPick[];
  towns?: Town[];
}) {
  const all = [...groups, civic];
  // Persisted so a back-navigation re-mounts on the same group (stable layout →
  // scroll restoration lands where the user left off). See useSessionState.
  const [active, setActive] = useSessionState(
    "mcg-browse-group",
    all[0]?.key ?? "",
    (v) => all.some((g) => g.key === v),
  );
  const activeGroup = all.find((g) => g.key === active) ?? all[0];
  const isFoodGroup = activeGroup?.categories.some((c) => c.slug === FOOD_CATEGORY_SLUG);

  return (
    <>
      {/* Mobile: a simple, tappable category list (no master-detail, no chips).
          Each big row deep-links to its category page, which has its own filters. */}
      <div className="flex flex-col gap-5 md:hidden">
        {all.map((g) => (
          <div key={g.key}>
            <div className="mb-2 flex items-baseline gap-2 px-1">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ACCENTS[g.accent].dot}`} />
              <h3 className="font-serif text-sm font-semibold text-ink">{g.title}</h3>
              <span className="text-xs text-ink-faint">{g.count}</span>
            </div>
            <div className="flex flex-col gap-2">
              {g.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="flex items-center gap-3 rounded-card bg-card p-3.5 shadow-soft ring-1 ring-line/70 transition active:bg-paper-2"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENTS[g.accent].iconWrap}`}
                  >
                    <CategoryIcon slug={c.slug} className="h-5 w-5" />
                  </span>
                  <span className="flex flex-1 items-baseline justify-between gap-2">
                    <span className="truncate font-serif text-base font-semibold text-ink">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink-faint">{c.count}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: master-detail (group rail + category pane) */}
      <div className="hidden gap-4 md:grid md:grid-cols-[19rem_1fr]">
      {/* Left rail: groups (commercial, then a demoted Community block) */}
      <div className="self-start rounded-card bg-card p-2 shadow-soft ring-1 ring-line/70">
        {groups.map((g) => (
          <PaneItem
            key={g.key}
            group={g}
            active={g.key === active}
            onClick={() => setActive(g.key)}
          />
        ))}
        <div className="my-2 border-t border-line/70" />
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Community
        </p>
        <PaneItem
          group={civic}
          active={civic.key === active}
          onClick={() => setActive(civic.key)}
        />
      </div>

      {/* Right pane: categories in the selected group */}
      <div className="rounded-card bg-card p-5 shadow-soft ring-1 ring-line/70">
        {activeGroup && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 translate-y-[-1px] rounded-full ${ACCENTS[activeGroup.accent].dot}`}
                />
                <h3 className="font-serif text-lg font-semibold text-ink">
                  {activeGroup.title}
                </h3>
                <span className="text-sm text-ink-faint">{activeGroup.count}</span>
              </div>
              {isFoodGroup && restaurants && restaurants.length > 0 ? (
                <DinnerPicker restaurants={restaurants} towns={towns ?? []} />
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink-soft">{activeGroup.blurb}</p>

            <div className="mt-4 flex flex-col gap-4">
              {activeGroup.categories.map((c) => (
                <CategoryBlock key={c.slug} cat={c} accent={activeGroup.accent} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

function PaneItem({
  group,
  active,
  onClick,
}: {
  group: BrowseGroup;
  active: boolean;
  onClick: () => void;
}) {
  const a = ACCENTS[group.accent];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active ? "bg-pine-soft" : "hover:bg-paper-2"
      }`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
      <span className="flex-1 truncate font-serif text-sm font-semibold text-ink">
        {group.title}
      </span>
      <span className="shrink-0 text-xs text-ink-faint">{group.count}</span>
    </button>
  );
}

// A category in the active group: a header row (links to the category page) with
// its subcategory "type" chips beneath, each deep-linking to the pre-filtered
// category page. Falls back to sample business names when a category has no
// subcategories classified yet.
function CategoryBlock({ cat, accent }: { cat: BrowseCat; accent: GroupAccent }) {
  const a = ACCENTS[accent];
  return (
    <div>
      <Link
        href={`/category/${cat.slug}`}
        className="group flex items-center gap-3 rounded-card bg-card p-3 shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.iconWrap}`}
        >
          <CategoryIcon slug={cat.slug} className="h-5 w-5" />
        </span>
        <span className="flex flex-1 items-baseline justify-between gap-2">
          <span className="truncate font-serif text-sm font-semibold text-ink group-hover:text-pine-dark">
            {cat.name}
          </span>
          <span className="shrink-0 text-xs text-ink-faint">{cat.count}</span>
        </span>
      </Link>

      {cat.subcategories.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cat.subcategories.map((s) => (
            <Link
              key={s.name}
              href={`/category/${cat.slug}?type=${encodeURIComponent(s.name)}`}
              className="inline-flex items-center gap-1 rounded-pill border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-pine/50 hover:text-pine-dark"
            >
              {s.name} <span className="text-ink-faint">{s.count}</span>
            </Link>
          ))}
        </div>
      ) : cat.samples.length > 0 ? (
        <p className="mt-1.5 truncate pl-1 text-xs text-ink-faint">{cat.samples.join(" · ")}</p>
      ) : null}
    </div>
  );
}
