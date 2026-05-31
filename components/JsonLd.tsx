/**
 * Renders a JSON-LD <script>. We stringify server-side; the object is
 * developer-controlled (no user input), and we escape "<" to avoid breaking
 * out of the script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
