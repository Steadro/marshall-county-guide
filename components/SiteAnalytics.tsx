"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// Cookieless page counts. Drop the query string so homepage search text
// (/businesses?q=…) never reaches the analytics. Module scope keeps the
// reference stable, so it isn't re-registered on every render.
const stripQuery: BeforeSend = (e) => ({ ...e, url: e.url.split("?")[0] });

export function SiteAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
