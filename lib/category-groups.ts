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
export interface SubcategoryCount {
  name: string;
  count: number;
}

export interface BrowseCat {
  slug: string;
  name: string;
  count: number;
  samples: string[];
  // The category's subcategories (venue/type axis) with counts, most-common
  // first. Drives the type chips in the browse pane. Empty if none classified.
  subcategories: SubcategoryCount[];
}

export interface BrowseGroup {
  key: string;
  title: string;
  blurb: string;
  accent: GroupAccent;
  categories: BrowseCat[];
  count: number;
}

// --- Multi-type support -----------------------------------------------------
// A business has one primary `subcategory`, but can carry secondary "types" as
// tags whose name matches a known subcategory — e.g. a donut shop that's a
// `Bakery` and also serves meals gets a `Restaurant` tag, so it shows under both
// type chips without a schema change. A tag only counts as a type if it matches
// a subcategory that actually exists in the set, so cuisine/attribute tags (BBQ,
// dog-friendly) never become type chips.

export interface TypedBusiness {
  subcategory: string | null;
  tags: { name: string }[];
}

/** Distinct primary subcategory names present — the valid "type" names. */
export function knownTypeNames(items: TypedBusiness[]): Set<string> {
  const names = new Set<string>();
  for (const b of items) if (b.subcategory) names.add(b.subcategory);
  return names;
}

/** Every type chip a business belongs to: its subcategory + matching type-tags. */
export function typesOf(b: TypedBusiness, known: Set<string>): string[] {
  const types = new Set<string>();
  if (b.subcategory) types.add(b.subcategory);
  for (const t of b.tags) if (known.has(t.name)) types.add(t.name);
  return [...types];
}

// Consumer categories — the browse top level, by visitor/resident intent. These
// are the "promote groups to categories" buckets: broad and obvious, named to
// match the "Just visiting?" cards (Eat & Drink, Outdoors & Rec, History &
// Culture) so the hero and the browse reinforce instead of compete. The DB
// categories underneath stay as the type/subcategory tier. See schema/TAXONOMY.md.
export const COMMERCIAL_GROUPS: CategoryGroupDef[] = [
  {
    key: "eat-and-drink",
    title: "Eat & Drink",
    blurb: "Restaurants, cafes, and everywhere to grab a bite.",
    accent: "gold",
    categorySlugs: ["restaurant-and-food"],
  },
  {
    key: "shop",
    title: "Shop",
    blurb: "Shops, markets, makers, and main-street finds.",
    accent: "creek",
    categorySlugs: ["retail-and-shopping"],
  },
  {
    key: "outdoors-and-recreation",
    title: "Outdoors & Recreation",
    blurb: "Parks, trails, ball fields, and places to get moving.",
    accent: "pine",
    categorySlugs: ["fitness-and-recreation"],
  },
  {
    key: "arts-history-and-culture",
    title: "Arts, History & Culture",
    blurb: "Museums, theatre, the courthouse square, and event venues.",
    accent: "rose",
    categorySlugs: ["arts-and-entertainment", "wedding-and-event-venues"],
  },
  {
    key: "home-auto-and-services",
    title: "Home, Auto & Services",
    blurb: "Mechanics, builders, repairs, and the people who fix things.",
    accent: "terracotta",
    categorySlugs: ["automotive", "home-and-trades"],
  },
  {
    key: "professional-and-financial",
    title: "Professional & Financial",
    blurb: "Banks, insurance, agents, lawyers, and professional help.",
    accent: "slate",
    categorySlugs: ["financial", "professional-services", "real-estate"],
  },
  {
    key: "health-and-beauty",
    title: "Health & Beauty",
    blurb: "Clinics, dentists, pharmacies, salons, and self-care.",
    accent: "violet",
    categorySlugs: ["health-and-medical", "beauty-and-personal-care"],
  },
  {
    key: "pets-kids-and-farm",
    title: "Pets, Kids & Farm",
    blurb: "Vets, childcare, and the agricultural backbone.",
    accent: "creek",
    categorySlugs: ["pets-and-animals", "childcare-and-education", "agriculture"],
  },
  {
    key: "industry-and-employers",
    title: "Industry & Employers",
    blurb: "The manufacturers and plants that power the local economy.",
    accent: "terracotta",
    categorySlugs: ["manufacturing"],
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
  subs?: Map<string, SubcategoryCount[]>,
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
      subcategories: subs?.get(slug) ?? [],
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
