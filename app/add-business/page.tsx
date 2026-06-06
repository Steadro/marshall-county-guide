import type { Metadata } from "next";
import { IntakeForm } from "@/components/IntakeForm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add Your Business",
  description: `Own or run a business, service, or office in Marshall County, TN? Add it to ${siteConfig.name} for free. No account, no fee — just a few details.`,
  alternates: { canonical: "/add-business" },
};

export default function AddBusinessPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
        Add a listing
      </p>
      <h1 className="text-balance text-4xl sm:text-5xl">Add a business or service to the directory</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a free directory of the businesses and services of Marshall County. If
        we&apos;re missing your business, or a service you think belongs here, please let us know.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-faint">
        To keep the guide trustworthy, we like to see a link to your Google, Facebook, or website so
        we can confirm you&apos;re a real, active business. Not online yet? Tell us in the form and
        we&apos;ll find another way to verify.
      </p>

      <div className="mt-10">
        <IntakeForm />
      </div>
    </div>
  );
}
