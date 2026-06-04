// Cookie names shared by the server (lib/auth, proxy) and the client (admin UI).
// Dependency-free on purpose: importing this into a client bundle pulls in NO
// server/crypto code (unlike session.ts).

export const SESSION_COOKIE = "mcg_admin_session";

// Non-sensitive, non-httpOnly companion flag. The session cookie is httpOnly
// (the source of truth, verified server-side), so client code can't read it. The
// hint just lets the browser cheaply decide "might be admin -> confirm via
// /api/admin/me" vs "definitely not -> skip the call". It carries no secret:
// forging it only triggers a server check that returns admin=false.
export const SESSION_HINT_COOKIE = "mcg_admin_hint";
