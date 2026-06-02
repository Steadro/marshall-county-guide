// Two-tier taxonomy for the directory browse experience.
//
// Categories stay exactly as they are in the DB (slugs unchanged, URLs unchanged).
// This is a *presentation* layer that folds the ~21 flat categories under a handful
// of plain-English groups, plus pulls civic/government categories into their own
// demoted section. Any category slug not listed here is swept into "Everything Else"
// at render time, so nothing ever silently disappears from the wall.
//
// This file is intentionally pure data + types so it can back both the /browse-test
// mockup and (later) the real browse page without a schema change.

export type GroupAccent =
  | "gold"
  | "creek"
  | "pine"
  | "terracotta"
  | "rose"
  | "violet"
  | "slate";

export interface CategoryGroupDef {
  key: string;
  title: string;
  blurb: string;
  accent: GroupAccent;
  categorySlugs: string[];
}

// Runtime shapes passed to the client layouts (plain, serializable).
export interface BrowseCat {
  slug: string;
  name: string;
  count: number;
  samples: string[];
}

export interface BrowseGroup {
  key: string;
  title: string;
  blurb: string;
  accent: GroupAccent;
  categories: BrowseCat[];
  count: number;
}

// Commercial groups — the part residents "shop."
export const COMMERCIAL_GROUPS: CategoryGroupDef[] = [
  {
    key: "food-and-dining",
    title: "Food & Dining",
    blurb: "Restaurants, cafes, and everywhere to grab a bite.",
    accent: "gold",
    categorySlugs: ["restaurant-and-food"],
  },
  {
    key: "shopping-and-goods",
    title: "Shopping & Goods",
    blurb: "Shops, markets, makers, and places to spend an afternoon.",
    accent: "creek",
    categorySlugs: [
      "retail-and-shopping",
      "arts-and-entertainment",
      "wedding-and-event-venues",
    ],
  },
  {
    key: "home-auto-trades",
    title: "Home, Auto & Trades",
    blurb: "Builders, mechanics, makers, and the people who fix things.",
    accent: "terracotta",
    categorySlugs: ["automotive", "home-and-trades", "manufacturing"],
  },
  {
    key: "money-property-pro",
    title: "Money, Property & Pro Services",
    blurb: "Banks, offices, agents, and professional help.",
    accent: "pine",
    categorySlugs: ["financial", "professional-services", "real-estate"],
  },
  {
    key: "health-and-wellness",
    title: "Health & Wellness",
    blurb: "Clinics, salons, gyms, and looking after yourself.",
    accent: "rose",
    categorySlugs: [
      "health-and-medical",
      "beauty-and-personal-care",
      "fitness-and-recreation",
    ],
  },
  {
    key: "family-pets-farm",
    title: "Family, Pets & Farm",
    blurb: "Childcare, animals, and the agricultural backbone.",
    accent: "violet",
    categorySlugs: ["childcare-and-education", "pets-and-animals", "agriculture"],
  },
];

// Civic group — present and indexable, but demoted out of the commercial wall.
export const CIVIC_GROUP: CategoryGroupDef = {
  key: "community-and-government",
  title: "Community & Government",
  blurb: "Town services, schools, safety, worship, and nonprofits.",
  accent: "slate",
  categorySlugs: [
    "government-and-civic",
    "schools",
    "public-safety",
    "community-and-nonprofit",
    "places-of-worship",
  ],
};

export const EVERYTHING_ELSE: CategoryGroupDef = {
  key: "everything-else",
  title: "Everything Else",
  blurb: "Anything that hasn't found a home in a group yet.",
  accent: "slate",
  categorySlugs: [],
};

export interface BrowseCatInput {
  slug: string;
  name: string;
  count: number;
}

// Fold a flat category list into the two-tier taxonomy. Pure + serializable so it
// runs in a Server Component. `samples` is an optional slug -> business-name map used
// to show a couple of example businesses per category tile.
export function buildBrowseGroups(
  categories: BrowseCatInput[],
  samples?: Map<string, string[]>,
): { commercial: BrowseGroup[]; civic: BrowseGroup; total: number } {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const used = new Set<string>();

  const toCat = (slug: string): BrowseCat | null => {
    const c = bySlug.get(slug);
    if (!c) return null;
    return {
      slug: c.slug,
      name: c.name,
      count: c.count,
      samples: (samples?.get(slug) ?? []).slice(0, 2),
    };
  };

  const buildGroup = (def: CategoryGroupDef): BrowseGroup => {
    const cats = def.categorySlugs.flatMap((slug) => {
      used.add(slug);
      const cat = toCat(slug);
      return cat ? [cat] : [];
    });
    return {
      key: def.key,
      title: def.title,
      blurb: def.blurb,
      accent: def.accent,
      categories: cats,
      count: cats.reduce((n, c) => n + c.count, 0),
    };
  };

  const commercial = COMMERCIAL_GROUPS.map(buildGroup).filter(
    (g) => g.categories.length > 0,
  );
  const civic = buildGroup(CIVIC_GROUP);

  // Sweep any unmapped category into "Everything Else" so nothing is dropped.
  const leftover = categories.flatMap((c) => {
    if (used.has(c.slug)) return [];
    const cat = toCat(c.slug);
    return cat ? [cat] : [];
  });
  if (leftover.length > 0) {
    commercial.push({
      key: EVERYTHING_ELSE.key,
      title: EVERYTHING_ELSE.title,
      blurb: EVERYTHING_ELSE.blurb,
      accent: EVERYTHING_ELSE.accent,
      categories: leftover,
      count: leftover.reduce((n, c) => n + c.count, 0),
    });
  }

  const total = categories.reduce((n, c) => n + c.count, 0);
  return { commercial, civic, total };
}
