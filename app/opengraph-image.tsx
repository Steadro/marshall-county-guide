import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/site";

// Default social share card, built to mirror the homepage hero: paper ground,
// the headline with "Marshall County" in green italic, and the courthouse photo
// fading in on the right. Inherited by every route without its own card.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — local business directory for Marshall County, Tennessee`;

export default async function OgImage() {
  const photo = await readFile(join(process.cwd(), "public/images/lewisburg-courthouse.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", backgroundColor: "#f5f2e8" }}>
        <img
          width={780}
          height={630}
          src={photoSrc}
          style={{ position: "absolute", top: 0, right: 0, width: 780, height: 630, objectFit: "cover" }}
        />
        {/* fade the photo into the paper ground on its left edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, #f5f2e8 36%, rgba(245,242,232,0.55) 60%, rgba(245,242,232,0) 78%)",
          }}
        />
        {/* text column */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 720,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 72,
            fontFamily: "serif",
          }}
        >
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#3f6b54", fontWeight: 600 }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.08, color: "#1f2a23", marginTop: 18, maxWidth: 580 }}>
            Discover the places that make Marshall County home.
          </div>
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: "#4b554f", marginTop: 26, maxWidth: 540 }}>
            Local restaurants, shops, makers, and services across the county.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
