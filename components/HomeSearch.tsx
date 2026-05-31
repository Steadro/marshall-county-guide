"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/businesses?q=${encodeURIComponent(q)}` : "/businesses");
  }

  return (
    <form onSubmit={submit} className="mt-6 flex w-full max-w-md items-center gap-2" role="search">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search restaurants, shops, services…"
          aria-label="Search the directory"
          className="w-full rounded-pill border border-line bg-card py-3 pl-11 pr-4 text-sm text-ink shadow-soft outline-none transition focus:border-clay focus:ring-2 focus:ring-clay/20"
        />
      </div>
      <button
        type="submit"
        className="rounded-pill bg-clay px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-clay-dark"
      >
        Search
      </button>
    </form>
  );
}
