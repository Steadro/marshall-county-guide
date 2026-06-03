import { NextResponse } from "next/server";

// Server-only: the n8n webhook that fans out to Resend. Never exposed to the
// browser (no NEXT_PUBLIC prefix). Set in .env.local and in Vercel.
const WEBHOOK = process.env.N8N_CONTACT_WEBHOOK_URL;

// Topic key (from the form) → human label shown in the notification email.
const TOPICS: Record<string, string> = {
  update: "Update listing info",
  add: "Add a missing business or service",
  remove: "Remove a listing",
  other: "Something else",
};

// Best-effort in-memory rate limit. On Vercel this is per warm instance, not
// global, so it's a speed bump for casual abuse, not a hard guarantee. The
// honeypot + server-only webhook URL do most of the work.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

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
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "That's a few messages in a row. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  if (!WEBHOOK) {
    console.error("N8N_CONTACT_WEBHOOK_URL is not set — contact form cannot send.");
    return NextResponse.json(
      { ok: false, error: "The form isn't set up yet. Please email us directly for now." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topic: TOPICS[topicKey],
        name,
        email,
        businessName,
        listingUrl,
        message,
        page,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (err) {
    console.error("Contact webhook failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong sending your message. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
