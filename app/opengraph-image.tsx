import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// Default social share card. Lives at the app root, so every route that doesn't
// ship its own opengraph-image inherits this (homepage, towns, categories,
// about, etc.). Business pages override it with their own per-listing card.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — local business directory for Marshall County, Tennessee`;

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundImage: "linear-gradient(135deg, #c4663b, #9c3e1f)",
          color: "#fbf1e9",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, textTransform: "uppercase", letterSpacing: 6, opacity: 0.9 }}>
          Marshall County, Tennessee
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 100, fontWeight: 700, lineHeight: 1.02 }}>{siteConfig.name}</div>
          <div style={{ display: "flex", fontSize: 40, opacity: 0.92, marginTop: 20, maxWidth: 920 }}>
            {siteConfig.tagline}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
          Local restaurants, shops, makers, and services
        </div>
      </div>
    ),
    size,
  );
}
