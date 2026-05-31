// Deterministic placeholder art. Same business -> same palette, always, across
// builds (we hash the seed). Used by card art and the dynamic OG image route,
// so the logic lives here, framework-agnostic.

import { hashString, initials } from "./utils";

// Muted, harmonious earthy duotones, warm/local-craft, no neon. Each entry is
// [from, to, ink] where `ink` is the legible text color over the gradient.
export const PLACEHOLDER_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ["#c4663b", "#9c3e1f", "#fbf1e9"], // terracotta
  ["#4e6e55", "#314b3a", "#eef3ec"], // forest
  ["#c39a44", "#8f6820", "#fdf6e6"], // ochre / mustard
  ["#b3604a", "#7e3a2a", "#fdeee6"], // clay rose
  ["#7c7b3e", "#565626", "#f7f6e6"], // olive
  ["#3f6e6a", "#284946", "#e9f2f0"], // teal stone
  ["#7c5057", "#4d2e33", "#f6e9ea"], // plum brown
  ["#a9794f", "#785130", "#fcefe2"], // sand
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
