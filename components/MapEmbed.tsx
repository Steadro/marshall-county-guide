// Single-place map as a Google Maps Embed API iframe. Embed loads are free and
// unlimited (unlike Maps JavaScript API loads, which count against the daily
// quota), and the iframe lazy-loads, so business pages cost nothing per view.
// Multi-pin maps (category pages) still use LocationMap.

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function MapEmbed({ query, zoom, title }: { query: string; zoom: number; title: string }) {
  if (!API_KEY) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-card bg-paper-2 text-sm text-ink-faint ring-1 ring-line/70">
        Map unavailable
      </div>
    );
  }
  const src = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}&zoom=${zoom}`;
  return (
    <iframe
      title={title}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
      className="h-80 w-full rounded-card border-0 bg-paper-2 ring-1 ring-line/70"
    />
  );
}
