import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "pine" | "creek";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-paper-2 text-ink-soft ring-1 ring-line",
  pine: "bg-pine-soft text-pine-dark ring-1 ring-pine/20",
  creek: "bg-creek-soft text-creek-dark ring-1 ring-creek/20",
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
