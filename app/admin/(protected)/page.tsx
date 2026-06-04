import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

// Always reflect live DB state; never statically cache the admin list.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-pine-soft text-pine-ink",
  UNVERIFIED: "bg-gold-soft text-gold-dark",
  DRAFT: "bg-paper-2 text-ink-soft",
  CLOSED: "bg-clay-soft text-clay-dark",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const where: Prisma.BusinessWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const businesses = await prisma.business.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      status: true,
      qualityTier: true,
      category: { select: { name: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 500,
  });

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-2xl text-ink">Listings</h1>
        <span className="text-sm text-ink-faint">{businesses.length} shown</span>
      </div>

      <form method="get" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search name, slug, or city…"
          className="w-full max-w-md rounded-md border border-line bg-card px-3 py-2 text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
        />
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.id} className="border-b border-line/60 last:border-0 hover:bg-paper-2/50">
                <td className="px-4 py-2">
                  <Link href={`/admin/business/${b.id}`} className="font-medium text-pine hover:underline">
                    {b.name}
                  </Link>
                  <span className="ml-2 text-ink-faint">/{b.slug}</span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{b.category.name}</td>
                <td className="px-4 py-2 text-ink-soft">{b.city}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[b.status] ?? "bg-paper-2 text-ink-soft"}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-ink-soft">{b.qualityTier}</td>
              </tr>
            ))}
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No listings match “{query}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
