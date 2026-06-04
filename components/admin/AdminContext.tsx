"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut as signOutAction } from "@/app/admin/actions";
import { SESSION_HINT_COOKIE } from "@/lib/auth/constants";

interface AdminState {
  isAdmin: boolean;
  ready: boolean; // the admin check has resolved (vs. still in flight)
  signOut: () => Promise<void>;
}

const AdminContext = createContext<AdminState>({
  isAdmin: false,
  ready: false,
  signOut: async () => {},
});

function hasHintCookie(): boolean {
  return document.cookie.split("; ").some((c) => c === `${SESSION_HINT_COOKIE}=1`);
}

/**
 * Provides admin status to client UI on public (statically generated) pages
 * WITHOUT making those pages dynamic. The static HTML is identical for everyone;
 * this layer activates after hydration:
 *   - anonymous visitors have no hint cookie -> zero network calls
 *   - if the hint is present, confirm authoritatively via /api/admin/me (which
 *     verifies the real httpOnly signed session server-side)
 * Initial state is always non-admin so server HTML and first client render match
 * (no hydration mismatch); the effect flips it on for real admins a beat later.
 *
 * The check re-runs on every client navigation (usePathname), not just on mount.
 * This matters because login redirects via client-side navigation — the root
 * layout (and this provider) never remounts — so a mount-only check would stay
 * stale until a full refresh. Once admin is confirmed we stop re-checking (status
 * only drops on logout, which hard-reloads the page).
 */
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isAdmin) return; // already confirmed; nothing drops admin without a reload
    if (!hasHintCookie()) {
      setReady(true);
      return;
    }
    let active = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((d) => {
        if (!active) return;
        setIsAdmin(Boolean(d.admin));
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [pathname, isAdmin]);

  const signOut = useCallback(async () => {
    await signOutAction();
    setIsAdmin(false);
    // Full reload so any other admin-only UI on the page (e.g. a listing's edit
    // button) clears too, and the now-deleted hint cookie is gone for good.
    window.location.reload();
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, ready, signOut }}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminState {
  return useContext(AdminContext);
}
