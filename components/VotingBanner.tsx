"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Vote, X } from "lucide-react";
import { votingNotice } from "@/lib/site";

const DISMISS_KEY = `mcg-voting-dismissed-${votingNotice.id}`;

// Sitewide eyebrow pointing voters to the Secretary of State's GoVoteTN page
// during an election window. The layout stops rendering it once the window
// closes; this effect also hides it on statically cached pages rendered before
// then, and remembers a dismissal for this election.
export function VotingBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // storage blocked: just show it
    }
    if (dismissed || Date.now() >= votingNotice.endsAt.getTime()) setHidden(true);
  }, []);

  if (hidden) return null;

  return (
    <div className="border-b border-creek/25 bg-creek-soft">
      <div className="container-page relative flex items-center justify-center gap-x-3 gap-y-1 py-2.5 pr-10 text-center text-sm text-creek-dark max-sm:flex-col">
        <p className="inline-flex items-center gap-2">
          <Vote className="h-4 w-4 shrink-0 max-sm:hidden" aria-hidden="true" />
          <span>
            <span className="font-semibold">{votingNotice.headline}</span> {votingNotice.detail}
          </span>
        </p>
        <a
          href={votingNotice.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2 hover:text-ink"
        >
          {votingNotice.linkLabel}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(opens the Tennessee Secretary of State site)</span>
        </a>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              // storage blocked: hide for this page view only
            }
            setHidden(true);
          }}
          aria-label="Dismiss voting information"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-creek-dark/70 transition hover:bg-creek/10 hover:text-creek-dark"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
