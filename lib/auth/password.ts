// Password hashing with scrypt (Node's built-in KDF — no dependency).
//
// Stored format:  scrypt:<N>:<saltHex>:<hashHex>
// scrypt is deliberately slow + memory-hard, so a leaked hash is expensive to
// brute-force. We compare with timingSafeEqual to avoid leaking match progress
// through response timing. The cost parameter N is stored in the hash so it can
// be raised later without invalidating existing hashes.
//
// The delimiter is ":" (not "$") on purpose: env loaders that run dotenv-expand
// — including Next.js's @next/env — treat "$NAME" as variable interpolation and
// would mangle a "$"-delimited hash when it's set in a .env file.
//
// Runs only on the Node.js runtime (the login server action + the hash CLI),
// never in the browser or the proxy, so `node:crypto` is always available here.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

interface ScryptOpts {
  N: number;
  maxmem: number;
}

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOpts,
) => Promise<Buffer>;

const KEYLEN = 64;
// scrypt cost. N = 2^14 needs ~16MB (128 * N * r, r=8), comfortably under the
// default 32MB maxmem. We pass maxmem explicitly so a future bump to N doesn't
// silently hit the cap.
const COST = 1 << 14;

function derive(plain: string, salt: Buffer, cost: number): Promise<Buffer> {
  // maxmem sized for the requested cost with headroom (256 * N * r).
  return scrypt(plain, salt, KEYLEN, { N: cost, maxmem: 256 * cost * 8 });
}

/** Hash a plaintext password into a self-describing `scrypt$...` string. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derive(plain, salt, COST);
  return `scrypt:${COST}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored `scrypt$...` hash.
 * Returns false (never throws) on any malformed/mismatched input.
 */
export async function verifyPassword(plain: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;

  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isInteger(cost) || cost < 2 || salt.length === 0 || expected.length === 0) {
    return false;
  }

  try {
    const derived = await derive(plain, salt, cost);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
