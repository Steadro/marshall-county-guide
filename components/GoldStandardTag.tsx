"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

const EXPLAINER =
  "Gold standard: we've gathered a good amount of detail on this business and are fairly " +
  "confident the hours and contact info are accurate. Still worth a quick confirm before you go.";

/**
 * Small "Gold standard" pill for the business page header, with a hover/focus
 * tooltip explaining what the metric means. State-driven (rather than a CSS
 * group variant) so it reliably shows on both mouse hover and keyboard focus.
 */
export function GoldStandardTag({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className ?? ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-label={EXPLAINER}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex cursor-help items-center gap-1 rounded-pill bg-gold-soft px-2.5 py-0.5 text-xs font-semibold text-gold-dark outline-none ring-1 ring-gold/30 focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Gold standard
      </span>
      {open ? (
        <span
          role="tooltip"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-lg bg-ink px-3 py-2 text-xs leading-relaxed text-paper shadow-lift"
        >
          {EXPLAINER}
        </span>
      ) : null}
    </span>
  );
}
