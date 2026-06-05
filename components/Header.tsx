import Link from "next/link";
import Image from "next/image";
import { siteConfig, mainNav } from "@/lib/site";
import { MobileNav } from "@/components/MobileNav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="container-page relative flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <Image
            src="/logo.svg"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold text-ink">{siteConfig.name}</span>
            <span className="text-[11px] uppercase tracking-wider text-ink-faint">
              Marshall County, TN
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin login is intentionally unlinked from the public UI — reach it
            directly at /admin/login (bookmark it). */}

        <MobileNav />
      </div>
    </header>
  );
}
