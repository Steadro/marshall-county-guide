// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (function `middleware` ->
// `proxy`), and `proxy` runs on the Node.js runtime. See the v16 upgrade guide.
//
// This is the OPTIMISTIC auth gate: a cheap cookie-signature check that bounces
// unauthenticated requests away from /admin before they hit a page. It is NOT
// the security boundary on its own — every protected page and every mutating
// server action re-checks with `requireSession()` (the authoritative data-layer
// check). Next.js explicitly recommends this two-layer split.

import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_HINT_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/auth/session";

export const config = {
  // Only run on the admin area. Public pages pay no cost.
  matcher: ["/admin/:path*"],
};

// Re-issue the client-readable hint cookie whenever an authenticated admin hits
// an /admin route without it. This self-heals sessions created before the hint
// existed (and any cookie drift), so the public-page admin banner + edit links
// light up without forcing a re-login. Only admins reach here (see matcher), so
// it adds nothing to public traffic.
function ensureHint(res: NextResponse, req: NextRequest): NextResponse {
  if (req.cookies.get(SESSION_HINT_COOKIE)?.value !== "1") {
    res.cookies.set(SESSION_HINT_COOKIE, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isLoginRoute = pathname === "/admin/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, Math.floor(Date.now() / 1000));

  // Already authenticated and aiming at the login page -> send to the dashboard.
  if (isLoginRoute && session) {
    return ensureHint(NextResponse.redirect(new URL("/admin", req.nextUrl)), req);
  }

  // Unauthenticated and aiming at a protected admin route -> send to login,
  // remembering where they were headed (sanitized to an internal /admin path).
  if (!isLoginRoute && !session) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    const target = `${pathname}${search}`;
    if (target.startsWith("/admin")) loginUrl.searchParams.set("next", target);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated on a protected /admin route: proceed, re-arming the hint.
  return ensureHint(NextResponse.next(), req);
}
