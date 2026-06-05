"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@/app/generated/prisma/client";
import { requireSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// --- helpers ----------------------------------------------------------------

/** Generate a slug from a name that doesn't collide with an existing Business. */
async function uniqueBusinessSlug(name: string, city: string | null): Promise<string> {
  const base = slugify(name) || "business";
  const candidates = [base, city ? `${base}-${slugify(city)}` : null].filter(
    (s): s is string => Boolean(s),
  );
  for (const c of candidates) {
    const taken = await prisma.business.findUnique({ where: { slug: c }, select: { id: true } });
    if (!taken) return c;
  }
  // Fall back to numeric suffixes off the base.
  for (let i = 2; i < 1000; i++) {
    const c = `${base}-${i}`;
    const taken = await prisma.business.findUnique({ where: { slug: c }, select: { id: true } });
    if (!taken) return c;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Best-effort category guess from the submitter's free-text business type.
 * Returns a categoryId — always one, since Business.categoryId is required and
 * the admin can correct it in the editor. Prefers a name match, else the first
 * category by sort order.
 */
async function guessCategoryId(businessType: string | null): Promise<string> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  if (categories.length === 0) {
    throw new Error("No categories exist — seed the database before approving intake.");
  }
  const t = businessType?.toLowerCase().trim();
  if (t) {
    const hit = categories.find(
      (c) => c.name.toLowerCase().includes(t) || t.includes(c.name.toLowerCase()),
    );
    if (hit) return hit.id;
  }
  return categories[0].id;
}

// --- status transitions -----------------------------------------------------

/** Reject / mark-spam / move to in-review / reopen. */
export async function setSubmissionStatus(id: string, status: SubmissionStatus): Promise<void> {
  const session = await requireSession("ADMIN");
  if (!Object.values(SubmissionStatus).includes(status)) {
    throw new Error("Invalid status.");
  }
  await prisma.submission.update({
    where: { id },
    data: {
      status,
      reviewedAt: status === "NEW" ? null : new Date(),
      reviewedBy: status === "NEW" ? null : session.email,
    },
  });
  revalidatePath("/admin/intake");
  revalidatePath(`/admin/intake/${id}`);
}

/** Save the admin's private notes on a submission. */
export async function saveSubmissionNotes(id: string, notes: string): Promise<void> {
  await requireSession("ADMIN");
  await prisma.submission.update({
    where: { id },
    data: { adminNotes: notes.trim().slice(0, 5000) || null },
  });
  revalidatePath(`/admin/intake/${id}`);
}

/**
 * Approve a BUSINESS_INTAKE submission: create a DRAFT Business prefilled from
 * the submission, link them, mark the submission APPROVED, then drop the admin
 * into the normal business editor to finish it. The new listing is DRAFT +
 * UNREVIEWED, so it is NOT public until the admin publishes it.
 */
export async function approveIntake(id: string): Promise<void> {
  const session = await requireSession("ADMIN");

  const sub = await prisma.submission.findUnique({ where: { id } });
  if (!sub) throw new Error("Submission not found.");
  if (sub.promotedBusinessId) {
    // Already promoted — just go to the existing listing.
    redirect(`/admin/business/${sub.promotedBusinessId}`);
  }

  const name = (sub.businessName ?? "").trim() || "Untitled (from intake)";
  const slug = await uniqueBusinessSlug(name, sub.city);
  const categoryId = await guessCategoryId(sub.businessType);

  // Stash the raw submission context where it won't render publicly, so the
  // editor has the submitter's words + the type they typed.
  const contextLines = [
    "Created from a public intake submission.",
    sub.businessType ? `Submitted type: ${sub.businessType}` : null,
    sub.submitterName || sub.submitterEmail
      ? `Submitter: ${[sub.submitterName, sub.submitterEmail].filter(Boolean).join(" — ")}`
      : null,
    sub.message ? `Note: ${sub.message}` : null,
  ].filter(Boolean);

  const business = await prisma.business.create({
    data: {
      name,
      slug,
      categoryId,
      streetAddress: sub.streetAddress,
      city: sub.city || "Lewisburg",
      phone: sub.phone,
      website: sub.website,
      status: "DRAFT",
      qualityTier: "UNREVIEWED",
      dataSource: "intake",
      reviewFlag: "From public intake — verify before publishing",
      internalContext: contextLines.join("\n"),
    },
    select: { id: true },
  });

  await prisma.submission.update({
    where: { id },
    data: {
      status: "APPROVED",
      promotedBusinessId: business.id,
      reviewedAt: new Date(),
      reviewedBy: session.email,
    },
  });

  revalidatePath("/admin/intake");
  redirect(`/admin/business/${business.id}`);
}
