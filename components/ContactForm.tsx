"use client";

import { useState } from "react";
import { Send, CheckCircle2, Info } from "lucide-react";
import type { ContactTopic } from "@/lib/site";

const TOPIC_OPTIONS: { value: ContactTopic; label: string }[] = [
  { value: "update", label: "Update listing info" },
  { value: "add", label: "Add a missing business or service" },
  { value: "remove", label: "Remove a listing" },
  { value: "other", label: "Something else" },
];

// Message prompt tuned to the topic, so the field doesn't feel generic.
const MESSAGE_HINT: Record<ContactTopic, string> = {
  update: "What's changed? Hours, phone, address, website, a better description…",
  add: "Tell us the business or service name, the town, and anything else you know (website, phone, what they do).",
  remove: "Which listing? Please include a link to its Google or Facebook page showing it's permanently closed.",
  other: "How can we help?",
};

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm({
  initialTopic = "other",
  businessName = "",
  listingUrl = "",
}: {
  initialTopic?: ContactTopic;
  businessName?: string;
  listingUrl?: string;
}) {
  const [topic, setTopic] = useState<ContactTopic>(initialTopic);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          page: window.location.pathname + window.location.search,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Something went wrong. Please try again.");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-card bg-pine-soft/60 p-8 text-center ring-1 ring-pine-line">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pine text-white">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-serif text-xl font-semibold text-ink">Thanks, message sent.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          We read every message and act on it quickly. If it needs a reply, we&apos;ll get back to
          you at the email you gave.
        </p>
      </div>
    );
  }

  const labelClass = "block text-sm font-medium text-ink";
  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="topic" className={labelClass}>
          What's this about?
        </label>
        <select
          id="topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          className={fieldClass}
        >
          {TOPIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {topic === "remove" ? (
        <div className="flex items-start gap-2 rounded-xl bg-gold-soft/50 px-4 py-3 text-sm leading-relaxed text-gold-dark ring-1 ring-gold/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            We can only remove a business when its official Google, Facebook, or other business
            page clearly shows it as permanently closed. This protects legitimate businesses from
            removal requests by people who don&apos;t own them. Please include a link to that page
            below.
          </span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Your name
          </label>
          <input id="name" name="name" type="text" required autoComplete="name" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Your email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="businessName" className={labelClass}>
          Business or place name <span className="font-normal text-ink-faint">(optional)</span>
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          defaultValue={businessName}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={MESSAGE_HINT[topic]}
          className={`${fieldClass} resize-y`}
        />
      </div>

      {/* Pass the listing URL through when the form was opened from a business page. */}
      <input type="hidden" name="listingUrl" defaultValue={listingUrl} />

      {/* Honeypot: hidden from people, irresistible to bots. Not submitted by real users. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" ? (
        <p role="alert" className="text-sm font-medium text-clay-dark">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 rounded-pill bg-pine px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
