import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-serif text-6xl font-semibold text-pine">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl">We couldn’t find that page.</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The listing may have moved or the link might be off. Try browsing the directory instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-pill bg-pine px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pine-dark"
        >
          <Home className="h-4 w-4" aria-hidden="true" /> Home
        </Link>
        <Link
          href="/businesses"
          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-pine hover:text-pine"
        >
          <Search className="h-4 w-4" aria-hidden="true" /> Browse businesses
        </Link>
      </div>
    </div>
  );
}
