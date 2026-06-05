import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clean, clientIp, fireWebhook, hashIp, looksLikeEmail, rateLimited } from "@/lib/submissions";
import { screenText } from "@/lib/content-filter";

// Structured "Add your business" intake. Writes straight to the Submission table
// (so capture never depends on n8n), then best-effort pings the intake webhook
// for notifications + future Claude-API triage. See lib/submissions.ts.
const WEBHOOK = process.env.N8N_INTAKE_WEBHOOK_URL;

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: hidden field real users never see. If filled, pretend success and
  // drop it, so the bot thinks it worked.
  if (clean(data.homepage, 200)) {
    return NextResponse.json({ ok: true });
  }

  const businessName = clean(data.businessName, 200);
  const businessType = clean(data.businessType, 200);
  const streetAddress = clean(data.streetAddress, 300);
  const city = clean(data.city, 120);
  const phone = clean(data.phone, 60);
  const website = clean(data.website, 400);
  const submitterName = clean(data.submitterName, 120);
  const submitterEmail = clean(data.submitterEmail, 200);
  const message = clean(data.message, 5000);
  const sourcePage = clean(data.page, 400);

  // Required minimum (matches the form): name, type, address.
  if (!businessName || !businessType || !streetAddress) {
    return NextResponse.json(
      { ok: false, error: "Please add the business name, type, and street address." },
      { status: 422 },
    );
  }
  // Email is optional, but if given it must look valid.
  if (submitterEmail && !looksLikeEmail(submitterEmail)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  const ip = clientIp(req);
  if (rateLimited("intake", ip)) {
    return NextResponse.json(
      { ok: false, error: "That's a few submissions in a row. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const screen = screenText([businessName, businessType, message, submitterName, streetAddress].join(" "));

  let id: string;
  try {
    const created = await prisma.submission.create({
      data: {
        kind: "BUSINESS_INTAKE",
        status: "NEW",
        businessName,
        businessType,
        streetAddress,
        city: city || null,
        phone: phone || null,
        website: website || null,
        submitterName: submitterName || null,
        submitterEmail: submitterEmail || null,
        message: message || null,
        sourcePage: sourcePage || null,
        ipHash: hashIp(ip),
        flagged: screen.flagged,
        flagReason: screen.flagged ? screen.terms.join(", ") : null,
      },
      select: { id: true },
    });
    id = created.id;
  } catch (err) {
    console.error("Intake create failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong saving your submission. Please try again." },
      { status: 500 },
    );
  }

  // Non-blocking: the row is already safe in Neon.
  await fireWebhook(WEBHOOK, {
    type: "business_intake",
    submissionId: id,
    businessName,
    businessType,
    streetAddress,
    city,
    phone,
    website,
    submitterName,
    submitterEmail,
    message,
    page: sourcePage,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
