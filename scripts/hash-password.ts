// Generate the admin credential env vars.
//
//   npx tsx scripts/hash-password.ts "your-strong-password"
//
// Prints an ADMIN_PASSWORD_HASH (scrypt) and a fresh SESSION_SECRET to paste
// into .env.local (and your Vercel project env). The plaintext password is never
// stored anywhere — only the hash. Treat the password like an API key: long and
// random (a passphrase or 32+ random chars).
//
// Relative import (not the "@/" alias) because this runs under `tsx`, which does
// not resolve tsconfig path aliases. See lib/prisma.ts for the same convention.

import { randomBytes } from "node:crypto";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npx tsx scripts/hash-password.ts "your-strong-password"');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Refusing: use at least 12 characters (longer + random is better).");
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const sessionSecret = randomBytes(32).toString("base64url");

  console.log("\nAdd these to .env.local and to your Vercel project env:\n");
  console.log(`ADMIN_EMAIL="you@example.com"`);
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log(`SESSION_SECRET="${sessionSecret}"`);
  console.log("\nSet ADMIN_EMAIL to the address you'll log in with.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
