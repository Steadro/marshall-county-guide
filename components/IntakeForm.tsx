"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { TOWNS } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error";

// Towns to offer in the dropdown + an escape hatch for the rest of the county.
const TOWN_OPTIONS = [...TOWNS.map((t) => t.name), "Somewhere else in Marshall County"];

export function IntakeForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/intake", {
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
        <h2 className="mt-4 font-serif text-xl font-semibold text-ink">Got it, thank you.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          We&apos;ll review your business and add it to the guide. If we need anything else, we&apos;ll
          reach out at the email you gave. No account, no fee.
        </p>
      </div>
    );
  }

  const labelClass = "block text-sm font-medium text-ink";
  const optional = <span className="font-normal text-ink-faint">(optional)</span>;
  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-soft outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="businessName" className={labelClass}>
          Business name
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          autoComplete="organization"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="businessType" className={labelClass}>
          What kind of business is it?
        </label>
        <input
          id="businessType"
          name="businessType"
          type="text"
          required
          placeholder="e.g. restaurant, auto repair, hair salon, church, accountant"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="streetAddress" className={labelClass}>
            Street address
          </label>
          <input
            id="streetAddress"
            name="streetAddress"
            type="text"
            required
            autoComplete="street-address"
            placeholder="123 Commerce St"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            Town
          </label>
          <select id="city" name="city" defaultValue={TOWNS[0].name} className={fieldClass}>
            {TOWN_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone {optional}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="website" className={labelClass}>
            Public listing link{" "}
            <span className="font-normal text-ink-faint">(Google, Facebook, Yelp, or website)</span>
          </label>
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="e.g. your Google or Facebook page"
            className={fieldClass}
          />
        </div>
      </div>

      <hr className="border-line/70" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="submitterName" className={labelClass}>
            Your name {optional}
          </label>
          <input
            id="submitterName"
            name="submitterName"
            type="text"
            autoComplete="name"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="submitterEmail" className={labelClass}>
            Your email {optional}
          </label>
          <input
            id="submitterEmail"
            name="submitterEmail"
            type="email"
            autoComplete="email"
            placeholder="So we can follow up if needed"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Anything else? {optional}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Hours, what you're known for, a good photo we could use, whether you own the business…"
          className={`${fieldClass} resize-y`}
        />
      </div>

      {/* Honeypot: hidden from people, irresistible to bots. Named so it isn't the
          real "website" field above. Real users never fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="homepage">Leave this field empty</label>
        <input id="homepage" name="homepage" type="text" tabIndex={-1} autoComplete="off" />
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
        {status === "sending" ? "Sending…" : "Add my business"}
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="text-xs leading-relaxed text-ink-faint">
        {`This is a free community guide. Submitting doesn't make a listing official or affiliated — it just reaches the person who keeps the guide.`}
      </p>
    </form>
  );
}
