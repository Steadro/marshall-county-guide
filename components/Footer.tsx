import Link from "next/link";
import { siteConfig, maintainer, TOWNS } from "@/lib/site";

// Photo attribution for the homepage imagery. Public domain needs no credit;
// CC BY / CC BY-SA require author + license, satisfied here.
const PHOTO_CREDITS = [
  {
    label: "Apple pie",
    author: "W. Carter",
    license: "CC0",
    href: "https://commons.wikimedia.org/wiki/File:Apple_cake_with_vanilla_ice_cream_2.jpg",
    licenseHref: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    label: "Tennessee pasture",
    author: "Brian Stansberry",
    license: "CC BY 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Gordonsville-fields-tn1.jpg",
    licenseHref: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    label: "Lewisburg square & courthouse",
    author: "Ichabod",
    license: "CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Lewisburg_Tennessee_square.jpg",
    licenseHref: "https://creativecommons.org/licenses/by-sa/3.0/",
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-serif text-xl font-semibold text-ink">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            {siteConfig.tagline} Built to help neighbors find and support local businesses and
            services.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            Designed and maintained by{" "}
            <a
              href={maintainer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-pine hover:text-pine-dark"
            >
              {maintainer.name}
            </a>
            , {maintainer.note}.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Explore
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/businesses" className="text-ink-soft hover:text-pine">
                All businesses
              </Link>
            </li>
            <li>
              <Link href="/#categories" className="text-ink-soft hover:text-pine">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/history" className="text-ink-soft hover:text-pine">
                Local history
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-ink-soft hover:text-pine">
                About this guide
              </Link>
            </li>
            <li>
              <Link href="/for-owners" className="text-ink-soft hover:text-pine">
                For business owners
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Towns</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {TOWNS.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.slug}`} className="text-ink-soft hover:text-pine">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container-page py-6 text-xs text-ink-faint">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} {siteConfig.name}. A community directory for{" "}
              {siteConfig.region}.
            </p>
            <p>Details can change, so please confirm with each business before you visit.</p>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-faint/80">
            Photos via Wikimedia Commons:{" "}
            {PHOTO_CREDITS.map((c, i) => (
              <span key={c.label}>
                {i > 0 ? "; " : ""}
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-2 hover:text-ink-soft"
                >
                  {c.label}
                </a>{" "}
                ({c.author},{" "}
                <a
                  href={c.licenseHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-line underline-offset-2 hover:text-ink-soft"
                >
                  {c.license}
                </a>
                )
              </span>
            ))}
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
