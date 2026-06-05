"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { addBusinessPath } from "@/lib/site";

// Temporary acquisition banner shown under the header while we're actively
// soliciting listings on Facebook/Nextdoor. Retire it by setting
// NEXT_PUBLIC_SHOW_INTAKE_CTA="false" in the environment (no code change).
//
// NEXT_PUBLIC_* is inlined at build time, so the flag is read at module scope.
// Default: shown (only an explicit "false" hides it).
const ENABLED = process.env.NEXT_PUBLIC_SHOW_INTAKE_CTA !== "false";

const DISMISS_KEY = "mcg-intake-cta-dismissed";

export function IntakeCta() {
  const pathname = usePathname();
  // Render nothing until mounted so the dismissed state (localStorage) doesn't
  // flash the banner on hydration.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setShow(true);
  }, []);

  if (!ENABLED || !show) return null;
  // Don't nag people who are already on the form, or inside admin.
  if (pathname === addBusinessPath || pathname.startsWith("/admin")) return null;

  return (
    <div className="border-b border-pine-line/60 bg-pine-soft/70">
      <div className="container-page relative flex items-center justify-center gap-x-3 gap-y-1 py-2.5 pr-8 text-center max-sm:flex-col">
        <p className="text-sm text-pine-ink">
          <span className="font-semibold">Own a business in Marshall County?</span>{" "}
          Get listed free — it takes a minute.
        </p>
        <Link
          href={addBusinessPath}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-pine px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition hover:bg-pine-dark"
        >
          Add your business
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
          aria-label="Dismiss"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-pine-ink/60 transition hover:bg-pine/10 hover:text-pine-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
