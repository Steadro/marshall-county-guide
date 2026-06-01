// Deterministic placeholder art. Same business -> same palette, always, across
// builds (we hash the seed). Used by card art and the dynamic OG image route,
// so the logic lives here, framework-agnostic.

import { hashString, initials } from "./utils";

// Harmonious "Courthouse Green" duotones, no neon, no brown. Centered on the
// brand families (pine, creek, goldenrod) with clay rose for warm variety. Each
// entry is [from, to, ink] where `ink` is the legible text color over the gradient.
export const PLACEHOLDER_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#3f6b54", "#284946", "#eef2ec"], // pine
  ["#5b8bb0", "#3c6485", "#eaf2f8"], // creek blue
  ["#d4a13f", "#a1721d", "#fbf4e0"], // goldenrod
  ["#c07a63", "#8f5240", "#f7ece7"], // clay rose
  ["#6f8b5b", "#4a5e38", "#f0f4e9"], // sage
  ["#3f7e74", "#27514a", "#e9f2f0"], // teal stone
  ["#6d77a6", "#454e7e", "#eef0f8"], // slate periwinkle
  ["#4d7fa3", "#2f5573", "#e9f1f6"], // lake deep
];

export interface PlaceholderArt {
  from: string;
  to: string;
  ink: string;
  monogram: string;
  /** gradient angle in degrees, varied per-seed so cards don't all look alike */
  angle: number;
}

export function placeholderArt(seed: string, label: string): PlaceholderArt {
  const h = hashString(seed);
  const [from, to, ink] = PLACEHOLDER_PALETTES[h % PLACEHOLDER_PALETTES.length];
  return {
    from,
    to,
    ink,
    monogram: initials(label),
    angle: 115 + (h % 50),
  };
}
