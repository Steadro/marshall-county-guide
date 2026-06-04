import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [business, categories, tags] = await Promise.all([
    prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        legalName: true,
        tagline: true,
        shortDescription: true,
        description: true,
        categoryId: true,
        subcategory: true,
        status: true,
        qualityTier: true,
        featured: true,
        isChain: true,
        email: true,
        phone: true,
        website: true,
        streetAddress: true,
        city: true,
        state: true,
        postalCode: true,
        priceRange: true,
        foundingYear: true,
        logoUrl: true,
        coverUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        googleMapsUrl: true,
        hoursNote: true,
        metaTitle: true,
        metaDescription: true,
        dataSource: true,
        sourceUrl: true,
        verifiedBy: true,
        internalContext: true,
        reviewFlag: true,
        tags: { select: { id: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!business) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-pine hover:underline">
          ← All listings
        </Link>
        <h1 className="mt-2 font-serif text-2xl text-ink">{business.name}</h1>
        <a
          href={`/business/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-ink-faint hover:underline"
        >
          View public page ↗
        </a>
      </div>

      <EditForm
        business={business}
        selectedTagIds={business.tags.map((t) => t.id)}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
