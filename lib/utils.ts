// Small dependency-free helpers shared across the app.

/** Join class names, dropping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** URL-safe kebab-case slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "") // drop apostrophes/periods so "O'Reilly" -> "oreilly"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Deterministic 32-bit hash (FNV-1a), stable across builds for placeholders. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Initials/monogram for placeholder art (max 2 chars). */
export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^(the|and|of|a|an)$/i.test(w));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Format a US phone number for display; returns the raw string if unparseable. */
export function formatPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  }
  return raw.trim() || null;
}

/** `tel:` href from a phone string, or null if there aren't enough digits. */
export function telHref(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 ? `tel:+1${digits.slice(-10)}` : null;
}

/** Strip protocol + trailing slash for displaying a website URL compactly. */
export function prettyUrl(url?: string | null): string | null {
  if (!url) return null;
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

/** Ensure a URL has a protocol (so href works for "example.com"). */
export function ensureHttp(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}
