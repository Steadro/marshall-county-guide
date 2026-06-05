import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clean,
  clientIp,
  fireWebhook,
  hashIp,
  looksLikeEmail,
  rateLimited,
  TOPIC_TO_KIND,
} from "@/lib/submissions";
import { screenText } from "@/lib/content-filter";

// Server-only: the n8n webhook that fans out to Resend. Never exposed to the
// browser (no NEXT_PUBLIC prefix). Set in .env and in Vercel.
const WEBHOOK = process.env.N8N_CONTACT_WEBHOOK_URL;

// Topic key (from the form) → human label shown in the notification email.
const TOPICS: Record<string, string> = {
  update: "Update listing info",
  add: "Add a missing business or service",
  remove: "Remove a listing",
  other: "Something else",
};

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: a hidden field real users never see. If it's filled, silently
  // accept (so the bot thinks it succeeded) and drop the message.
  if (clean(data.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const message = clean(data.message, 5000);
  const topicKey = typeof data.topic === "string" && data.topic in TOPICS ? data.topic : "other";
  const businessName = clean(data.businessName, 200);
  const listingUrl = clean(data.listingUrl, 400);
  const page = clean(data.page, 400);

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "Please add your name, email, and a message." },
      { status: 422 },
    );
  }
  if (!looksLikeEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  const ip = clientIp(req);
  if (rateLimited("contact", ip)) {
    return NextResponse.json(
      { ok: false, error: "That's a few messages in a row. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  // Persist first — everything lands in the Submission table so the admin Intake
  // tab is the single place to triage, and nothing depends on email. The n8n
  // ping below is best-effort on top of that.
  const screen = screenText([name, businessName, message].join(" "));

  try {
    await prisma.submission.create({
      data: {
        kind: TOPIC_TO_KIND[topicKey] ?? "WEBMASTER",
        status: "NEW",
        submitterName: name,
        submitterEmail: email,
        businessName: businessName || null,
        listingUrl: listingUrl || null,
        message,
        sourcePage: page || null,
        ipHash: hashIp(ip),
        flagged: screen.flagged,
        flagReason: screen.flagged ? screen.terms.join(", ") : null,
      },
    });
  } catch (err) {
    console.error("Contact submission create failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong sending your message. Please try again." },
      { status: 500 },
    );
  }

  // Non-blocking notification / future triage. Not having a webhook configured is
  // fine now that the message is already saved.
  await fireWebhook(WEBHOOK, {
    topic: TOPICS[topicKey],
    name,
    email,
    businessName,
    listingUrl,
    message,
    page,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
