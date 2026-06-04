// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (function `middleware` ->
// `proxy`), and `proxy` runs on the Node.js runtime. See the v16 upgrade guide.
//
// This is the OPTIMISTIC auth gate: a cheap cookie-signature check that bounces
// unauthenticated requests away from /admin before they hit a page. It is NOT
// the security boundary on its own — every protected page and every mutating
// server action re-checks with `requireSession()` (the authoritative data-layer
// check). Next.js explicitly recommends this two-layer split.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const config = {
  // Only run on the admin area. Public pages pay no cost.
  matcher: ["/admin/:path*"],
};

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isLoginRoute = pathname === "/admin/login";

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, Math.floor(Date.now() / 1000));

  // Already authenticated and aiming at the login page -> send to the dashboard.
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  // Unauthenticated and aiming at a protected admin route -> send to login,
  // remembering where they were headed (sanitized to an internal /admin path).
  if (!isLoginRoute && !session) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    const target = `${pathname}${search}`;
    if (target.startsWith("/admin")) loginUrl.searchParams.set("next", target);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
