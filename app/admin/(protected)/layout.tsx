import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

// Always reflect the live unread count in the nav badge.
export const dynamic = "force-dynamic";

// Authoritative guard for everything under the protected group. The proxy gate
// already bounced anonymous requests; this is the defense-in-depth re-check that
// actually runs in the request that renders the page.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const newIntake = await prisma.submission.count({ where: { status: "NEW" } });

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/admin" className="mr-2 font-serif text-lg text-ink">
              Admin
            </Link>
            <Link
              href="/admin"
              className="rounded-md px-3 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            >
              Listings
            </Link>
            <Link
              href="/admin/intake"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            >
              Intake
              {newIntake > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-xs font-semibold text-gold-dark">
                  {newIntake}
                </span>
              ) : null}
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-faint sm:inline">{session.email}</span>
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
