import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma, SubmissionStatus } from "@/app/generated/prisma/client";

// Always reflect live DB state.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-gold-soft text-gold-dark",
  IN_REVIEW: "bg-pine-soft text-pine-ink",
  APPROVED: "bg-pine-soft text-pine-ink",
  REJECTED: "bg-clay-soft text-clay-dark",
  SPAM: "bg-paper-2 text-ink-faint",
};

const KIND_LABELS: Record<string, string> = {
  BUSINESS_INTAKE: "New business",
  WEBMASTER: "Webmaster",
  UPDATE: "Update",
  REMOVAL: "Removal",
  OTHER: "Other",
};

// Filter tabs across the top. "Open" = the work queue (NEW + IN_REVIEW).
const FILTERS = ["open", "NEW", "IN_REVIEW", "APPROVED", "REJECTED", "SPAM", "all"] as const;
const FILTER_LABELS: Record<(typeof FILTERS)[number], string> = {
  open: "Open",
  NEW: "New",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SPAM: "Spam",
  all: "All",
};

function whereForFilter(filter: string): Prisma.SubmissionWhereInput {
  if (filter === "all") return {};
  if (filter === "open") return { status: { in: ["NEW", "IN_REVIEW"] } };
  if ((Object.values(SubmissionStatus) as string[]).includes(filter)) {
    return { status: filter as SubmissionStatus };
  }
  return { status: { in: ["NEW", "IN_REVIEW"] } };
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString();
}

export default async function IntakeQueue({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = FILTERS.includes(rawFilter as (typeof FILTERS)[number])
    ? (rawFilter as (typeof FILTERS)[number])
    : "open";

  const [submissions, counts] = await Promise.all([
    prisma.submission.findMany({
      where: whereForFilter(filter),
      select: {
        id: true,
        kind: true,
        status: true,
        businessName: true,
        submitterName: true,
        submitterEmail: true,
        message: true,
        createdAt: true,
        flagged: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.submission.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const openCount = (countByStatus.NEW ?? 0) + (countByStatus.IN_REVIEW ?? 0);

  function tabCount(f: (typeof FILTERS)[number]): number | null {
    if (f === "open") return openCount;
    if (f === "all") return null;
    return countByStatus[f] ?? 0;
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-2xl text-ink">Intake</h1>
        <span className="text-sm text-ink-faint">{submissions.length} shown</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f === filter;
          const c = tabCount(f);
          return (
            <Link
              key={f}
              href={`/admin/intake?filter=${f}`}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-pine text-white"
                  : "border border-line bg-card text-ink-soft hover:bg-paper-2"
              }`}
            >
              {FILTER_LABELS[f]}
              {c !== null ? <span className={active ? "opacity-80" : "text-ink-faint"}> {c}</span> : null}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">From</th>
              <th className="px-4 py-2 font-medium">Received</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const subject =
                s.businessName ||
                (s.message ? s.message.slice(0, 60) + (s.message.length > 60 ? "…" : "") : "—");
              const from = s.submitterName || s.submitterEmail || "anonymous";
              return (
                <tr key={s.id} className="border-b border-line/60 last:border-0 hover:bg-paper-2/50">
                  <td className="px-4 py-2 text-ink-soft">{KIND_LABELS[s.kind] ?? s.kind}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/intake/${s.id}`} className="font-medium text-pine hover:underline">
                      {subject}
                    </Link>
                    {s.flagged ? (
                      <span
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-clay-soft px-1.5 py-0.5 text-xs font-semibold text-clay-dark align-middle"
                        title="Content filter flagged this submission for review"
                      >
                        ⚠ flagged
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{from}</td>
                  <td className="px-4 py-2 text-ink-faint">{timeAgo(s.createdAt)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[s.status] ?? "bg-paper-2 text-ink-soft"}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  Nothing here.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
