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
      <h1 className="text-balance text-4xl sm:text-5xl">Add your business to the guide</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        {siteConfig.name} is a free guide to the local businesses and services of Marshall County.
        If yours isn&apos;t here yet, tell us a few basics and we&apos;ll build your listing. No
        account, no fee.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-faint">
        To keep the guide trustworthy, we add businesses we can verify are real — please include a
        public listing link (Google, Facebook, Yelp, or a website). Not online yet? Add a note in
        the form and we&apos;ll follow up to confirm.
      </p>

      <div className="mt-10">
        <IntakeForm />
      </div>
    </div>
  );
}
