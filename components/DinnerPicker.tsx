"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, X, Dices, ArrowRight } from "lucide-react";
import type { RestaurantPick } from "@/lib/queries";

interface Town {
  slug: string;
  name: string;
}

export function DinnerPicker({
  restaurants,
  towns,
}: {
  restaurants: RestaurantPick[];
  towns: Town[];
}) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState<string | null>(null); // null = not chosen, "*" = anywhere
  const [result, setResult] = useState<RestaurantPick | null>(null);
  const [display, setDisplay] = useState("");
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Native modal <dialog>: showModal() moves focus in, traps it, makes the page
  // inert, closes on Escape, and returns focus to the trigger on close.
  const dialog = useRef<HTMLDialogElement>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  // Towns that actually have local restaurants, in TOWNS order.
  const townsWithFood = towns.filter((t) =>
    restaurants.some((r) => r.city.toLowerCase() === t.name.toLowerCase()),
  );

  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  function resetState() {
    clearTimer();
    setCity(null);
    setResult(null);
    setDisplay("");
    setSpinning(false);
  }

  function spin(list: RestaurantPick[]) {
    if (list.length === 0) return;
    clearTimer();
    let idx = Math.floor(Math.random() * list.length);
    // Reduced motion: skip the slot-machine cycling and show the pick directly.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setResult(list[idx]);
      setSpinning(false);
      return;
    }
    setResult(null);
    setSpinning(true);
    let delay = 45;
    let elapsed = 0;
    const total = 2000;
    const tick = () => {
      idx = (idx + 1) % list.length;
      setDisplay(list[idx].name);
      elapsed += delay;
      if (elapsed >= total) {
        setResult(list[idx]);
        setSpinning(false);
        return;
      }
      delay = Math.min(delay * 1.09, 240);
      timer.current = setTimeout(tick, delay);
    };
    tick();
  }

  function poolFor(c: string) {
    return c === "*"
      ? restaurants
      : restaurants.filter((r) => r.city.toLowerCase() === c.toLowerCase());
  }

  function chooseCity(c: string) {
    setCity(c);
    spin(poolFor(c));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetState();
          setOpen(true);
        }}
        className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-creek/30 bg-creek-soft px-4 py-2.5 text-sm font-semibold text-creek-dark transition hover:border-creek-dark hover:bg-creek-dark hover:text-white"
      >
        <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
        Can’t decide on dinner?
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="dinner-title"
        onClose={() => setOpen(false)}
        // The inner div fills the dialog, so a click landing on the <dialog>
        // itself can only be on the backdrop.
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-card p-0 text-center shadow-lift ring-1 ring-line backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        {open ? (
          <div className="relative animate-fade-up p-5 sm:p-7">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-faint transition hover:bg-paper-2 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {!city ? (
              <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-creek-soft text-creek-dark">
                  <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 id="dinner-title" className="mt-4 font-serif text-2xl font-semibold text-ink">
                  Having trouble deciding what’s for dinner?
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Try something local. Pick a town and we’ll choose a spot for you.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {townsWithFood.map((t) => (
                    <button
                      key={t.slug}
                      type="button"
                      onClick={() => chooseCity(t.name)}
                      className="rounded-pill border border-line bg-paper px-4 py-3 text-sm font-medium text-ink-soft transition hover:border-creek hover:text-creek"
                    >
                      {t.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => chooseCity("*")}
                    className="rounded-pill bg-creek-dark px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Anywhere nearby
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="dinner-title" className="font-serif text-lg font-semibold text-ink-soft">
                  {city === "*" ? "Somewhere nearby" : city}
                </h2>
                <span className="sr-only" aria-live="polite">
                  {result ? `Picked ${result.name} in ${result.city}.` : ""}
                </span>
                <div className="mt-4 flex min-h-[4.5rem] items-center justify-center">
                  {result ? (
                    <Link
                      href={`/business/${result.slug}`}
                      className="group inline-flex flex-col items-center gap-1"
                      onClick={() => setOpen(false)}
                    >
                      <span className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
                        {result.name}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-ink-faint">
                        {result.city}
                      </span>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-creek group-hover:text-creek-dark">
                        Visit listing <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </Link>
                  ) : (
                    <span aria-hidden="true" className="font-serif text-2xl font-semibold text-ink/80 sm:text-3xl">
                      {display}
                    </span>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => spin(poolFor(city))}
                    disabled={spinning}
                    className="inline-flex items-center gap-2 rounded-pill bg-creek-dark px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
                  >
                    <Dices className={spinning ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
                    {spinning ? "Picking…" : "Pick again"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearTimer();
                      setCity(null);
                      setResult(null);
                      setSpinning(false);
                    }}
                    className="rounded-pill px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
                  >
                    Change town
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
