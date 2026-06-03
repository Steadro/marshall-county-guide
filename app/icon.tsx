import { ImageResponse } from "next/og";

// Favicon, generated (no static asset). Pine serif "M" on warm cream with a red
// Tennessee star on the upper-left corner — a nod to the local civic look
// (cf. the county school-system mark), in our brand palette (pine + gold theme,
// flag-red star). Next emits <link rel="icon"> automatically.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// 5-point star, viewBox 0 0 24 24, pointing up.
const STAR =
  "12,1 15.09,8.26 22.5,9.27 17.25,14.14 18.18,21.5 12,18 5.82,21.5 6.75,14.14 1.5,9.27 8.91,8.26";

export default function Icon() {
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
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#2c5544",
            fontSize: 44,
            fontWeight: 700,
            fontFamily: "serif",
          }}
        >
          M
        </div>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          style={{ position: "absolute", top: 2, left: 2 }}
        >
          <polygon points={STAR} fill="#c8202e" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
