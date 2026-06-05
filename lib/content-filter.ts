// Lightweight, dependency-free content screen for public submissions.
//
// It does NOT block — it sets a flag for human review in the admin Intake queue.
// Nothing auto-publishes, so this is a convenience to draw attention, not a hard
// gate. It catches profanity/slurs; it will NOT catch clean-but-disturbing text
// (that needs a human or the future LLM triage).
//
// Two tiers:
//  - SEVERE: terms that never appear inside legitimate words → substring match
//    (so light obfuscation / compounds still trip).
//  - WORDS: profanity matched on word boundaries to avoid the "Scunthorpe
//    problem" (e.g. "class", "assistant", "Dick's", "Scunthorpe").
//
// Extend privately (without committing terms to this PUBLIC repo) via the
// MODERATION_EXTRA_WORDS env var: comma-separated, matched on word boundaries.

// Hard slurs (substring). Kept short here; add the rest via MODERATION_EXTRA_WORDS.
const SEVERE = ["nigg", "fagg", "kike", "chink", "spic", "wetback", "tranny", "retard"];

// Profanity + sexual terms (word-boundary).
// Note: deliberately omits collision-prone terms like "dick"/"cock" that appear
// in legitimate business names (Dick's Sporting Goods, Cock & Bull). Add them via
// MODERATION_EXTRA_WORDS if you want them.
const WORDS = [
  "fuck", "shit", "bitch", "cunt", "whore", "slut", "bastard",
  "pussy", "asshole", "dumbass", "jackass", "motherfucker", "bullshit", "piss",
  "porn", "rape", "rapist", "molest", "pedophile", "nazi",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    // common leetspeak so "f4ggot" / "sh1t" still trip
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    // collapse anything non-letter to a space so word boundaries are clean
    .replace(/[^a-z]+/g, " ")
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Screen arbitrary submitted text. Returns whether it tripped the filter and the
 * matched terms (for the admin flag note). Never throws.
 */
export function screenText(text: string): { flagged: boolean; terms: string[] } {
  const norm = normalize(text);
  if (!norm) return { flagged: false, terms: [] };

  const hits = new Set<string>();
  for (const t of SEVERE) if (norm.includes(t)) hits.add(t);

  const extra = (process.env.MODERATION_EXTRA_WORDS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

  for (const t of [...WORDS, ...extra]) {
    if (new RegExp(`\\b${escapeRe(t)}\\b`).test(norm)) hits.add(t);
  }

  return { flagged: hits.size > 0, terms: [...hits] };
}
