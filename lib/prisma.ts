// Prisma 7 client singleton.
//
// Prisma 7 requires a driver adapter (the connection URL no longer lives in the
// schema). We use @prisma/adapter-pg so the same client works in local dev, in
// `tsx` seed scripts, and on Vercel's Node serverless runtime.
//
// Imports are RELATIVE (not the "@/" alias) on purpose: prisma/seed.ts and
// scripts/*.ts run under `tsx`, which does not resolve tsconfig path aliases.

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your Postgres connection string.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
