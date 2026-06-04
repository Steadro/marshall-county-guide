"use client";

import { useActionState } from "react";
import { updateBusiness, type SaveState } from "@/app/admin/actions";

interface BusinessForm {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  tagline: string | null;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  subcategory: string | null;
  status: string;
  qualityTier: string;
  featured: boolean;
  isChain: boolean;
  email: string | null;
  phone: string | null;
  website: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  priceRange: string | null;
  foundingYear: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  googleMapsUrl: string | null;
  hoursNote: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  dataSource: string | null;
  sourceUrl: string | null;
  verifiedBy: string | null;
  internalContext: string | null;
  reviewFlag: string | null;
}

interface Option {
  id: string;
  name: string;
}

const STATUSES = ["DRAFT", "PUBLISHED", "UNVERIFIED", "CLOSED"];
const TIERS = ["UNREVIEWED", "STANDARD", "GOLD"];
const PRICES = ["", "$", "$$", "$$$"];

const inputClass =
  "mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/30";

function Text({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue ?? ""} className={inputClass} />
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className={inputClass} />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-card p-5">
      <legend className="px-2 font-serif text-lg text-ink">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function EditForm({
  business,
  selectedTagIds,
  categories,
  tags,
}: {
  business: BusinessForm;
  selectedTagIds: string[];
  categories: Option[];
  tags: Option[];
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(updateBusiness, {});
  const selected = new Set(selectedTagIds);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={business.id} />

      <Section title="Identity">
        <Text name="name" label="Name" defaultValue={business.name} />
        <Text name="slug" label="Slug" defaultValue={business.slug} />
        <Text name="legalName" label="Legal name" defaultValue={business.legalName} />
        <label className="block">
          <span className="text-sm font-medium text-ink">Category</span>
          <select name="categoryId" defaultValue={business.categoryId} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Text name="subcategory" label="Subcategory" defaultValue={business.subcategory} />
        <div className="sm:col-span-2">
          <Text name="tagline" label="Tagline" defaultValue={business.tagline} />
        </div>
      </Section>

      <Section title="Descriptions">
        <div className="sm:col-span-2">
          <Area
            name="shortDescription"
            label="Short description (meta fallback)"
            defaultValue={business.shortDescription}
            rows={2}
          />
        </div>
        <div className="sm:col-span-2">
          <Area name="description" label="Long description" defaultValue={business.description} rows={6} />
        </div>
      </Section>

      <Section title="Publishing">
        <label className="block">
          <span className="text-sm font-medium text-ink">Status</span>
          <select name="status" defaultValue={business.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Quality tier</span>
          <select name="qualityTier" defaultValue={business.qualityTier} className={inputClass}>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="featured" defaultChecked={business.featured} />
          <span className="text-sm text-ink">Featured</span>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="isChain" defaultChecked={business.isChain} />
          <span className="text-sm text-ink">National chain</span>
        </label>
        <Text name="reviewFlag" label="Review flag" defaultValue={business.reviewFlag} />
      </Section>

      <Section title="Contact">
        <Text name="email" label="Email" defaultValue={business.email} />
        <Text name="phone" label="Phone" defaultValue={business.phone} />
        <div className="sm:col-span-2">
          <Text name="website" label="Website" defaultValue={business.website} />
        </div>
      </Section>

      <Section title="Address">
        <div className="sm:col-span-2">
          <Text name="streetAddress" label="Street address" defaultValue={business.streetAddress} />
        </div>
        <Text name="city" label="City" defaultValue={business.city} />
        <Text name="state" label="State" defaultValue={business.state} />
        <Text name="postalCode" label="Postal code" defaultValue={business.postalCode} />
        <label className="block">
          <span className="text-sm font-medium text-ink">Price range</span>
          <select name="priceRange" defaultValue={business.priceRange ?? ""} className={inputClass}>
            {PRICES.map((p) => (
              <option key={p} value={p}>
                {p === "" ? "—" : p}
              </option>
            ))}
          </select>
        </label>
        <Text name="foundingYear" label="Founding year" type="number" defaultValue={business.foundingYear} />
      </Section>

      <Section title="Media & social">
        <Text name="logoUrl" label="Logo URL" defaultValue={business.logoUrl} />
        <Text name="coverUrl" label="Cover URL" defaultValue={business.coverUrl} />
        <Text name="facebookUrl" label="Facebook" defaultValue={business.facebookUrl} />
        <Text name="instagramUrl" label="Instagram" defaultValue={business.instagramUrl} />
        <Text name="twitterUrl" label="Twitter / X" defaultValue={business.twitterUrl} />
        <Text name="youtubeUrl" label="YouTube" defaultValue={business.youtubeUrl} />
        <Text name="googleMapsUrl" label="Google Maps URL" defaultValue={business.googleMapsUrl} />
      </Section>

      <fieldset className="rounded-xl border border-line bg-card p-5">
        <legend className="px-2 font-serif text-lg text-ink">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm text-ink"
            >
              <input type="checkbox" name="tags" value={t.id} defaultChecked={selected.has(t.id)} />
              {t.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Section title="SEO overrides">
        <Text name="metaTitle" label="Meta title" defaultValue={business.metaTitle} />
        <Text name="metaDescription" label="Meta description" defaultValue={business.metaDescription} />
        <Text name="hoursNote" label="Hours note" defaultValue={business.hoursNote} />
      </Section>

      <Section title="Provenance (internal)">
        <Text name="dataSource" label="Data source" defaultValue={business.dataSource} />
        <Text name="sourceUrl" label="Source URL" defaultValue={business.sourceUrl} />
        <Text name="verifiedBy" label="Verified by" defaultValue={business.verifiedBy} />
        <div className="sm:col-span-2">
          <Area
            name="internalContext"
            label="Internal context (never shown publicly)"
            defaultValue={business.internalContext}
            rows={4}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 flex items-center gap-4 border-t border-line bg-paper/90 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-pine px-5 py-2 font-medium text-paper transition-colors hover:bg-pine-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state.ok ? <span className="text-sm text-pine">Saved.</span> : null}
        {state.error ? (
          <span role="alert" className="text-sm text-clay-dark">
            {state.error}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-ink-faint">
        Hours, photos, and creating or deleting listings aren’t editable here yet — those still go
        through the enrichment pipeline.
      </p>
    </form>
  );
}
