"use client";

import Link from "next/link";
import { useAdmin } from "./AdminContext";

// Global "you are logged in as admin" strip, rendered under the header. Returns
// null for everyone who isn't a confirmed admin, so it adds nothing to the
// public page (no layout shift, no content for crawlers).
export function AdminBanner() {
  const { isAdmin, signOut } = useAdmin();
  if (!isAdmin) return null;

  return (
    <div className="bg-pine-dark text-paper">
      <div className="container-page flex items-center justify-between gap-3 py-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold" />
          You are logged in as admin.
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="underline decoration-paper/40 underline-offset-4 hover:decoration-paper"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-md border border-paper/30 px-2.5 py-1 font-medium transition-colors hover:bg-paper/10"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
