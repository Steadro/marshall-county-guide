// Synonym-aware directory search. Maps everyday words people actually type
// ("haircut", "urgent care", "tags", "wedding") to the right listings by folding
// curated per-category aliases into each business's searchable text. No AI, no
// runtime model, no network — pure client-side string matching, just smarter
// about meaning. (A semantic/embeddings upgrade is scoped as a follow-up.)

export const categoryAliases: Record<string, string[]> = {
  "restaurant-and-food": [
    "eat", "food", "dinner", "lunch", "breakfast", "brunch", "coffee", "cafe", "diner",
    "restaurant", "takeout", "bbq", "barbecue", "pizza", "mexican", "burgers", "bar",
    "drinks", "bakery", "pie", "dessert", "meat and three", "catering",
  ],
  "retail-and-shopping": [
    "shop", "shopping", "store", "buy", "boutique", "gifts", "clothing", "clothes",
    "antiques", "hardware", "grocery", "market", "thrift", "furniture", "flowers", "florist",
  ],
  "beauty-and-personal-care": [
    "haircut", "hair", "salon", "barber", "barbershop", "nails", "manicure", "pedicure",
    "spa", "beauty", "waxing", "lashes", "makeup", "stylist", "tanning", "tattoo",
  ],
  "health-and-medical": [
    "doctor", "clinic", "hospital", "urgent care", "medical", "health", "physician",
    "dentist", "dental", "pharmacy", "drugstore", "chiropractor", "therapy", "physical therapy",
    "family practice", "walk in", "primary care",
  ],
  automotive: [
    "car", "auto", "mechanic", "repair", "tires", "oil change", "body shop", "towing",
    "dealership", "parts", "garage", "transmission", "windshield",
  ],
  "home-and-trades": [
    "plumber", "plumbing", "electrician", "electrical", "hvac", "heating", "cooling", "ac",
    "contractor", "roofing", "roofer", "construction", "handyman", "lawn", "landscaping",
    "pest control", "cleaning", "painting", "flooring", "fencing", "septic",
  ],
  "professional-services": [
    "lawyer", "attorney", "legal", "accountant", "accounting", "cpa", "tax", "taxes",
    "insurance", "consultant", "notary", "marketing", "photography", "photographer", "printing", "web design",
  ],
  financial: ["bank", "credit union", "atm", "loan", "loans", "mortgage", "financial", "investment", "money"],
  "real-estate": [
    "realtor", "real estate", "homes for sale", "property", "rental", "rentals",
    "apartments", "agent", "broker", "land",
  ],
  "fitness-and-recreation": [
    "gym", "fitness", "workout", "exercise", "pool", "swimming", "park", "parks", "golf",
    "recreation", "rec center", "sports", "ballfield", "softball", "soccer", "trail", "greenway", "yoga",
  ],
  "childcare-and-education": [
    "daycare", "child care", "childcare", "preschool", "tutoring", "tutor", "learning",
    "education", "kids", "after school",
  ],
  "arts-and-entertainment": [
    "theatre", "theater", "museum", "art", "gallery", "music", "events", "entertainment",
    "shows", "history", "culture", "movies", "live music",
  ],
  agriculture: [
    "farm", "farms", "produce", "livestock", "feed", "seed", "nursery", "agriculture",
    "cattle", "hay", "honey", "eggs", "orchard",
  ],
  manufacturing: ["factory", "manufacturing", "industrial", "plant", "production", "fabrication"],
  "pets-and-animals": [
    "pet", "pets", "vet", "veterinarian", "veterinary", "animal", "dog", "cat", "grooming",
    "boarding", "kennel", "shelter", "adoption",
  ],
  other: [],
  "government-and-civic": [
    "courthouse", "county", "city hall", "town hall", "government", "mayor", "clerk",
    "trustee", "assessor", "register of deeds", "deeds", "dmv", "tags", "car tags",
    "license plate", "vehicle registration", "title", "post office", "usps", "mail",
    "library", "books", "recycling", "trash", "garbage", "landfill", "election", "vote",
    "voter", "voting", "property tax", "veterans", "emergency management", "health department",
  ],
  "public-safety": [
    "police", "sheriff", "cops", "fire", "fire department", "firefighter", "ems",
    "ambulance", "911", "jail", "detention", "animal control", "law enforcement", "emergency",
  ],
  schools: [
    "school", "schools", "elementary", "intermediate", "middle school", "high school",
    "education", "students", "district", "tigers", "bulldogs", "rockets", "technology center",
    "cte", "vocational", "college", "preschool",
  ],
  "places-of-worship": [
    "church", "churches", "worship", "congregation", "baptist", "methodist", "catholic",
    "church of christ", "presbyterian", "pentecostal", "faith", "religion", "religious",
    "mass", "service", "ministry", "chapel", "temple",
  ],
  "community-and-nonprofit": [
    "chamber", "chamber of commerce", "nonprofit", "charity", "food bank", "assistance",
    "senior center", "seniors", "vfw", "veterans", "rotary", "club", "community", "donation",
    "thrift", "help", "social services",
  ],
  "wedding-and-event-venues": [
    "wedding", "weddings", "venue", "venues", "event", "events", "reception", "banquet",
    "barn", "ceremony", "party", "rehearsal", "bridal",
  ],
};

interface SearchableBusiness {
  name: string;
  city: string;
  tagline?: string | null;
  shortDescription?: string | null;
  category: { name: string; slug: string };
}

/** Lowercased searchable text for a business, expanded with its category's aliases. */
function haystackFor(b: SearchableBusiness): string {
  return [
    b.name,
    b.category.name,
    b.city,
    b.tagline ?? "",
    b.shortDescription ?? "",
    ...(categoryAliases[b.category.slug] ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * True if the business matches the query. Every whitespace-separated term must
 * appear (substring) in the alias-expanded text, so "hair salon", "urgent care",
 * and "haircut" all resolve to the right listings. Empty query matches everything.
 */
export function matchesQuery(b: SearchableBusiness, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const hay = haystackFor(b);
  return terms.every((t) => hay.includes(t));
}
