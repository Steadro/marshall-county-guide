import type { Metadata } from "next";

// Keep the entire /admin tree (login included) out of search indexes. This is
// hygiene, not security — the gate is the auth, not the obscurity.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
