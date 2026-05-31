// Soft pastel per category, used as the background of category tags. Each pairs
// a light pastel `bg` with a dark same-hue `text` that meets WCAG AA on it.
// Warm-leaning to sit in the cream/clay theme, with enough hue variety to read
// each category at a glance.

export interface CategoryColor {
  bg: string;
  text: string;
}

export const categoryColors: Record<string, CategoryColor> = {
  "restaurant-and-food": { bg: "#fbe0da", text: "#a8331f" }, // warm red
  "retail-and-shopping": { bg: "#fbe1ec", text: "#a32f63" }, // rose
  "beauty-and-personal-care": { bg: "#f1e2f7", text: "#7a3f96" }, // lavender
  "health-and-medical": { bg: "#d9efe5", text: "#1c6e50" }, // teal-green
  automotive: { bg: "#dfe7f3", text: "#34527c" }, // slate blue
  "home-and-trades": { bg: "#f6e6cf", text: "#855a1c" }, // amber
  "professional-services": { bg: "#e0ecf7", text: "#2a567f" }, // blue
  financial: { bg: "#dcefdd", text: "#28683f" }, // green
  "real-estate": { bg: "#e4e3f7", text: "#494596" }, // periwinkle
  "fitness-and-recreation": { bg: "#ffe6d4", text: "#a04f1a" }, // orange
  "childcare-and-education": { bg: "#fbeeca", text: "#7a5e15" }, // gold
  "arts-and-entertainment": { bg: "#efe0f5", text: "#6f3790" }, // purple
  agriculture: { bg: "#e7efcf", text: "#54661c" }, // olive
  manufacturing: { bg: "#e4e7ea", text: "#424c57" }, // steel gray
  other: { bg: "#ece5da", text: "#5f5443" }, // sand
};

export function categoryColor(slug: string): CategoryColor {
  return categoryColors[slug] ?? categoryColors.other;
}
