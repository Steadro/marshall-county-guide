import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Per-request, never cached: it reflects the caller's session cookie.
export const dynamic = "force-dynamic";

// Authoritative admin check for client code (the banner + per-listing edit
// button). Verifies the signed httpOnly session server-side and returns only a
// boolean — no identity details leak to the client beyond "are you admin".
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { admin: !!session && session.role === "ADMIN" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
