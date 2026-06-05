import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Plus, ArrowRight } from "lucide-react";
import { siteConfig, addBusinessPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add or fix a listing",
  description: `Add a missing business or report a problem with a listing on ${siteConfig.name}. No account needed.`,
  alternates: { canonical: "/for-owners" },
};

const ACTIONS: {
  Icon: typeof Plus;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    Icon: Plus,
    title: "Add a place",
    body: "A local business, service, or office that isn't on the guide yet? Send us the details.",
    href: addBusinessPath,
    cta: "Add a place",
  },
  {
    Icon: MessageCircle,
    title: "Report a problem",
    body: "Wrong hours, a closed business, a correction, or anything else off? Let us know.",
    href: "/contact",
    cta: "Report a problem",
  },
];

export default function ForOwnersPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        For business owners &amp; governments
      </p>
      <h1 className="text-balance text-4xl sm:text-5xl">Add or fix a listing</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a free community guide. We build listings from publicly available
        information to help neighbors find local businesses, services, and offices.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ACTIONS.map(({ Icon, title, body, href, cta }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-3 rounded-card bg-card p-6 shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-soft text-pine-dark transition-colors group-hover:bg-pine group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-semibold text-ink">{title}</span>
            <span className="text-sm leading-relaxed text-ink-soft">{body}</span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-pine group-hover:text-pine-dark">
              {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-card border border-line bg-paper-2/60 p-6 text-sm leading-relaxed text-ink-soft">
        <p>
          <span className="font-semibold text-ink">How this works:</span> no login or signup. Both
          options above open a short form that comes straight to us, and we read every message.
        </p>
      </div>
    </div>
  );
}
