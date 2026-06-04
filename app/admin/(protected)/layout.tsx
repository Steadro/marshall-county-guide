import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

// Authoritative guard for everything under the protected group. The proxy gate
// already bounced anonymous requests; this is the defense-in-depth re-check that
// actually runs in the request that renders the page.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-serif text-lg text-ink">
            Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-faint">{session.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-line px-3 py-1.5 text-ink transition-colors hover:bg-paper-2"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
