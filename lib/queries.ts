import { prisma } from "@/lib/prisma";
import { Prisma, BusinessStatus } from "@/app/generated/prisma/client";
import { hashString } from "@/lib/utils";

// Businesses we show publicly. DRAFT is hidden; CLOSED is excluded from primary
// lists (none in the seed, but render-safe if added later).
const VISIBLE_STATUSES: BusinessStatus[] = [BusinessStatus.PUBLISHED, BusinessStatus.UNVERIFIED];
const visibleWhere = { status: { in: VISIBLE_STATUSES } } satisfies Prisma.BusinessWhereInput;

// --- Selections (kept narrow for listing perf) -----------------------------

export const businessCardSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  shortDescription: true,
  city: true,
  streetAddress: true, // used by the detail select (spread below)
  priceRange: true, // used by the detail select (spread below)
  isChain: true,
  qualityTier: true, // drives the gold-standard card treatment
  latitude: true, // used by category/business maps
  longitude: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.BusinessSelect;

export type BusinessCard = Prisma.BusinessGetPayload<{ select: typeof businessCardSelect }>;

const businessDetailSelect = {
  ...businessCardSelect,
  legalName: true,
  description: true,
  email: true,
  phone: true,
  website: true,
  state: true,
  postalCode: true,
  country: true,
  latitude: true,
  longitude: true,
  foundingYear: true,
  facebookUrl: true,
  instagramUrl: true,
  twitterUrl: true,
  youtubeUrl: true,
  hoursNote: true,
  status: true,
  metaTitle: true,
  metaDescription: true,
  lastVerifiedAt: true,
  tags: { select: { name: true, slug: true } },
  hours: {
    select: { dayOfWeek: true, opens: true, closes: true, isClosed: true },
    orderBy: { dayOfWeek: "asc" },
  },
  photos: {
    select: { url: true, alt: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.BusinessSelect;

export type BusinessDetail = Prisma.BusinessGetPayload<{ select: typeof businessDetailSelect }>;

// --- Queries ----------------------------------------------------------------

const cardOrder: Prisma.BusinessOrderByWithRelationInput[] = [
  { featured: "desc" },
  { isChain: "asc" }, // local/regional businesses first, national chains last
  { name: "asc" },
];

export function getAllBusinesses(): Promise<BusinessCard[]> {
  return prisma.business.findMany({
    where: visibleWhere,
    select: businessCardSelect,
    orderBy: cardOrder,
  });
}

// Categories never surfaced in the homepage spotlight (slugs). Manufacturers are
// employers, not places residents visit, so they don't belong in a "go take a
// look" strip. National chains are excluded separately (see below).
const SPOTLIGHT_EXCLUDED_CATEGORY_SLUGS = new Set(["manufacturing"]);

/**
 * Rotating cast for the homepage spotlight. Local-only (no national chains) and
 * no Manufacturing. Picked deterministically per UTC day: once assigned for the
 * day it stays for the day (stable across redeploys, caches cleanly under ISR),
 * and rotates the next day. Each business gets a fresh day-seeded score and we
 * take the top `count`, so adding/removing a business only shifts the boundary
 * instead of reshuffling the whole strip (the old windowed rotation churned the
 * entire set whenever the catalog grew).
 */
export async function getSpotlightBusinesses(count = 8): Promise<BusinessCard[]> {
  const pool = (await getAllBusinesses()).filter(
    (b) => !b.isChain && !SPOTLIGHT_EXCLUDED_CATEGORY_SLUGS.has(b.category.slug),
  );
  if (pool.length <= count) return pool;

  const dayKey = Math.floor(Date.now() / 86_400_000);
  return [...pool]
    .sort((a, b) => hashString(`${dayKey}:${a.id}`) - hashString(`${dayKey}:${b.id}`))
    .slice(0, count);
}

export function getBusinessBySlug(slug: string): Promise<BusinessDetail | null> {
  return prisma.business.findFirst({
    where: { slug, ...visibleWhere },
    select: businessDetailSelect,
  });
}

export async function getAllBusinessSlugs(): Promise<string[]> {
  const rows = await prisma.business.findMany({
    where: visibleWhere,
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export interface RestaurantPick {
  slug: string;
  name: string;
  city: string;
}

/** Local restaurants/food businesses for the "what's for dinner?" picker. */
export async function getRestaurantsForPicker(): Promise<RestaurantPick[]> {
  const rows = await prisma.business.findMany({
    where: { ...visibleWhere, isChain: false, category: { slug: "restaurant-and-food" } },
    select: { slug: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({ slug: r.slug, name: r.name, city: r.city }));
}

export interface CategoryWithCount {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  count: number;
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      sortOrder: true,
      _count: { select: { businesses: { where: visibleWhere } } },
    },
  });
  return categories
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      sortOrder: c.sortOrder,
      count: c._count.businesses,
    }))
    .filter((c) => c.count > 0);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, description: true, icon: true },
  });
  if (!category) return null;
  const businesses = await prisma.business.findMany({
    where: { ...visibleWhere, categoryId: category.id },
    select: businessCardSelect,
    orderBy: cardOrder,
  });
  return { category, businesses };
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const rows = await prisma.category.findMany({ select: { slug: true } });
  return rows.map((r) => r.slug);
}

export async function getBusinessesByCity(cityName: string): Promise<BusinessCard[]> {
  return prisma.business.findMany({
    where: { ...visibleWhere, city: { equals: cityName, mode: "insensitive" } },
    select: businessCardSelect,
    orderBy: cardOrder,
  });
}

export async function getCityCounts(): Promise<Map<string, number>> {
  const grouped = await prisma.business.groupBy({
    by: ["city"],
    where: visibleWhere,
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const g of grouped) map.set(g.city.toLowerCase(), g._count._all);
  return map;
}
