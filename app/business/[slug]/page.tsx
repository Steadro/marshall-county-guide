import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Globe, MapPin, Clock, ChevronRight, ExternalLink } from "lucide-react";
import { getBusinessBySlug, getAllBusinessSlugs } from "@/lib/queries";
import { Badge } from "@/components/Badge";
import { CategoryTag } from "@/components/CategoryTag";
import { LocationMap } from "@/components/LocationMap";
import { JsonLd } from "@/components/JsonLd";
import { AdminEditLink } from "@/components/admin/AdminEditLink";
import { buildBusinessJsonLd, buildBreadcrumbJsonLd, businessUrl } from "@/lib/schema-org";
import { siteConfig, townNameToSlug, townCentroidByName, contactHref } from "@/lib/site";
import { formatPhone, telHref, prettyUrl, ensureHttp } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllBusinessSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);
  if (!b) return { title: "Business not found" };

  const fallbackDesc =
    b.shortDescription ||
    b.description?.slice(0, 155) ||
    `${b.name}, ${b.category.name} in ${b.city}, ${b.state}.`;

  return {
    title: b.metaTitle ?? `${b.name} in ${b.city}, ${b.state}`,
    description: b.metaDescription ?? fallbackDesc,
    alternates: { canonical: `/business/${b.slug}` },
    openGraph: {
      type: "website",
      title: b.metaTitle ?? `${b.name} in ${b.city}, ${b.state}`,
      description: b.metaDescription ?? fallbackDesc,
      url: businessUrl(b.slug),
    },
  };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);
  if (!b) notFound();

  const phoneDisplay = formatPhone(b.phone);
  const phoneLink = telHref(b.phone);
  const websiteHref = ensureHttp(b.website);
  const websiteLabel = prettyUrl(b.website);
  const townSlug = townNameToSlug.get(b.city.toLowerCase());

  const addressLine = [b.streetAddress, [b.city, b.state].filter(Boolean).join(", "), b.postalCode]
    .filter(Boolean)
    .join(" · ");

  const socials = [
    { href: ensureHttp(b.facebookUrl), label: "Facebook" },
    { href: ensureHttp(b.instagramUrl), label: "Instagram" },
    { href: ensureHttp(b.twitterUrl), label: "Twitter / X" },
    { href: ensureHttp(b.youtubeUrl), label: "YouTube" },
  ].filter((s) => s.href);

  const hasContact = phoneLink || websiteHref || b.streetAddress;

  // Map: precise pin if the business is geocoded, otherwise a wider town-level
  // view centered on the town centroid so every listing still gets a map.
  const precise = b.latitude != null && b.longitude != null;
  const centroid = townCentroidByName.get(b.city.toLowerCase());
  const mapPoint = precise
    ? { latitude: b.latitude as number, longitude: b.longitude as number, name: b.name, city: b.city }
    : centroid
      ? { latitude: centroid.lat, longitude: centroid.lng, name: `${b.city}, ${b.state}` }
      : null;
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${b.name} ${b.city} ${b.state}`,
  )}`;

  const isGold = b.qualityTier === "GOLD";

  return (
    <article className="relative isolate pb-12">
      {/* Gold-standard listings get a soft gold wash that bleeds down from the top.
          Explained in plain language in the footnotes at the bottom of the page. */}
      {isGold ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-gold-soft via-gold-soft/40 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
          />
        </>
      ) : null}
      <JsonLd data={buildBusinessJsonLd(b)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: siteConfig.url },
          { name: "Businesses", url: `${siteConfig.url}/businesses` },
          { name: b.category.name, url: `${siteConfig.url}/category/${b.category.slug}` },
          { name: b.name, url: businessUrl(b.slug) },
        ])}
      />

      <div className="container-page">
        <div className="mx-auto max-w-2xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 py-5 text-sm text-ink-faint"
          >
            <Link href="/" className="hover:text-pine">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href="/businesses" className="hover:text-pine">Businesses</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link href={`/category/${b.category.slug}`} className="hover:text-pine">
              {b.category.name}
            </Link>
          </nav>

          {/* Admin-only: jump straight to this listing's editor. Renders nothing
              for the public (client-gated; the target is server-protected). */}
          <AdminEditLink businessId={b.id} />

          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/category/${b.category.slug}`}>
              <CategoryTag name={b.category.name} slug={b.category.slug} />
            </Link>
            {b.priceRange ? <Badge>{b.priceRange}</Badge> : null}
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl">{b.name}</h1>
          {b.legalName && b.legalName !== b.name ? (
            <p className="mt-1 text-sm text-ink-faint">{b.legalName}</p>
          ) : null}

          <p className="mt-2 inline-flex items-center gap-1.5 text-ink-soft">
            <MapPin className="h-4 w-4 text-pine" aria-hidden="true" />
            {townSlug ? (
              <Link href={`/${townSlug}`} className="hover:text-pine">
                {b.city}, {b.state}
              </Link>
            ) : (
              <span>
                {b.city}, {b.state}
              </span>
            )}
          </p>

          {/* Primary actions */}
          {websiteHref || phoneLink ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-pill bg-pine px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pine-dark"
                >
                  Visit website
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
              {phoneLink ? (
                <a
                  href={phoneLink}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" /> Call
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Description */}
          {b.shortDescription ? (
            <p className="mt-8 text-lg leading-relaxed text-ink">{b.shortDescription}</p>
          ) : null}
          {b.description ? (
            <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">
              {b.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}
          {!b.shortDescription && !b.description ? (
            <p className="mt-8 text-ink-soft">
              {b.category.name} in {b.city}, {b.state}.
            </p>
          ) : null}

          {/* Details */}
          {hasContact ? (
            <section className="mt-10">
              <h2 className="text-xl">Details</h2>
              <dl className="mt-4 divide-y divide-line/60 overflow-hidden rounded-card bg-card text-sm ring-1 ring-line/70">
                {addressLine ? (
                  <div className="flex gap-3 px-5 py-3.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    <span className="text-ink-soft">{addressLine}</span>
                  </div>
                ) : null}
                {phoneDisplay ? (
                  <div className="flex gap-3 px-5 py-3.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    {phoneLink ? (
                      <a href={phoneLink} className="text-ink hover:text-pine">{phoneDisplay}</a>
                    ) : (
                      <span className="text-ink-soft">{phoneDisplay}</span>
                    )}
                  </div>
                ) : null}
                {websiteHref ? (
                  <div className="flex gap-3 px-5 py-3.5">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-ink hover:text-pine"
                    >
                      {websiteLabel}
                    </a>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {/* Hours */}
          {b.hours.length > 0 ? (
            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-pine" aria-hidden="true" /> Hours
              </h2>
              <dl className="mt-4 divide-y divide-line/70 overflow-hidden rounded-card bg-card ring-1 ring-line/70">
                {b.hours.map((h, i) => (
                  <div key={i} className="flex justify-between px-5 py-2.5 text-sm">
                    <dt className="text-ink-soft">{DAY_NAMES[h.dayOfWeek]}</dt>
                    <dd className="font-medium text-ink">
                      {h.isClosed ? "Closed" : `${h.opens} – ${h.closes}`}
                    </dd>
                  </div>
                ))}
              </dl>
              {b.hoursNote ? <p className="mt-2 text-sm text-ink-faint">{b.hoursNote}</p> : null}
            </section>
          ) : null}

          {/* Map (precise pin, or a town-level view as a fallback) */}
          {mapPoint ? (
            <section className="mt-10">
              <h2 className="mb-4 text-xl">Location</h2>
              <LocationMap points={[mapPoint]} zoom={precise ? 15 : 13} />
              {precise ? (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:text-pine-dark"
                >
                  Get directions
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-ink-faint">
                  {b.streetAddress
                    ? `Showing the ${b.city} area for now while we pin down the exact spot.`
                    : `A street address isn’t listed, so the map shows ${b.city}, ${b.state}.`}{" "}
                  <a
                    href={mapsSearch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-pine hover:text-pine-dark"
                  >
                    Find on Google Maps
                  </a>
                  .
                </p>
              )}
            </section>
          ) : null}

          {/* Social */}
          {socials.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-xl">Find them online</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map(({ href, label }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-pill bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-pine hover:text-white"
                  >
                    {label}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {/* Footnotes: gold-standard explainer (explains the gold wash up top) + owner note */}
          <div className="mt-12 space-y-3 border-t border-line/70 pt-6 text-xs leading-relaxed">
            {isGold ? (
              <p className="flex items-start gap-2 text-gold-dark">
                <span
                  aria-hidden="true"
                  className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gold ring-1 ring-gold/40"
                />
                <span>
                  <span className="font-semibold">Gold-standard listing.</span> The gold at the top
                  of the page marks listings we&apos;ve researched in depth and are fairly confident
                  the hours and details are current. Still worth a quick confirm before you go.
                </span>
              </p>
            ) : null}
            <p className="text-ink-faint">
              Details can change, so please confirm with the business before you visit. Is this your
              business?{" "}
              <Link
                href={contactHref({ topic: "update", business: { name: b.name, slug: b.slug } })}
                className="font-medium text-pine hover:text-pine-dark"
              >
                Update or remove this listing.
              </Link>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
