"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useAdmin } from "./AdminContext";

// Admin-only "edit this listing" affordance on a public business page. Renders
// nothing for non-admins. The target (/admin/business/[id]) is itself server-
// protected, so this is pure convenience — spoofing the client check yields a
// link that just bounces to /admin/login.
export function AdminEditLink({ businessId }: { businessId: string }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;

  return (
    <Link
      href={`/admin/business/${businessId}`}
      className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-pine-line bg-pine-soft px-3 py-1.5 text-sm font-medium text-pine-ink transition-colors hover:bg-pine hover:text-paper"
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
      Edit listing
    </Link>
  );
}
