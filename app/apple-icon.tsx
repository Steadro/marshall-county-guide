import { ImageResponse } from "next/og";

// Apple touch icon (iOS home screen / bookmarks). Full-bleed pine — iOS masks
// the corners itself — with a larger gold serif "M" to match app/icon.tsx.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 128,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
