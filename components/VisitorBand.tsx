import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// "Just visiting?" — a front door for tourists and newcomers, so the homepage
// serves visitors as well as locals. Each interest points at the local-business
// category that best fits the mood. Tones alternate across the brand families
// (gold / creek / pine / clay) for variety. Photos are public domain / CC via
// Wikimedia Commons; attribution lives in the site footer.
interface Interest {
  name: string;
  blurb: string;
  href: string;
  src: string;
  alt: string;
  dot: string;
  link: string;
}

const INTERESTS: Interest[] = [
  {
    name: "Eat & Drink",
    blurb: "From meat-and-three diners to coffee shops and homemade pie, the local spots we love.",
    href: "/category/restaurant-and-food",
    src: "/images/eat-drink-pie.jpg",
    alt: "A slice of apple pie topped with a scoop of vanilla ice cream",
    dot: "bg-gold",
    link: "text-gold-dark",
  },
  {
    name: "Shop Local",
    blurb: "Main-street boutiques, makers, and family-run shops, full of finds you won't get online.",
    href: "/category/retail-and-shopping",
    src: "/images/lewisburg-square.jpg",
    alt: "Historic storefronts on the Lewisburg town square in Marshall County, Tennessee",
    dot: "bg-creek",
    link: "text-creek-dark",
  },
  {
    name: "Outdoors & Rec",
    blurb: "Parks, ballfields, trails, the rec center, and wide-open country for getting outside.",
    href: "/category/fitness-and-recreation",
    src: "/images/tn-pasture-gordonsville.jpg",
    alt: "Green Tennessee pastures with a red barn and treeline under a blue sky",
    dot: "bg-pine",
    link: "text-pine-dark",
  },
  {
    name: "History & Culture",
    blurb: "The courthouse square, local landmarks, and the stories that made Marshall County home.",
    href: "/history",
    src: "/images/lewisburg-courthouse.jpg",
    alt: "The historic Marshall County Courthouse on the square in Lewisburg, Tennessee",
    dot: "bg-clay",
    link: "text-clay-dark",
  },
];

export function VisitorBand() {
  return (
    <section id="visit" className="relative isolate scroll-mt-20 overflow-hidden bg-pine-dark text-paper">
      {/* Decorative goldenrod glow, top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/25 blur-3xl"
      />

      <div className="container-page relative py-14 sm:py-16 lg:py-20">
        {/* Header row */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Just visiting?
            </p>
            <h2 className="text-2xl text-paper sm:text-3xl lg:text-4xl">
              Spend a day in Marshall County.
            </h2>
          </div>
          <p className="max-w-lg text-pretty leading-relaxed text-paper/80">
            New in town or just passing through? Start with what you&rsquo;re in the mood for, and
            we&rsquo;ll point you to the local spots worth your time.
          </p>
        </div>

        {/* Interest cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTERESTS.map((it) => (
            <Link
              key={it.name}
              href={it.href}
              className="group flex flex-col overflow-hidden rounded-card bg-card text-ink shadow-soft ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-lift"
            >
              {/* Photo (16:10) — hidden on phones so the cards stay compact */}
              <div className="relative hidden aspect-[16/10] overflow-hidden bg-paper-2 sm:block">
                <Image
                  src={it.src}
                  alt={it.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${it.dot}`} aria-hidden="true" />
                  <span className="font-serif text-xl font-semibold text-ink">{it.name}</span>
                </span>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-soft sm:min-h-[2.75rem]">
                  {it.blurb}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${it.link}`}
                >
                  Explore
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
