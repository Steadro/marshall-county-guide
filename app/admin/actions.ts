"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BusinessStatus, QualityTier } from "@/app/generated/prisma/client";
import { requireSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface SaveState {
  ok?: boolean;
  error?: string;
}

// --- formData helpers -------------------------------------------------------

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}

function intOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function enumOrNull<T extends Record<string, string>>(
  e: T,
  value: string | null,
): T[keyof T] | null {
  if (value && Object.values(e).includes(value)) return value as T[keyof T];
  return null;
}

// --- updateBusiness ---------------------------------------------------------

export async function updateBusiness(_prev: SaveState, formData: FormData): Promise<SaveState> {
  // Authoritative auth check — never trust the proxy gate alone.
  await requireSession("ADMIN");

  const id = str(formData, "id");
  if (!id) return { error: "Missing business id." };

  const existing = await prisma.business.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) return { error: "That business no longer exists." };

  const name = str(formData, "name");
  const slug = str(formData, "slug");
  if (!name || !slug) return { error: "Name and slug are required." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug must be lowercase letters, numbers, and single hyphens." };
  }

  // Slugs are public URLs and must stay unique.
  if (slug !== existing.slug) {
    const clash = await prisma.business.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) return { error: `Slug "${slug}" is already taken by another listing.` };
  }

  const status = enumOrNull(BusinessStatus, str(formData, "status")) ?? BusinessStatus.DRAFT;
  const qualityTier =
    enumOrNull(QualityTier, str(formData, "qualityTier")) ?? QualityTier.UNREVIEWED;
  const categoryId = str(formData, "categoryId");
  if (!categoryId) return { error: "Pick a category." };

  const tagIds = formData.getAll("tags").filter((t): t is string => typeof t === "string");

  try {
    await prisma.business.update({
      where: { id },
      data: {
        name,
        slug,
        legalName: str(formData, "legalName"),
        tagline: str(formData, "tagline"),
        shortDescription: str(formData, "shortDescription"),
        description: str(formData, "description"),
        categoryId,
        subcategory: str(formData, "subcategory"),
        status,
        qualityTier,
        featured: bool(formData, "featured"),
        isChain: bool(formData, "isChain"),
        email: str(formData, "email"),
        phone: str(formData, "phone"),
        website: str(formData, "website"),
        streetAddress: str(formData, "streetAddress"),
        city: str(formData, "city") ?? "Lewisburg",
        state: str(formData, "state") ?? "TN",
        postalCode: str(formData, "postalCode"),
        priceRange: str(formData, "priceRange"),
        foundingYear: intOrNull(formData, "foundingYear"),
        logoUrl: str(formData, "logoUrl"),
        coverUrl: str(formData, "coverUrl"),
        facebookUrl: str(formData, "facebookUrl"),
        instagramUrl: str(formData, "instagramUrl"),
        twitterUrl: str(formData, "twitterUrl"),
        youtubeUrl: str(formData, "youtubeUrl"),
        googleMapsUrl: str(formData, "googleMapsUrl"),
        hoursNote: str(formData, "hoursNote"),
        metaTitle: str(formData, "metaTitle"),
        metaDescription: str(formData, "metaDescription"),
        dataSource: str(formData, "dataSource"),
        sourceUrl: str(formData, "sourceUrl"),
        verifiedBy: str(formData, "verifiedBy"),
        internalContext: str(formData, "internalContext"),
        reviewFlag: str(formData, "reviewFlag"),
        tags: { set: tagIds.map((tid) => ({ id: tid })) },
      },
    });
  } catch (err) {
    console.error("updateBusiness failed:", err);
    return { error: "Save failed. Check the values and try again." };
  }

  // ISR: public pages are statically generated, so a DB write isn't visible
  // until we revalidate. Revalidate the listing's own page (old + new slug) and
  // — since a single edit can move a business across home/category/town lists —
  // sweep the whole tree. Edits are infrequent on a curated directory, so the
  // broad invalidation is cheap insurance against a stale list somewhere.
  revalidatePath(`/business/${slug}`);
  if (slug !== existing.slug) revalidatePath(`/business/${existing.slug}`);
  revalidatePath("/", "layout");

  return { ok: true };
}

// --- logout -----------------------------------------------------------------

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
