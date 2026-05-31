"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Cycle through the towns once, then settle on "Marshall County" as the finale.
const TOWNS = ["Lewisburg", "Chapel Hill", "Cornersville", "Petersburg", "Belfast"];
const TOTAL = TOWNS.length + 1; // towns + the final "Marshall County"
const STEP_MS = 3600;

// The rotating place name: a larger, elegant italic-serif accent.
const SCRIPT = "font-script italic text-[1.2em] font-semibold leading-[1]";

export function RotatingPlace() {
  // Start on Lewisburg (index 0) so server and first client render match.
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return; // hold on Lewisburg; no motion

    if (index < TOTAL - 1) {
      timer.current = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index]);

  const isFinal = index === TOTAL - 1;

  // Finale: "Marshall County" is wider than the town slot, so the whole line
  // animates in as one unit (home shifts once here, deliberately).
  if (isFinal) {
    return (
      <span key="final" className="place-word inline-block whitespace-nowrap">
        <span className={cn(SCRIPT, "text-forest")}>Marshall County</span> home.
      </span>
    );
  }

  // Towns: all five share one centered slot sized to the widest town. The slot
  // width is fixed (so "home" never moves); centering splits the slack evenly on
  // both sides of the town so the offset isn't lopsided. Inactive towns stay
  // (visibility:hidden) to hold the slot width.
  return (
    <span className="whitespace-nowrap">
      <span className="inline-grid justify-items-center align-baseline">
        {TOWNS.map((town, i) => (
          <span
            key={i}
            aria-hidden={i !== index}
            className={cn(
              "col-start-1 row-start-1 whitespace-nowrap text-clay",
              SCRIPT,
              i === index ? "place-word" : "invisible",
            )}
          >
            {town}
          </span>
        ))}
      </span>{" "}
      home.
    </span>
  );
}
