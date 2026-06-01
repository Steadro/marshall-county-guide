import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance text-2xl sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-pretty leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-pill border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-pine hover:text-pine sm:self-auto"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
