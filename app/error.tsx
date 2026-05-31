"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw, Home } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production, this is where you'd report to an error service.
  }, []);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-serif text-5xl font-semibold text-clay">Something went wrong</p>
      <p className="mt-4 max-w-md text-ink-soft">
        We hit a snag loading this page. It’s usually temporary, please try again.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-pill bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-dark"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-clay hover:text-clay"
        >
          <Home className="h-4 w-4" aria-hidden="true" /> Home
        </Link>
      </div>
    </div>
  );
}
