// Stateless session token: a compact HMAC-SHA256 signed payload.
//
// Format:  base64url(JSON payload) + "." + base64url(HMAC signature)
// Payload: { sub, email, role, iat, exp }  (seconds since epoch)
//
// This module is intentionally runtime-agnostic. It signs/verifies a string and
// knows nothing about cookies or `next/headers`, so the SAME verify path runs in
// `proxy.ts` (the optimistic gate) and in server actions / the data layer (the
// authoritative check). Cookie reading differs by context and lives in the
// callers: `proxy.ts` uses `request.cookies`, server code uses `lib/auth`.
//
// We use Web Crypto (`crypto.subtle`) rather than a JWT library on purpose:
//  - zero dependencies (matches the project's "no auth lib for v1" rule)
//  - `crypto.subtle.verify` compares the MAC in constant time internally, so
//    there is no hand-rolled timing-unsafe comparison
//  - we control both sign and verify with one fixed algorithm, so the classic
//    JWT "alg confusion" footgun does not apply
//
// Upgrade path: when this grows into real multi-user auth, swap this file for
// `jose` (JWT/JWE) or Auth.js sessions. The payload shape below is already the
// shape those libraries expect, so callers of `signSessionToken` /
// `verifySessionToken` would not change.

export const SESSION_COOKIE = "mcg_admin_session";

// 7 days. Short enough to bound a leaked cookie, long enough to avoid nagging a
// single trusted admin. Re-login refreshes it.
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload {
  sub: string; // subject id ("admin" today; a User.id once multi-user)
  email: string;
  role: "ADMIN" | "EDITOR" | "OWNER";
  iat: number; // issued-at (epoch seconds)
  exp: number; // expiry (epoch seconds)
}

function base64urlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function base64urlDecode(text: string): Uint8Array<ArrayBuffer> {
  // Copy into a fresh ArrayBuffer-backed view so the type satisfies BufferSource
  // (TS lib types reject the generic Uint8Array<ArrayBufferLike> Buffer produces).
  const buf = Buffer.from(text, "base64url");
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (need >= 32 chars). " +
        "Generate one with `npx tsx scripts/hash-password.ts` and set it in your env.",
    );
  }
  cachedKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return cachedKey;
}

/** Sign a session payload into a `payload.signature` token string. */
export async function signSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  nowSeconds: number,
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    iat: nowSeconds,
    exp: nowSeconds + SESSION_MAX_AGE_SECONDS,
  };
  const body = base64urlEncode(encoder.encode(JSON.stringify(full)));
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${base64urlEncode(new Uint8Array(sig))}`;
}

/**
 * Verify a token. Returns the payload only if the signature is valid AND the
 * token has not expired; otherwise null. Never throws on malformed input.
 */
export async function verifySessionToken(
  token: string | undefined | null,
  nowSeconds: number,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  let valid = false;
  try {
    const key = await getKey();
    valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sigPart),
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(decoder.decode(base64urlDecode(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp <= nowSeconds) return null;
    if (!payload.sub || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}
