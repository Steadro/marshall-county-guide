"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { BrowseCat, BrowseGroup, GroupAccent } from "@/lib/category-groups";

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
}: {
  groups: BrowseGroup[];
  civic: BrowseGroup;
}) {
  const all = [...groups, civic];
  const [active, setActive] = useState(all[0]?.key ?? "");
  const activeGroup = all.find((g) => g.key === active) ?? all[0];

  return (
    <div className="grid gap-4 md:grid-cols-[19rem_1fr]">
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
            <div className="flex items-baseline gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 translate-y-[-1px] rounded-full ${ACCENTS[activeGroup.accent].dot}`}
              />
              <h3 className="font-serif text-lg font-semibold text-ink">
                {activeGroup.title}
              </h3>
              <span className="text-sm text-ink-faint">{activeGroup.count}</span>
            </div>
            <p className="mb-4 mt-1 text-sm text-ink-soft">{activeGroup.blurb}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeGroup.categories.map((c) => (
                <CategoryTile key={c.slug} cat={c} accent={activeGroup.accent} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
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

function CategoryTile({ cat, accent }: { cat: BrowseCat; accent: GroupAccent }) {
  const a = ACCENTS[accent];
  return (
    <Link
      href={`/category/${cat.slug}`}
      className="group flex items-start gap-3 rounded-card bg-card p-4 shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.iconWrap}`}
      >
        <CategoryIcon slug={cat.slug} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-serif text-sm font-semibold text-ink">
            {cat.name}
          </span>
          <span className="shrink-0 text-xs text-ink-faint">{cat.count}</span>
        </span>
        {cat.samples.length > 0 && (
          <span className="mt-0.5 block truncate text-xs text-ink-faint">
            {cat.samples.join(" · ")}
          </span>
        )}
      </span>
    </Link>
  );
}
