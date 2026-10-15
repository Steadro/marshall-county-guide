// Shared server helpers for public submissions (intake + contact). Server-only:
// imports node:crypto and reads server env. Never import from a client component.

import { createHash } from "node:crypto";
import type { SubmissionKind } from "@/app/generated/prisma/client";

/** First client IP from the proxy chain, or "unknown". */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/**
 * One-way hash of the submitter IP, for rate-abuse triage in the admin tab. We
 * never store the raw IP. Salted with IP_HASH_SALT (falling back to
 * SESSION_SECRET, so rotating the session secret to log admins out doesn't have
 * to break IP-hash continuity once IP_HASH_SALT is set). `||`, not `??`: an
 * empty IP_HASH_SALT="" must fall back too, or the hash goes unsalted.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.SESSION_SECRET || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Trim + cap a possibly-untyped field to a max length; "" when absent. */
export function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Loose email shape check (same rule the contact form has always used). */
export function looksLikeEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Best-effort in-memory rate limit. Per warm instance on Vercel, not global — a
// speed bump for casual abuse, not a hard guarantee. The honeypot does the rest.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, Map<string, number[]>>();

export function rateLimited(scope: string, ip: string): boolean {
  let hits = buckets.get(scope);
  if (!hits) {
    hits = new Map<string, number[]>();
    buckets.set(scope, hits);
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

/** Contact-form topic → Submission kind. */
export const TOPIC_TO_KIND: Record<string, SubmissionKind> = {
  update: "UPDATE",
  add: "BUSINESS_INTAKE",
  remove: "REMOVAL",
  suggestion: "SUGGESTION",
  other: "WEBMASTER",
};

/**
 * Fire a webhook. Callers run it inside after() so the response never waits on
 * it, and the 5s timeout caps how long a stalled n8n keeps the function alive.
 * Best-effort: a submission is already persisted in Neon before this runs, so a
 * webhook failure (n8n down) never loses data. Used for notifications + future
 * Claude-API triage.
 *
 * Sends N8N_WEBHOOK_SECRET as `x-mcg-secret` when set; have the n8n Webhook node
 * check it (Header Auth) so a leaked webhook URL alone can't inject messages.
 */
export async function fireWebhook(url: string | undefined, payload: unknown): Promise<void> {
  if (!url) return;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(secret ? { "x-mcg-secret": secret } : {}) },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (err) {
    console.error("Submission webhook failed (non-fatal):", err);
  }
}
