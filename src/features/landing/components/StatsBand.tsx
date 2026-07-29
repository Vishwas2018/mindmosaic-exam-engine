import Image from "next/image";

import { getPublishedQuestionCount } from "@/server/exam-bank";

import { statsBand } from "../content";

/*
 * StatsBand is a plain server component (no "use client") — the one place
 * in the landing tree allowed to touch the server-only question-bank
 * gateway directly. content.ts leaves the "Original Questions" stat's
 * value as `null` specifically so this file, not the shared content
 * module every client component also imports, is the one that reads the
 * real count — see content.ts's statsBand doc comment.
 */
export function StatsBand() {
  const publishedQuestionCount = getPublishedQuestionCount();
  const stats = statsBand.stats.map((stat) =>
    stat.value === null ? { ...stat, value: String(publishedQuestionCount) } : stat,
  );

  return (
    <section aria-labelledby="stats-band-heading" className="bg-brand py-14">
      <div className="site-width">
        <p className="text-center text-sm font-extrabold uppercase tracking-[0.14em] text-white/70 lg:text-left">
          {statsBand.eyebrow}
        </p>
        <h2 id="stats-band-heading" className="sr-only">
          {statsBand.heading}
        </h2>
      </div>
      <div className="site-width mt-6 flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
        <Image
          src={statsBand.image.src}
          alt={statsBand.image.alt}
          width={statsBand.image.width}
          height={statsBand.image.height}
          loading="lazy"
          className="h-40 w-40 shrink-0 object-contain sm:h-48 sm:w-48"
        />
        <ul className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <li key={stat.label} className="flex flex-col items-center text-center text-white">
              <Image src={stat.icon} alt="" width={statsBand.iconSize.width} height={statsBand.iconSize.height} loading="lazy" className="h-10 w-10 object-contain" />
              <p className="mt-3 font-display text-[clamp(1.875rem,1.7rem+0.75vw,2.25rem)] font-bold tracking-[-0.02em]">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
