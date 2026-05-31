import { categoryColor } from "@/lib/category-colors";
import { cn } from "@/lib/utils";

/** A category pill tinted with the category's pastel color. */
export function CategoryTag({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  const { bg, text } = categoryColor(slug);
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {name}
    </span>
  );
}
