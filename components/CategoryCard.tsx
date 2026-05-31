import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { CategoryWithCount } from "@/lib/queries";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex items-center gap-4 rounded-card bg-card p-5 shadow-soft ring-1 ring-line/70 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clay-soft text-clay-dark transition-colors group-hover:bg-clay group-hover:text-white">
        <CategoryIcon slug={category.slug} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-base font-semibold text-ink">
          {category.name}
        </span>
        <span className="text-sm text-ink-faint">
          {category.count} {category.count === 1 ? "business" : "businesses"}
        </span>
      </span>
      <ArrowUpRight
        className="h-5 w-5 shrink-0 text-ink-faint transition-colors group-hover:text-clay"
        aria-hidden="true"
      />
    </Link>
  );
}
