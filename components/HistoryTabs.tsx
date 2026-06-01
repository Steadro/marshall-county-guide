"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PLACES } from "@/lib/history";

export function HistoryTabs() {
  const [active, setActive] = useState(PLACES[0].key);
  const place = PLACES.find((p) => p.key === active) ?? PLACES[0];

  return (
    <div className="mx-auto max-w-4xl rounded-[1.75rem] bg-card p-5 shadow-soft ring-1 ring-line/70 sm:p-8 lg:p-10">
      {/* Tab strip: scrolls sideways on small screens rather than wrapping */}
      <div
        role="tablist"
        aria-label="Town histories"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PLACES.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={p.key === active}
            onClick={() => setActive(p.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-pill px-4 py-2 text-sm font-semibold transition",
              p.key === active
                ? "bg-pine text-white shadow-soft"
                : "text-ink-soft hover:bg-paper-2 hover:text-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div role="tabpanel">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            {place.meta}
          </p>
          <h3 className="mt-2 font-serif text-2xl text-ink sm:text-3xl">{place.label}</h3>
          <div className="mt-4 space-y-4">
            {place.paragraphs.map((text, i) => (
              <p key={i} className="text-pretty leading-relaxed text-ink-soft">
                {text}
              </p>
            ))}
          </div>
        </div>

        <aside className="rounded-card bg-paper-2/60 p-5 ring-1 ring-line/70">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Good to know
          </p>
          <ul className="mt-4 space-y-3">
            {place.facts.map((fact, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-pine"
                />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
