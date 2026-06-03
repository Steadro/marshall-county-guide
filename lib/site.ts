// Centralized site metadata + small shared constants.

export const siteConfig = {
  name: "Marshall County Guide",
  tagline: "A guide to the local businesses and services of Marshall County, Tennessee.",
  description:
    "Discover local restaurants, shops, services, and makers across Marshall County, Tennessee, from the county seat of Lewisburg to Chapel Hill, Cornersville, Petersburg, and Belfast. A community guide to the area's local businesses and services.",
  // Resolve the canonical base URL (no trailing slash). Set NEXT_PUBLIC_SITE_URL
  // in production; falls back to localhost for dev.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  region: "Marshall County, Tennessee",
} as const;

// Who built/maintains the site (shown in the footer).
export const maintainer = {
  name: "Steadro",
  url: "https://steadro.com",
  note: "a Lewisburg business",
} as const;

// Where owner messages go (mailto on the /for-owners page).
export const contactEmail = "kyle@steadro.com";

/** Build a prefilled mailto link for owner requests. */
export function ownerMailto(subject: string, business?: { name: string; slug: string }): string {
  const body = [
    `Business name: ${business?.name ?? ""}`,
    `Listing: ${business ? `${siteConfig.url}/business/${business.slug}` : ""}`,
    "",
    "What you'd like to change:",
    "",
  ].join("\n");
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Prefilled mailto for suggesting a business, service, or office that isn't
 * listed yet. Open to anyone, not just owners.
 */
export function suggestMailto(): string {
  const body = [
    "Name of the business or service:",
    "Town:",
    "Category (restaurant, shop, trade, office, etc.):",
    "Website or phone, if you have it:",
    "",
    "Anything else we should know:",
    "",
  ].join("\n");
  return `mailto:${contactEmail}?subject=${encodeURIComponent("New listing suggestion")}&body=${encodeURIComponent(body)}`;
}

// Towns covered (Lewisburg + ~15-mile radius). `slug` powers /[town] pages;
// lat/lng are town centroids used as a map fallback when a business has no
// street address of its own.
export const TOWNS = [
  { slug: "lewisburg", name: "Lewisburg", lat: 35.449, lng: -86.7889 },
  { slug: "chapel-hill", name: "Chapel Hill", lat: 35.6373, lng: -86.6939 },
  { slug: "cornersville", name: "Cornersville", lat: 35.359, lng: -86.8403 },
  { slug: "petersburg", name: "Petersburg", lat: 35.3151, lng: -86.6386 },
  { slug: "belfast", name: "Belfast", lat: 35.5012, lng: -86.7036 },
] as const;

export const townNameToSlug = new Map<string, string>(
  TOWNS.map((t) => [t.name.toLowerCase(), t.slug]),
);
export const townSlugToName = new Map<string, string>(TOWNS.map((t) => [t.slug, t.name]));
export const townCentroidByName = new Map<string, { lat: number; lng: number }>(
  TOWNS.map((t) => [t.name.toLowerCase(), { lat: t.lat, lng: t.lng }]),
);

export const mainNav = [
  { href: "/businesses", label: "All Businesses" },
  { href: "/#visit", label: "Things to Do" },
  { href: "/#categories", label: "Categories" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
] as const;
