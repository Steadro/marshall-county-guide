// schema.org structured-data builders. The LocalBusiness JSON-LD on each
// listing page is the directory's single biggest SEO lever (see schema/SCHEMA.md).

import type { BusinessDetail } from "@/lib/queries";
import { siteConfig } from "@/lib/site";
import { ensureHttp } from "@/lib/utils";
import { PLACES } from "@/lib/history";

// Refine schema.org @type by category slug; fall back to LocalBusiness.
const TYPE_BY_CATEGORY: Record<string, string> = {
  "restaurant-and-food": "Restaurant",
  "retail-and-shopping": "Store",
  "beauty-and-personal-care": "HealthAndBeautyBusiness",
  "health-and-medical": "MedicalBusiness",
  automotive: "AutomotiveBusiness",
  "home-and-trades": "HomeAndConstructionBusiness",
  "professional-services": "ProfessionalService",
  financial: "FinancialService",
  "real-estate": "RealEstateAgent",
  "fitness-and-recreation": "SportsActivityLocation",
  "childcare-and-education": "ChildCare",
  "arts-and-entertainment": "EntertainmentBusiness",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function schemaTypeForCategory(slug: string): string {
  return TYPE_BY_CATEGORY[slug] ?? "LocalBusiness";
}

export function businessUrl(slug: string): string {
  return `${siteConfig.url}/business/${slug}`;
}

/** Build the LocalBusiness JSON-LD object for a business detail page. */
export function buildBusinessJsonLd(b: BusinessDetail): Record<string, unknown> {
  const pageUrl = businessUrl(b.slug);

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: b.city,
    addressRegion: b.state,
    addressCountry: b.country,
  };
  if (b.streetAddress) address.streetAddress = b.streetAddress;
  if (b.postalCode) address.postalCode = b.postalCode;

  const sameAs = [b.facebookUrl, b.instagramUrl, b.twitterUrl, b.youtubeUrl]
    .map((u) => ensureHttp(u))
    .filter((u): u is string => Boolean(u));

  const openingHours = b.hours
    .filter((h) => !h.isClosed && h.opens && h.closes)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[h.dayOfWeek] ?? "Monday"}`,
      opens: h.opens,
      closes: h.closes,
    }));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaTypeForCategory(b.category.slug),
    "@id": `${pageUrl}#business`,
    name: b.name,
    address,
    // The directory page is the canonical web page describing this entity.
    mainEntityOfPage: pageUrl,
    // OG image doubles as the entity image.
    image: `${pageUrl}/opengraph-image`,
  };

  const description = b.description || b.shortDescription;
  if (description) jsonLd.description = description;
  if (b.legalName) jsonLd.legalName = b.legalName;

  const website = ensureHttp(b.website);
  jsonLd.url = website ?? pageUrl;

  if (b.phone) jsonLd.telephone = b.phone;
  if (b.priceRange) jsonLd.priceRange = b.priceRange;
  if (b.foundingYear) jsonLd.foundingDate = String(b.foundingYear);
  if (b.latitude != null && b.longitude != null) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: b.latitude,
      longitude: b.longitude,
    };
  }
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;
  if (openingHours.length > 0) jsonLd.openingHoursSpecification = openingHours;

  return jsonLd;
}

/** Website + organization JSON-LD for the homepage. */
export function buildSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      areaServed: siteConfig.region,
    },
    // Advertise the directory search so engines can offer a sitelinks searchbox.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/businesses?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * ItemList of the county and its towns as schema.org Place entities, carrying
 * the local-history copy as descriptions. Rendered on the homepage so the
 * History section is machine-readable (towns link to their directory pages).
 */
export function buildHistoryJsonLd(): Record<string, unknown> {
  const items = PLACES.map((p, i) => {
    const isCounty = p.key === "county";
    const place: Record<string, unknown> = {
      "@type": isCounty ? "AdministrativeArea" : "City",
      name: p.label,
      url: isCounty ? siteConfig.url : `${siteConfig.url}/${p.key}`,
      description: p.paragraphs.join(" "),
    };
    if (!isCounty) {
      place.containedInPlace = {
        "@type": "AdministrativeArea",
        name: "Marshall County, Tennessee",
      };
    }
    return { "@type": "ListItem", position: i + 1, item: place };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Marshall County, Tennessee and its towns",
    itemListElement: items,
  };
}

/** BreadcrumbList JSON-LD from [{name, url}] items. */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
