import type { Metadata } from "next";
import { FileText, Trash2, MessageCircle, Mail } from "lucide-react";
import { siteConfig, ownerMailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "For Business Owners",
  description: `Run a business listed on ${siteConfig.name}? Update your photo or details, or ask to be removed. No account needed.`,
  alternates: { canonical: "/for-owners" },
};

const ACTIONS = [
  {
    Icon: FileText,
    title: "Update my information",
    body: "Hours, phone, address, website, description — tell us what's changed.",
    subject: "Listing information update",
  },
  {
    Icon: Trash2,
    title: "Remove my listing",
    body: "Prefer not to be listed? We'll take your business down, no questions asked.",
    subject: "Listing removal request",
  },
  {
    Icon: MessageCircle,
    title: "Something else",
    body: "A correction, a question, or anything we didn't cover here.",
    subject: "Question about my listing",
  },
] as const;

export default function ForOwnersPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-clay">
        For business owners
      </p>
      <h1 className="text-balance text-4xl sm:text-5xl">Is this your business?</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a free community guide. We build listings from publicly available
        information to help neighbors find and support local businesses. If one of these is yours,
        you’re in control of it, no account required. Pick what you need below and it opens a
        prefilled email to us. We read every message and act on it quickly.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {ACTIONS.map(({ Icon, title, body, subject }) => (
          <a
            key={subject}
            href={ownerMailto(subject)}
            className="group flex flex-col gap-3 rounded-card bg-card p-6 shadow-soft ring-1 ring-line/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-soft text-clay-dark transition-colors group-hover:bg-clay group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-semibold text-ink">{title}</span>
            <span className="text-sm leading-relaxed text-ink-soft">{body}</span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-clay group-hover:text-clay-dark">
              <Mail className="h-4 w-4" aria-hidden="true" /> Email us
            </span>
          </a>
        ))}
      </div>

      <div className="mt-12 rounded-card border border-line bg-paper-2/60 p-6 text-sm leading-relaxed text-ink-soft">
        <p>
          <span className="font-semibold text-ink">How this works:</span> there’s no login or signup.
          Every option above just opens an email to us with the details we need. Removal requests are
          honored promptly, and we’re always glad to feature a better photo or fresh information you
          send our way.
        </p>
      </div>
    </div>
  );
}
