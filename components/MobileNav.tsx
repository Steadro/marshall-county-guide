"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { mainNav } from "@/lib/site";
import { HashLink } from "@/components/HashLink";

const linkClass =
  "rounded-md px-3 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-16 border-b border-line/70 bg-paper/95 shadow-soft backdrop-blur-md">
          <nav className="container-page flex flex-col py-2">
            {mainNav.map((item) =>
              item.href.startsWith("/#") ? (
                <HashLink key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass}>
                  {item.label}
                </HashLink>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.prefetch}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
