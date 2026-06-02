"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { BrowseCat, BrowseGroup, GroupAccent } from "@/lib/category-groups";

// Per-group accent classes. Written as literal strings so Tailwind's scanner
// generates them. Brand tokens (gold/creek/pine) plus a few arbitrary oklch
// hues for variety, all sampled near the existing palette.
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

const LAYOUTS = [
  {
    key: "shelves" as const,
    label: "Shelves",
    hint: "Everything visible, scan top to bottom. Most internal links on one page — best for SEO and LLM crawling.",
  },
  {
    key: "accordion" as const,
    label: "Accordion",
    hint: "Compact. Tap a group to open it. Best on mobile / small screens.",
  },
  {
    key: "two-pane" as const,
    label: "Two-pane",
    hint: "Pick a group on the left, its categories show on the right. Desktop-first.",
  },
];

type LayoutKey = (typeof LAYOUTS)[number]["key"];

export function BrowseLab({
  groups,
  civic,
  towns,
}: {
  groups: BrowseGroup[];
  civic: BrowseGroup;
  towns: { slug: string; name: string; count: number }[];
  totalCount: number;
}) {
  const [layout, setLayout] = useState<LayoutKey>("shelves");

  return (
    <div>
      {/* Town chips — illustrative only on this mockup */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          I&apos;m in
        </span>
        <span className="rounded-pill bg-pine px-3 py-1 text-sm font-semibold text-white">
          All of Marshall County
        </span>
        {towns.map((t) => (
          <span
            key={t.slug}
            className="rounded-pill border border-line bg-card px-3 py-1 text-sm text-ink-soft"
            title="Town filtering is illustrative on this mockup"
          >
            {t.name} <span className="text-ink-faint">{t.count}</span>
          </span>
        ))}
      </div>

      {/* Layout switcher */}
      <div className="mb-2 flex flex-wrap gap-1 rounded-pill border border-line bg-card p-1 shadow-soft sm:inline-flex">
        {LAYOUTS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLayout(l.key)}
            className={`rounded-pill px-4 py-2 text-sm font-semibold transition ${
              layout === l.key
                ? "bg-pine text-white shadow-soft"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="mb-8 text-sm text-ink-faint">
        {LAYOUTS.find((l) => l.key === layout)?.hint}
      </p>

      {layout === "shelves" && <Shelves groups={groups} civic={civic} />}
      {layout === "accordion" && <Accordion groups={groups} civic={civic} />}
      {layout === "two-pane" && <TwoPane groups={groups} civic={civic} />}
    </div>
  );
}

/* ---------- shared tile ---------- */

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

function GroupHeading({ group }: { group: BrowseGroup }) {
  const a = ACCENTS[group.accent];
  return (
    <div className="flex items-baseline gap-2">
      <span className={`h-2.5 w-2.5 shrink-0 translate-y-[-1px] rounded-full ${a.dot}`} />
      <h3 className="font-serif text-lg font-semibold text-ink">{group.title}</h3>
      <span className="text-sm text-ink-faint">{group.count}</span>
    </div>
  );
}

/* ---------- A2: shelves ---------- */

function Shelves({ groups, civic }: { groups: BrowseGroup[]; civic: BrowseGroup }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <GroupHeading group={g} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.categories.map((c) => (
              <CategoryTile key={c.slug} cat={c} accent={g.accent} />
            ))}
          </div>
        </section>
      ))}

      {/* Civic: visually separated + collapsed by default (still in the DOM, still indexable) */}
      <details className="rounded-card bg-paper-2 p-4 ring-1 ring-line/70 [&_svg.chev]:open:rotate-180">
        <summary className="flex cursor-pointer list-none items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ACCENTS[civic.accent].dot}`} />
          <span className="font-serif text-lg font-semibold text-ink">{civic.title}</span>
          <span className="text-sm text-ink-faint">{civic.count}</span>
          <span className="ml-auto flex items-center gap-1 text-xs uppercase tracking-wide text-ink-faint">
            Collapsed by default
            <ChevronDown className="chev h-4 w-4 transition-transform" aria-hidden="true" />
          </span>
        </summary>
        <p className="mt-2 text-sm text-ink-soft">{civic.blurb}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {civic.categories.map((c) => (
            <CategoryTile key={c.slug} cat={c} accent={civic.accent} />
          ))}
        </div>
      </details>
    </div>
  );
}

/* ---------- A1: accordion ---------- */

function Accordion({ groups, civic }: { groups: BrowseGroup[]; civic: BrowseGroup }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <AccordionRow key={g.key} group={g} />
      ))}
      <AccordionRow group={civic} muted />
    </div>
  );
}

function AccordionRow({ group, muted }: { group: BrowseGroup; muted?: boolean }) {
  const [open, setOpen] = useState(false);
  const a = ACCENTS[group.accent];
  return (
    <div
      className={`overflow-hidden rounded-card shadow-soft ring-1 ring-line/70 ${
        muted ? "bg-paper-2" : "bg-card"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.iconWrap}`}
        >
          <CategoryIcon slug={group.categories[0]?.slug ?? "other"} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-base font-semibold text-ink">
            {group.title}
          </span>
          <span className="text-xs text-ink-faint">
            {group.count} places · {group.categories.length}{" "}
            {group.categories.length === 1 ? "category" : "categories"}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink-faint transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-line/70 p-4 sm:grid-cols-2">
          {group.categories.map((c) => (
            <CategoryTile key={c.slug} cat={c} accent={group.accent} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- A3: two-pane ---------- */

function TwoPane({ groups, civic }: { groups: BrowseGroup[]; civic: BrowseGroup }) {
  const all = [...groups, civic];
  const [active, setActive] = useState(all[0]?.key ?? "");
  const activeGroup = all.find((g) => g.key === active) ?? all[0];

  return (
    <div className="grid gap-4 md:grid-cols-[19rem_1fr]">
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

      <div className="rounded-card bg-card p-5 shadow-soft ring-1 ring-line/70">
        {activeGroup && (
          <>
            <div className="mb-1">
              <GroupHeading group={activeGroup} />
            </div>
            <p className="mb-4 text-sm text-ink-soft">{activeGroup.blurb}</p>
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
