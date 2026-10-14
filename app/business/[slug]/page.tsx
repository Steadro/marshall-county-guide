import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Globe, MapPin, Clock, ChevronRight, ExternalLink, Info, Ban } from "lucide-react";
import { getBusinessBySlug, getAllBusinessSlugs } from "@/lib/queries";
import { CategoryTag } from "@/components/CategoryTag";
import { MapEmbed } from "@/components/MapEmbed";
import { JsonLd } from "@/components/JsonLd";
import { AdminEditLink } from "@/components/admin/AdminEditLink";
import { buildBusinessJsonLd, buildBreadcrumbJsonLd, businessUrl } from "@/lib/schema-org";
import { siteConfig, townNameToSlug, contactHref, pageMetadata } from "@/lib/site";
import { formatPhone, telHref, prettyUrl, ensureHttp, formatTime12h } from "@/lib/utils";

// Slugs published after the last deploy render on first request (then ISR),
// instead of 404ing until the next build. Unknown slugs still 404 via notFound().
export const revalidate = 3600;

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

  const title = b.metaTitle ?? `${b.name} in ${b.city}, ${b.state}`;
  return pageMetadata({
    title: b.status === "CLOSED" ? `${title} (permanently closed)` : title,
    description: b.metaDescription ?? fallbackDesc,
    path: `/business/${b.slug}`,
    image: false, // this route has its own opengraph-image
  });
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const monthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "America/Chicago",
});

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
  const closed = b.status === "CLOSED";

  // Map: precise pin if the business is geocoded, otherwise a wider view of the
  // town so every listing still gets a map.
  const precise = b.latitude != null && b.longitude != null;
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${b.name} ${b.city} ${b.state}`,
  )}`;

  // New, unreviewed listings (fresh intake/seed) get a small "needs data" notice
  // inviting the community to help fill them in.
  const needsData = b.qualityTier === "UNREVIEWED" && !closed;
  const checked = b.lastVerifiedAt ? monthYear.format(b.lastVerifiedAt) : null;

  return (
    <article className="pb-12">
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

          {closed ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-paper-2 px-3 py-2 text-sm font-medium leading-relaxed text-ink ring-1 ring-line-strong">
              <Ban className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
              <span>
                Permanently closed. This page stays up so old links still explain what happened.{" "}
                <Link
                  href={`/category/${b.category.slug}`}
                  className="text-pine underline underline-offset-2 hover:text-pine-dark"
                >
                  Find other {b.category.name.toLowerCase()} nearby
                </Link>
                .
              </span>
            </p>
          ) : null}

          {needsData ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-paper-2 px-3 py-2 text-sm leading-relaxed text-ink-soft ring-1 ring-line">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              <span>
                This is a new listing and likely requires additional data.{" "}
                <Link
                  href={contactHref({ topic: "update", business: { name: b.name, slug: b.slug } })}
                  className="font-medium text-pine underline underline-offset-2 hover:text-pine-dark"
                >
                  Know this place? Help fill it in.
                </Link>
              </span>
            </p>
          ) : null}

          {/* Primary actions (none for a closed business) */}
          {!closed && (websiteHref || phoneLink) ? (
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
              <ul className="mt-4 divide-y divide-line/60 overflow-hidden rounded-card bg-card text-sm ring-1 ring-line/70">
                {addressLine ? (
                  <li className="flex gap-3 px-5 py-3.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    <span className="sr-only">Address: </span>
                    <span className="text-ink-soft">{addressLine}</span>
                  </li>
                ) : null}
                {phoneDisplay ? (
                  <li className="flex gap-3 px-5 py-3.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    <span className="sr-only">Phone: </span>
                    {phoneLink ? (
                      <a href={phoneLink} className="text-ink hover:text-pine">{phoneDisplay}</a>
                    ) : (
                      <span className="text-ink-soft">{phoneDisplay}</span>
                    )}
                  </li>
                ) : null}
                {websiteHref ? (
                  <li className="flex gap-3 px-5 py-3.5">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-pine" aria-hidden="true" />
                    <span className="sr-only">Website: </span>
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-ink hover:text-pine"
                    >
                      {websiteLabel}
                    </a>
                  </li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {/* Hours */}
          {b.hours.length > 0 && !closed ? (
            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-pine" aria-hidden="true" /> Hours
                <span className="text-xs font-normal text-ink-faint">Central Time</span>
              </h2>
              <dl className="mt-4 divide-y divide-line/70 overflow-hidden rounded-card bg-card ring-1 ring-line/70">
                {b.hours.map((h, i) => (
                  <div key={i} className="flex justify-between px-5 py-2.5 text-sm">
                    <dt className="text-ink-soft">{DAY_NAMES[h.dayOfWeek]}</dt>
                    <dd className="font-medium text-ink">
                      {h.isClosed
                        ? "Closed"
                        : `${formatTime12h(h.opens)} – ${formatTime12h(h.closes)}`}
                    </dd>
                  </div>
                ))}
              </dl>
              {b.hoursNote ? <p className="mt-2 text-sm text-ink-faint">{b.hoursNote}</p> : null}
            </section>
          ) : null}

          {/* Map (precise pin, or a town-level view as a fallback) */}
          {!closed ? (
            <section className="mt-10">
              <h2 className="mb-4 text-xl">Location</h2>
              <MapEmbed
                query={precise ? `${b.latitude},${b.longitude}` : `${b.city}, ${b.state}`}
                zoom={precise ? 15 : 13}
                title={precise ? `Map showing ${b.name}` : `Map of ${b.city}, ${b.state}`}
              />
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
                    className="font-medium text-pine underline underline-offset-2 hover:text-pine-dark"
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

          {/* Footnote: owner / accuracy note */}
          <div className="mt-12 space-y-3 border-t border-line/70 pt-6 text-xs leading-relaxed">
            {checked || b.status === "UNVERIFIED" ? (
              <p className="text-ink-soft">
                {[
                  checked ? `Details last checked ${checked}.` : null,
                  b.status === "UNVERIFIED" ? "Not yet confirmed with the business." : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            ) : null}
            <p className="text-ink-faint">
              Details can change, so please confirm with the business before you visit. Is this your
              business?{" "}
              <Link
                href={contactHref({ topic: "update", business: { name: b.name, slug: b.slug } })}
                className="font-medium text-pine underline underline-offset-2 hover:text-pine-dark"
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
