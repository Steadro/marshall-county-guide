import { ImageResponse } from "next/og";

// Apple touch icon (iOS home screen / bookmarks). Same mark as app/icon.tsx,
// scaled up: pine serif "M" on warm cream with a red Tennessee star on the
// upper-left corner. iOS masks the corners itself, so the ground is full-bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const STAR =
  "12,1 15.09,8.26 22.5,9.27 17.25,14.14 18.18,21.5 12,18 5.82,21.5 6.75,14.14 1.5,9.27 8.91,8.26";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4efe2",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#2c5544",
            fontSize: 124,
            fontWeight: 700,
            fontFamily: "serif",
          }}
        >
          M
        </div>
        <svg
          width="84"
          height="84"
          viewBox="0 0 24 24"
          style={{ position: "absolute", top: 14, left: 14 }}
        >
          <polygon points={STAR} fill="#c8202e" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
