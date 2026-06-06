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
} as const;

// Maintainer inbox. Messages from the on-site form route here via the n8n
// webhook → Resend pipeline (see app/api/contact/route.ts).
export const contactEmail = "kyle@steadro.com";

// Path to the structured "add your business" intake form. Distinct from the
// generic contact form: it captures real fields (name/type/address) straight
// into the Submission table, where it surfaces in the admin Intake tab. The
// temporary acquisition CTA (IntakeCta) and the prominent "add" links point here.
export const addBusinessPath = "/add-business";

export type ContactTopic = "update" | "add" | "remove" | "suggestion" | "other";

/**
 * Build a link to the on-site contact form, optionally preset with a topic and
 * the business it concerns (used by per-listing "is this yours?" links). The
 * form posts to /api/contact, which forwards to n8n — no mailto, no account.
 */
export function contactHref(opts?: {
  topic?: ContactTopic;
  business?: { name: string; slug: string };
}): string {
  const params = new URLSearchParams();
  if (opts?.topic) params.set("topic", opts.topic);
  if (opts?.business) {
    params.set("business", opts.business.name);
    params.set("listing", `${siteConfig.url}/business/${opts.business.slug}`);
  }
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
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
