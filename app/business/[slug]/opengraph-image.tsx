import { ImageResponse } from "next/og";
import { getBusinessBySlug } from "@/lib/queries";
import { placeholderArt } from "@/lib/placeholder";
import { siteConfig } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Business listing";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await getBusinessBySlug(slug);

  const name = b?.name ?? siteConfig.name;
  const category = b?.category.name ?? "Local Business";
  const town = b ? `${b.city}, ${b.state}` : siteConfig.region;
  const { from, to, ink, monogram } = placeholderArt(slug, name);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          color: ink,
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, opacity: 0.9 }}>
          <span style={{ textTransform: "uppercase", letterSpacing: 4 }}>{category}</span>
          <span>{town}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              borderRadius: 32,
              background: "rgba(255,255,255,0.14)",
              fontSize: 110,
              fontWeight: 700,
            }}
          >
            {monogram}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <span style={{ fontSize: name.length > 28 ? 64 : 84, fontWeight: 700, lineHeight: 1.05 }}>
              {name}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>
          {siteConfig.name} · Marshall County, TN
        </div>
      </div>
    ),
    size,
  );
}
