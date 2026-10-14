"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface MapPoint {
  latitude: number;
  longitude: number;
  name: string;
  slug?: string;
  city?: string | null;
}

// Browser key (HTTP-referrer restricted in Google Cloud). Inlined at build time.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Themed pine teardrop pin.
const PIN_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.6 12.4 22.4 13 23a1.4 1.4 0 0 0 2 0c.6-.6 13-13.4 13-23C28 6.27 21.73 0 14 0z" fill="#3f6b54" stroke="#fdfcfa" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fffdf9"/>
  </svg>`,
)}`;

// One script tag per page, shared by every map on it.
let mapsReady: Promise<void> | undefined;
function loadGoogleMaps(): Promise<void> {
  mapsReady ??= new Promise((resolve, reject) => {
    (window as unknown as { __gmapsReady: () => void }).__gmapsReady = resolve;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&loading=async&callback=__gmapsReady`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.append(script);
  });
  return mapsReady;
}

function popupContent(p: MapPoint): HTMLElement {
  // Built as DOM nodes (textContent), never an HTML string: names come from the DB.
  const el = document.createElement("div");
  const title = document.createElement(p.slug ? "a" : "span");
  title.textContent = p.name;
  title.className = "font-semibold text-[#2a4a3a]";
  if (p.slug) (title as HTMLAnchorElement).href = `/business/${p.slug}`;
  el.append(title);
  if (p.city) {
    const city = document.createElement("div");
    city.textContent = p.city;
    city.className = "mt-0.5 text-xs text-neutral-500";
    el.append(city);
  }
  return el;
}

export function LocationMap({
  points,
  zoom = 15,
  className,
}: {
  points: MapPoint[];
  zoom?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;

    (async () => {
      await loadGoogleMaps();
      const [{ Map, InfoWindow }, { Marker }, { LatLngBounds }] = await Promise.all([
        google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
        google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        google.maps.importLibrary("core") as Promise<google.maps.CoreLibrary>,
      ]);
      if (cancelled || !ref.current) return;

      const map = new Map(ref.current, {
        center: points.length
          ? { lat: points[0].latitude, lng: points[0].longitude }
          : { lat: 35.449, lng: -86.789 }, // Lewisburg
        zoom: points.length === 1 ? zoom : 13,
        // Page scrolls on a one-finger swipe / plain wheel; the map pans on two
        // fingers / ctrl+wheel. Replaces the old "Tap to interact" overlay.
        gestureHandling: "cooperative",
        mapTypeControl: false,
        streetViewControl: false,
      });

      const info = new InfoWindow();
      const bounds = new LatLngBounds();
      for (const p of points) {
        const position = { lat: p.latitude, lng: p.longitude };
        bounds.extend(position);
        // ponytail: legacy Marker (deprecated, still supported) — AdvancedMarkerElement
        // needs a Cloud Map ID; switch when one exists or Google sets a removal date.
        const marker = new Marker({ map, position, title: p.name, icon: PIN_URL });
        marker.addListener("click", () => {
          info.setContent(popupContent(p));
          info.open({ map, anchor: marker });
        });
      }

      if (points.length > 1) {
        map.fitBounds(bounds, 40);
        // fitBounds has no maxZoom; clamp once so tightly clustered pins don't over-zoom.
        google.maps.event.addListenerOnce(map, "idle", () => {
          if ((map.getZoom() ?? 0) > 15) map.setZoom(15);
        });
      }
    })().catch((err) => console.error(err));

    return () => {
      cancelled = true;
    };
  }, [points, zoom]);

  return (
    <div
      className={cn(
        "relative flex h-80 w-full items-center justify-center overflow-hidden rounded-card bg-paper-2 text-sm text-ink-faint ring-1 ring-line/70",
        className,
      )}
    >
      {API_KEY ? "Loading map…" : "Map unavailable"}
      {/* Google owns this node's children; kept separate from the React-rendered text. */}
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}
