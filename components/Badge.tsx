import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "clay" | "forest";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-paper-2 text-ink-soft ring-1 ring-line",
  clay: "bg-clay-soft text-clay-dark ring-1 ring-clay/20",
  forest: "bg-forest-soft text-forest ring-1 ring-forest/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
