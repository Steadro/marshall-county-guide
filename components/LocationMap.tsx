"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MapPoint } from "@/components/MapView";

// Leaflet touches `window`, so load the map client-side only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper-2 text-sm text-ink-faint">
      Loading map…
    </div>
  ),
});

export function LocationMap({
  points,
  zoom,
  className,
}: {
  points: MapPoint[];
  zoom?: number;
  className?: string;
}) {
  // Until the user taps the map, an overlay sits on top so a finger-swipe
  // scrolls the page instead of panning the map (a common Leaflet mobile snag).
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "relative h-80 w-full overflow-hidden rounded-card ring-1 ring-line/70",
        className,
      )}
    >
      <MapView points={points} zoom={zoom} />
      {!active ? (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label="Activate map"
          className="absolute inset-0 z-[1000] flex items-end justify-center bg-transparent"
        >
          <span className="mb-3 rounded-pill bg-card/90 px-3 py-1.5 text-xs font-medium text-ink-soft shadow-soft backdrop-blur-sm">
            Tap to interact
          </span>
        </button>
      ) : null}
    </div>
  );
}

export type { MapPoint };
