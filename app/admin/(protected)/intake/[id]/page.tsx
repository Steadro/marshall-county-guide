import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  approveIntake,
  saveSubmissionNotes,
  setSubmissionStatus,
} from "@/app/admin/(protected)/intake/actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  BUSINESS_INTAKE: "New business",
  WEBMASTER: "Webmaster note",
  UPDATE: "Update request",
  REMOVAL: "Removal request",
  SUGGESTION: "Suggestion",
  OTHER: "Other",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2">
      <dt className="text-sm text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

export default async function IntakeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.submission.findUnique({ where: { id } });
  if (!s) notFound();

  const isIntake = s.kind === "BUSINESS_INTAKE";
  const isOpen = s.status === "NEW" || s.status === "IN_REVIEW";

  // Bound server actions (id is fixed; buttons carry no other input).
  const approve = approveIntake.bind(null, id);
  const markInReview = setSubmissionStatus.bind(null, id, "IN_REVIEW");
  const reject = setSubmissionStatus.bind(null, id, "REJECTED");
  const markSpam = setSubmissionStatus.bind(null, id, "SPAM");
  const reopen = setSubmissionStatus.bind(null, id, "NEW");

  async function saveNotes(formData: FormData) {
    "use server";
    await saveSubmissionNotes(id, String(formData.get("adminNotes") ?? ""));
  }

  const website = s.website
    ? s.website.startsWith("http")
      ? s.website
      : `https://${s.website}`
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/intake" className="text-sm text-pine hover:underline">
          ← Intake queue
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-serif text-2xl text-ink">{s.businessName || KIND_LABELS[s.kind]}</h1>
          <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs text-ink-soft">{s.status}</span>
        </div>
        <p className="mt-1 text-sm text-ink-faint">
          {KIND_LABELS[s.kind] ?? s.kind} · received {s.createdAt.toLocaleString()}
        </p>
      </div>

      {s.flagged ? (
        <div className="mb-6 rounded-lg bg-clay-soft px-4 py-3 text-sm leading-relaxed text-clay-dark ring-1 ring-clay-dark/20">
          <span className="font-semibold">⚠ Content filter flagged this submission.</span>{" "}
          Matched: <span className="font-mono">{s.flagReason}</span>. Review the text before approving —
          this is only a heuristic, so it may be a false positive.
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        {/* Details */}
        <div className="rounded-xl border border-line bg-card p-5">
          <dl className="divide-y divide-line/60">
            <Field label="Business" value={s.businessName} />
            <Field label="Type (typed)" value={s.businessType} />
            <Field label="Address" value={s.streetAddress} />
            <Field label="Town" value={s.city} />
            <Field label="Phone" value={s.phone} />
            <Field
              label="Website"
              value={
                website ? (
                  <a href={website} target="_blank" rel="noreferrer" className="text-pine hover:underline">
                    {s.website}
                  </a>
                ) : null
              }
            />
            <Field label="Submitter" value={s.submitterName} />
            <Field
              label="Email"
              value={
                s.submitterEmail ? (
                  <a href={`mailto:${s.submitterEmail}`} className="text-pine hover:underline">
                    {s.submitterEmail}
                  </a>
                ) : null
              }
            />
            <Field
              label="Message"
              value={s.message ? <span className="whitespace-pre-wrap">{s.message}</span> : null}
            />
            <Field
              label="Listing ref"
              value={
                s.listingUrl ? (
                  <a href={s.listingUrl} target="_blank" rel="noreferrer" className="text-pine hover:underline">
                    {s.listingUrl}
                  </a>
                ) : null
              }
            />
            <Field label="From page" value={s.sourcePage} />
            {s.autoAnalysis ? (
              <Field
                label="Auto analysis"
                value={
                  <pre className="overflow-x-auto rounded-md bg-paper-2 p-3 text-xs text-ink-soft">
                    {JSON.stringify(s.autoAnalysis, null, 2)}
                  </pre>
                }
              />
            ) : null}
            {s.promotedBusinessId ? (
              <Field
                label="Promoted to"
                value={
                  <Link href={`/admin/business/${s.promotedBusinessId}`} className="text-pine hover:underline">
                    Edit the draft listing →
                  </Link>
                }
              />
            ) : null}
            {s.reviewedBy ? (
              <Field
                label="Reviewed"
                value={`${s.reviewedBy}${s.reviewedAt ? ` · ${s.reviewedAt.toLocaleString()}` : ""}`}
              />
            ) : null}
          </dl>

          {/* Private notes */}
          <form action={saveNotes} className="mt-5 border-t border-line/60 pt-5">
            <label htmlFor="adminNotes" className="block text-sm font-medium text-ink">
              Private notes
            </label>
            <textarea
              id="adminNotes"
              name="adminNotes"
              rows={3}
              defaultValue={s.adminNotes ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
            />
            <button
              type="submit"
              className="mt-2 rounded-md border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-paper-2"
            >
              Save notes
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Actions</h2>
            <div className="space-y-2">
              {isIntake ? (
                <form action={approve}>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-dark"
                  >
                    {s.promotedBusinessId ? "Open draft listing" : "Approve → create draft listing"}
                  </button>
                </form>
              ) : null}

              {isOpen && s.status !== "IN_REVIEW" ? (
                <form action={markInReview}>
                  <button
                    type="submit"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:bg-paper-2"
                  >
                    Mark in review
                  </button>
                </form>
              ) : null}

              {isOpen ? (
                <>
                  <form action={reject}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-line px-3 py-2 text-sm text-clay-dark transition-colors hover:bg-clay-soft/40"
                    >
                      Reject
                    </button>
                  </form>
                  <form action={markSpam}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink-faint transition-colors hover:bg-paper-2"
                    >
                      Mark spam
                    </button>
                  </form>
                </>
              ) : (
                <form action={reopen}>
                  <button
                    type="submit"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:bg-paper-2"
                  >
                    Reopen
                  </button>
                </form>
              )}
            </div>
          </div>

          {s.ipHash ? (
            <p className="px-1 text-xs text-ink-faint">
              Submitter fingerprint: <code className="text-ink-soft">{s.ipHash.slice(0, 12)}</code>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
