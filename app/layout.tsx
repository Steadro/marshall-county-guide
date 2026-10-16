import type { Metadata } from "next";
import { Fraunces, Inter, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HashLink } from "@/components/HashLink";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { AdminProvider } from "@/components/admin/AdminContext";
import { AdminBanner } from "@/components/admin/AdminBanner";
import { VotingBanner } from "@/components/VotingBanner";
import { siteConfig, votingNotice } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-fancy",
  display: "swap",
  // Only the homepage hero (RotatingPlace) uses it; don't preload it on every page.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `${siteConfig.name} | %s`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Marshall County TN",
    "local business directory",
    "Lewisburg TN",
    "Chapel Hill TN",
    "Cornersville",
    "Petersburg TN",
    "Belfast TN",
    "shop local",
  ],
  // Page-specific og:/twitter: tags come from pageMetadata() in each page; the
  // layout only sets defaults that hold everywhere.
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">
        <HashLink
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-pine focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </HashLink>
        <AdminProvider>
          {Date.now() < votingNotice.endsAt.getTime() ? <VotingBanner /> : null}
          <Header />
          <AdminBanner />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </AdminProvider>
        <SiteAnalytics />
      </body>
    </html>
  );
}
