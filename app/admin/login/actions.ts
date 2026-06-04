"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, createSession } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

// Best-effort in-memory rate limit (same approach as /api/contact): a speed bump
// for casual brute force, per warm serverless instance rather than global. The
// real control is a slow scrypt hash + a long random password. For a hard,
// global limit later, back this with Upstash/Redis.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

function safeNext(raw: FormDataEntryValue | null): string {
  // Only allow internal /admin paths, and never bounce back to login itself.
  if (typeof raw === "string" && raw.startsWith("/admin") && !raw.startsWith("/admin/login")) {
    return raw;
  }
  return "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const hdrs = await headers();
  const ip = (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const subject = await authenticate(email, password);
  if (!subject) {
    // Deliberately vague — don't reveal which half was wrong.
    return { error: "Incorrect email or password." };
  }

  await createSession(subject);
  // redirect() throws NEXT_REDIRECT; must be outside any try/catch.
  redirect(next);
}
