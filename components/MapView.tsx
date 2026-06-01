"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  latitude: number;
  longitude: number;
  name: string;
  slug?: string;
  city?: string | null;
}

// Themed pine teardrop pin (a divIcon avoids Leaflet's bundler icon-path issues).
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.6 12.4 22.4 13 23a1.4 1.4 0 0 0 2 0c.6-.6 13-13.4 13-23C28 6.27 21.73 0 14 0z" fill="#3f6b54" stroke="#fdfcfa" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fffdf9"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});

function FitToPoints({ points, zoom }: { points: MapPoint[]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], zoom);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(
        points.map((p) => [p.latitude, p.longitude] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points, zoom]);
  return null;
}

export default function MapView({ points, zoom = 15 }: { points: MapPoint[]; zoom?: number }) {
  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [35.449, -86.789]; // Lewisburg

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "var(--color-paper-2)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        detectRetina
      />
      <FitToPoints points={points} zoom={zoom} />
      {points.map((p, i) => (
        <Marker key={p.slug ?? `${p.latitude},${p.longitude},${i}`} position={[p.latitude, p.longitude]} icon={pinIcon}>
          <Popup>
            {p.slug ? (
              <Link href={`/business/${p.slug}`} className="font-semibold text-[#2a4a3a]">
                {p.name}
              </Link>
            ) : (
              <span className="font-semibold">{p.name}</span>
            )}
            {p.city ? <div className="mt-0.5 text-xs text-neutral-500">{p.city}</div> : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
