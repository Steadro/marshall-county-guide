// Server-side auth data layer (DAL).
//
// This is the ONE place the rest of the app talks to for auth. Everything here
// runs on the server (importing `next/headers` makes that a hard guarantee).
//
// ---------------------------------------------------------------------------
// The multi-user swap point
// ---------------------------------------------------------------------------
// Today `authenticate()` checks a single admin credential held in env vars.
// To open this up to real accounts later you change ONLY this function:
//   - look the user up: `prisma.user.findUnique({ where: { email } })`
//   - verify against a stored hash (add `passwordHash` to the User model, or
//     drop password auth entirely and federate via OAuth/Auth.js)
//   - return `{ id: user.id, email: user.email, role: user.role }`
// Callers (`createSession`, `requireSession`, the login action, the editor)
// never change — they already speak in terms of a `Subject` with a `role`, and
// the dormant `User` / `Claim` / `ownerId` schema fields are waiting for it.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  SESSION_HINT_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/session";

export interface Subject {
  id: string;
  email: string;
  role: SessionPayload["role"];
}

/**
 * Check a credential. Returns the authenticated subject, or null on any failure
 * (unknown email OR wrong password — same null, no user enumeration). Throws
 * only if the server is misconfigured (missing env), which is an operator error,
 * not an auth failure.
 */
export async function authenticate(email: string, password: string): Promise<Subject | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set. " +
        "Generate the hash with `npx tsx scripts/hash-password.ts`.",
    );
  }

  const emailMatches = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  // Always run the (slow) password check even when the email is wrong, so the
  // response time doesn't reveal whether the email was right.
  const passwordMatches = await verifyPassword(password, adminHash);
  if (!emailMatches || !passwordMatches) return null;

  return { id: "admin", email: adminEmail, role: "ADMIN" };
}

/** Issue a signed session cookie for a subject. */
export async function createSession(subject: Subject): Promise<void> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = await signSessionToken(
    { sub: subject.id, email: subject.email, role: subject.role },
    nowSeconds,
  );
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Client-readable hint so public pages can lazily reveal admin UI without
  // making the session cookie readable. Not httpOnly by design; carries no secret.
  cookieStore.set(SESSION_HINT_COOKIE, "1", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Read + verify the current session. Returns null if absent/invalid/expired. */
export async function getSession(): Promise<Subject | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token, Math.floor(Date.now() / 1000));
  if (!payload) return null;
  return { id: payload.sub, email: payload.email, role: payload.role };
}

/**
 * Authoritative guard for protected pages and server actions. Redirects to the
 * login page when there is no valid session (defense in depth — the proxy gate
 * is only an optimistic first pass). When `role` is given, the subject must hold
 * at least that role; for v1 every session is ADMIN so this is forward-looking.
 */
export async function requireSession(role?: Subject["role"]): Promise<Subject> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (role && session.role !== role) redirect("/admin/login");
  return session;
}

/** Clear the session cookie + hint (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SESSION_HINT_COOKIE);
}
