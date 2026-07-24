import Image from "next/image";

import { statsBand } from "../content";

export function StatsBand() {
  return (
    <section aria-label="MindMosaic in numbers" className="bg-brand py-14">
      <div className="site-width flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
        <Image
          src={statsBand.image.src}
          alt={statsBand.image.alt}
          width={statsBand.image.width}
          height={statsBand.image.height}
          loading="lazy"
          className="h-40 w-40 shrink-0 object-contain sm:h-48 sm:w-48"
        />
        <ul className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-4">
          {statsBand.stats.map((stat) => (
            <li key={stat.label} className="flex flex-col items-center text-center text-white">
              <Image src={stat.icon} alt="" width={statsBand.iconSize.width} height={statsBand.iconSize.height} loading="lazy" className="h-10 w-10 object-contain" />
              <p className="mt-3 font-display text-3xl font-bold tracking-[-0.03em]">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
