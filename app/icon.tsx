import { ImageResponse } from "next/og";

// Favicon, generated (no static asset). Serif "M" monogram in gold on the brand
// pine gradient — matches the OG card (app/opengraph-image.tsx). Next emits the
// <link rel="icon"> automatically; this replaces the default globe in tabs and
// search results.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #3f6b54, #284946)",
          color: "#e3b34a",
          fontSize: 46,
          fontWeight: 700,
          fontFamily: "serif",
          borderRadius: 12,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
