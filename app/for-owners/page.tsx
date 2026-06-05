import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Trash2, MessageCircle, Plus, ArrowRight } from "lucide-react";
import { siteConfig, contactHref, addBusinessPath } from "@/lib/site";

export const metadata: Metadata = {
  title: "For Business Owners & Governments",
  description: `Run a business, service, or local office listed on ${siteConfig.name}? Update your details, add a missing listing, or ask to be removed. No account needed.`,
  alternates: { canonical: "/for-owners" },
};

const ACTIONS: {
  Icon: typeof FileText;
  title: string;
  body: string;
  href: string;
  cta: string;
}[] = [
  {
    Icon: FileText,
    title: "Update my information",
    body: "Hours, phone, address, website, description. Tell us what's changed.",
    href: contactHref({ topic: "update" }),
    cta: "Open the form",
  },
  {
    Icon: Plus,
    title: "Add a missing listing",
    body: "A business, service, or office that isn't here yet? Send us the details.",
    href: addBusinessPath,
    cta: "Add a business",
  },
  {
    Icon: Trash2,
    title: "Remove my listing",
    body: "Prefer not to be listed? We'll take your listing down, no questions asked.",
    href: contactHref({ topic: "remove" }),
    cta: "Open the form",
  },
  {
    Icon: MessageCircle,
    title: "Something else",
    body: "A correction, a question, or anything we didn't cover here.",
    href: contactHref({ topic: "other" }),
    cta: "Open the form",
  },
];

export default function ForOwnersPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        For business owners &amp; governments
      </p>
      <h1 className="text-balance text-4xl sm:text-5xl">Is this your listing?</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a free community guide. We build listings from publicly available
        information to help neighbors find local businesses, services, and offices. If one of these
        is yours, you’re in control of it, no account required. Pick what you need below and it opens
        a short form. We read every message and act on it quickly.
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
          <span className="font-semibold text-ink">How this works:</span> there’s no login or signup.
          Every option above opens a short form that comes straight to us. Removal requests are
          honored promptly, and we’re always glad to feature a better photo or fresh information you
          send our way.
        </p>
      </div>
    </div>
  );
}
