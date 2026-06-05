import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteConfig } from "@/lib/site";

// Default social share card: the homepage courthouse hero photo with the title
// over it (mirrors the front page) instead of a flat brand graphic. Inherited by
// every route without its own opengraph-image; business pages override per-listing.
export const runtime = "nodejs"; // need fs to read the hero photo
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — local business directory for Marshall County, Tennessee`;

export default async function OgImage() {
  const photo = await readFile(join(process.cwd(), "public/images/lewisburg-courthouse.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex" }}>
        <img
          width={1200}
          height={630}
          src={photoSrc}
          style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 80,
            backgroundImage:
              "linear-gradient(to top, rgba(14,34,24,0.92) 0%, rgba(14,34,24,0.45) 45%, rgba(14,34,24,0.12) 100%)",
            color: "#f5f2e9",
            fontFamily: "serif",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              textTransform: "uppercase",
              letterSpacing: 6,
              opacity: 0.9,
            }}
          >
            Marshall County, Tennessee
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 10, lineHeight: 1.02 }}>
            {siteConfig.name}
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.95, marginTop: 16, maxWidth: 1000 }}>
            Local restaurants, shops, makers, and services across Marshall County.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
