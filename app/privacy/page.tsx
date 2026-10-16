import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: `What ${siteConfig.name} collects when you browse or send us a form, who handles it, and how to have it removed.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">Privacy</p>
      <h1 className="text-balance text-4xl">What we collect, and what we don&apos;t</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        Browsing the guide doesn&apos;t require an account, and we don&apos;t sell or share anything
        for advertising. Here&apos;s the full picture.
      </p>

      <div className="mt-10 space-y-8 leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-xl text-ink">When you browse</h2>
          <p className="mt-2">
            We count visits with Vercel Web Analytics, which doesn&apos;t use cookies or track you
            across sites; we only see totals like page views and referring sites, and what you
            type into search is left out. Maps on listing and category pages are loaded from
            Google Maps, so Google receives your IP address and may set its own cookies under{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              Google&apos;s privacy policy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">When you send us a form</h2>
          <p className="mt-2">
            The &ldquo;Report a problem&rdquo;, &ldquo;Make a suggestion&rdquo;, and &ldquo;Add a
            place&rdquo; forms save what you type: your name and email if you give them, your
            message, and any business details. We also store a one-way hash of your IP address
            (never the address itself) so we can spot spam. We use this only to update the guide
            and, if you asked, to reply to you.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Who handles it</h2>
          <p className="mt-2">
            The site runs on Vercel, listings and form submissions are stored in a Neon database,
            and new submissions are emailed to the maintainer through n8n and Resend. When we
            research and write up a listing, submissions may be processed with AI assistance from
            Anthropic&apos;s Claude. We don&apos;t share your information with anyone else.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Getting something removed</h2>
          <p className="mt-2">
            To have a submission you sent deleted, ask through the{" "}
            <Link href="/contact" className="text-pine underline underline-offset-2 hover:text-pine-dark">
              contact form
            </Link>
            . Business owners can ask to correct or remove a listing the same way.
          </p>
        </section>

        <p className="text-sm text-ink-faint">Last updated October 15, 2026.</p>
      </div>
    </div>
  );
}
