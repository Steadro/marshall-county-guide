import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // No remote images in v1 (listings are text + a website link). Add
  // remotePatterns here if real photos are ever introduced.
  images: {
    // AVIF first (≈30–50% smaller than WebP) for the hero/LCP image; WebP
    // fallback for browsers without AVIF. Long cache since photos are static.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    // Next requires an explicit allowlist of optimizer qualities. 60 for the
    // hero (invisible behind the scrim, smaller LCP); 75 is the default for the
    // rest. Keep this in sync with any quality={…} overrides in components.
    qualities: [60, 75],
  },
  outputFileTracingExcludes: {
    "*": ["./app/generated/**/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
