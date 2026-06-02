"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, MapPin } from "lucide-react";
import { BrowseDirectory } from "@/components/BrowseDirectory";
import type { BrowseGroup } from "@/lib/category-groups";
import { cn } from "@/lib/utils";

interface TownCount {
  slug: string;
  name: string;
  count: number;
}

export function BrowseTabs({
  groups,
  civic,
  towns,
}: {
  groups: BrowseGroup[];
  civic: BrowseGroup;
  towns: TownCount[];
}) {
  const [tab, setTab] = useState<"category" | "community">("category");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Browse the directory"
        className="flex w-full rounded-pill border border-line bg-card p-1 shadow-soft sm:inline-flex sm:w-auto"
      >
        <TabButton
          active={tab === "category"}
          onClick={() => setTab("category")}
          icon={<LayoutGrid className="h-4 w-4" aria-hidden="true" />}
        >
          <span className="hidden sm:inline">Browse by </span>Category
        </TabButton>
        <TabButton
          active={tab === "community"}
          onClick={() => setTab("community")}
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
        >
          <span className="hidden sm:inline">Browse by </span>Community
        </TabButton>
      </div>

      <div className="mt-8">
        {tab === "category" ? (
          <BrowseDirectory groups={groups} civic={civic} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {towns.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="group rounded-card bg-card p-5 text-center shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="block font-serif text-lg font-semibold text-ink group-hover:text-creek-dark">
                  {t.name}
                </span>
                <span className="text-sm text-ink-faint">
                  {t.count} {t.count === 1 ? "business" : "businesses"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
        active ? "bg-creek-dark text-white shadow-soft" : "text-ink-soft hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
