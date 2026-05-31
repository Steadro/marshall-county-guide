import Link from "next/link";
import { siteConfig, maintainer, TOWNS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/70 bg-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-serif text-xl font-semibold text-ink">{siteConfig.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            {siteConfig.tagline} Built to help neighbors find and support local businesses.
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            Designed and maintained by{" "}
            <a
              href={maintainer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-clay hover:text-clay-dark"
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
              <Link href="/businesses" className="text-ink-soft hover:text-clay">
                All businesses
              </Link>
            </li>
            <li>
              <Link href="/#categories" className="text-ink-soft hover:text-clay">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-ink-soft hover:text-clay">
                About this guide
              </Link>
            </li>
            <li>
              <Link href="/for-owners" className="text-ink-soft hover:text-clay">
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
                <Link href={`/${t.slug}`} className="text-ink-soft hover:text-clay">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-faint sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. A community directory for{" "}
            {siteConfig.region}.
          </p>
          <p>Details can change, so please confirm with each business before you visit.</p>
        </div>
      </div>
    </footer>
  );
}
