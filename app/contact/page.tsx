import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { siteConfig, type ContactTopic } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Update a listing, add a missing business or service, or send a note to ${siteConfig.name}. No account needed.`,
  alternates: { canonical: "/contact" },
};

const TOPICS: ContactTopic[] = ["update", "add", "remove", "other"];

const HEADINGS: Record<ContactTopic, { eyebrow: string; title: string; blurb: string }> = {
  update: {
    eyebrow: "Update a listing",
    title: "Keep your listing accurate",
    blurb:
      "Hours, phone, address, website, a better description. Tell us what's changed and we'll update it. No account, no login.",
  },
  add: {
    eyebrow: "Add a listing",
    title: "Add a missing business or service",
    blurb:
      "Know a local business, service, or office that isn't here yet? Send us the details and we'll get it added.",
  },
  remove: {
    eyebrow: "Remove a listing",
    title: "Ask us to remove a listing",
    blurb:
      "To protect businesses from bad-faith requests, we remove a listing only when its official Google or Facebook page shows it's permanently closed. Tell us which listing and link that page.",
  },
  other: {
    eyebrow: "Get in touch",
    title: "Send us a message",
    blurb:
      "A correction, a question, or anything else about the guide. We read every message and act on it quickly.",
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; business?: string; listing?: string }>;
}) {
  const sp = await searchParams;
  const topic: ContactTopic = TOPICS.includes(sp.topic as ContactTopic)
    ? (sp.topic as ContactTopic)
    : "other";
  const h = HEADINGS[topic];

  return (
    <div className="container-page max-w-2xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">{h.eyebrow}</p>
      <h1 className="text-balance text-4xl sm:text-5xl">{h.title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">{h.blurb}</p>

      <div className="mt-10">
        <ContactForm
          initialTopic={topic}
          businessName={sp.business ?? ""}
          listingUrl={sp.listing ?? ""}
        />
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-faint">
        {siteConfig.name} is a free community guide. Sending a message here doesn&apos;t make a
        listing official or affiliated. It just reaches the person who keeps the guide.
      </p>
    </div>
  );
}
