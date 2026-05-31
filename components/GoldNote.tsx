import { cn } from "@/lib/utils";

/**
 * A small, low-emphasis legend explaining the gold tint on listing cards.
 * Render it only when at least one gold-standard listing is visible.
 */
export function GoldNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs leading-relaxed text-ink-faint", className)}>
      <span
        aria-hidden="true"
        className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gold-soft ring-1 ring-gold/40"
      />
      <span>
        Listings with a soft gold tint are gold-standard: ones we&apos;ve researched in depth and are
        fairly confident the hours and details are current.
      </span>
    </p>
  );
}
