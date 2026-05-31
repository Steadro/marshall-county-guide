// Geocoding helpers. Defaults to free, no-key providers (US Census, then
// OpenStreetMap Nominatim as a fallback) and supports Google/Mapbox when a key
// is set via GEOCODER=google|mapbox. Returns null on any failure so callers can
// skip a row without crashing the run.

export interface GeoResult {
  latitude: number;
  longitude: number;
}

export type Geocoder = (address: string) => Promise<GeoResult | null>;

/** A paid geocoder if a key is configured, otherwise null (use the free ones). */
export function resolveGeocoder(): { name: string; geocode: Geocoder } | null {
  const provider = (process.env.GEOCODER ?? "").trim().toLowerCase();

  if (provider === "google") {
    const key = process.env.GOOGLE_GEOCODING_API_KEY?.trim();
    if (!key) return null;
    return { name: "google", geocode: (addr) => geocodeGoogle(addr, key) };
  }

  if (provider === "mapbox") {
    const token = process.env.MAPBOX_TOKEN?.trim();
    if (!token) return null;
    return { name: "mapbox", geocode: (addr) => geocodeMapbox(addr, token) };
  }

  return null;
}

/** Free US-address geocoder (US Census Bureau). No key, generous limits. */
export async function geocodeCensus(address: string): Promise<GeoResult | null> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
  url.searchParams.set("address", address);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    result?: { addressMatches?: Array<{ coordinates?: { x: number; y: number } }> };
  };
  const match = data.result?.addressMatches?.[0]?.coordinates;
  if (!match) return null;
  return { latitude: match.y, longitude: match.x };
}

/** Free worldwide geocoder (OpenStreetMap Nominatim). Rate-limit to ~1 req/sec. */
export async function geocodeNominatim(address: string): Promise<GeoResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");
  const res = await fetch(url, {
    headers: { "User-Agent": "MarshallCountyGuide/1.0 (community business directory)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
}

async function geocodeGoogle(address: string, key: string): Promise<GeoResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    results: Array<{ geometry: { location: { lat: number; lng: number } } }>;
  };
  if (data.status !== "OK" || data.results.length === 0) return null;
  const loc = data.results[0].geometry.location;
  return { latitude: loc.lat, longitude: loc.lng };
}

async function geocodeMapbox(address: string, token: string): Promise<GeoResult | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("country", "US");
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { features: Array<{ center: [number, number] }> };
  if (!data.features?.length) return null;
  const [lng, lat] = data.features[0].center;
  return { latitude: lat, longitude: lng };
}

/** Build a single-line address string for geocoding. */
export function formatAddress(parts: {
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}): string {
  return [parts.streetAddress, parts.city, parts.state, parts.postalCode]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}
