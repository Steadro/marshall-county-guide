// Centralized site metadata + small shared constants.

import type { Metadata } from "next";

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

/**
 * Per-page metadata with matching Open Graph + Twitter tags. Next replaces (not
 * merges) a parent's openGraph/twitter objects, so every page sets the full set
 * here rather than inheriting the homepage's og:url/og:title from the layout.
 * `title` is the bare page title; the layout template adds the brand
 * (brand-first, matching the tab-title choice in df8b71a).
 * Pass `image: false` on routes with their own opengraph-image file.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  image = true,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  image?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${siteConfig.name} | ${title}`;
  const images = image
    ? [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: `${siteConfig.name}: ${siteConfig.tagline}` }]
    : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: siteConfig.name,
      url: `${siteConfig.url}${path === "/" ? "" : path}`,
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

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
// prominent "add" links point here.
export const addBusinessPath = "/add-business";

/**
 * Sitewide voting eyebrow (components/VotingBanner.tsx). Nonpartisan: it only
 * points to the Secretary of State. For the next election, update the copy and
 * dates here (and `id`, so earlier dismissals don't hide the new notice).
 * Dates from https://sos.tn.gov/govotetn.
 */
export const votingNotice = {
  id: "2026-11-03",
  headline: "Early voting runs Oct. 14–29.",
  detail: "Election Day is Tuesday, Nov. 3.",
  linkLabel: "Polling places, hours & ID rules",
  url: "https://sos.tn.gov/govotetn",
  // Hidden from midnight Central after Election Day (Nov 4, 00:00 CST).
  endsAt: new Date("2026-11-04T06:00:00Z"),
} as const;

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

// Towns covered (Lewisburg + ~15-mile radius). `slug` powers /[town] pages.
export const TOWNS = [
  { slug: "lewisburg", name: "Lewisburg" },
  { slug: "chapel-hill", name: "Chapel Hill" },
  { slug: "cornersville", name: "Cornersville" },
  { slug: "petersburg", name: "Petersburg" },
  { slug: "belfast", name: "Belfast" },
] as const;

export const townNameToSlug = new Map<string, string>(
  TOWNS.map((t) => [t.name.toLowerCase(), t.slug]),
);
export const townSlugToName = new Map<string, string>(TOWNS.map((t) => [t.slug, t.name]));

// "/#..." items render as a plain <a> (HashLink) so the browser's own fragment
// jump moves keyboard focus into the section; <Link> only scrolls.
// `prefetch: false` stops every page from prefetching the full directory.
export const mainNav: { href: string; label: string; prefetch?: false }[] = [
  { href: "/businesses", label: "All Businesses", prefetch: false },
  { href: "/#visit", label: "Things to Do" },
  { href: "/#categories", label: "Categories" },
  { href: "/history", label: "History" },
  { href: "/about", label: "About" },
];
