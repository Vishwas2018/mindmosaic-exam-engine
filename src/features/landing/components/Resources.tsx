import Image from "next/image";
import Link from "next/link";

import { resources } from "../content";
import { mmButton } from "./primitives";

/**
 * Three editorial cards for families. Each links to a real page that
 * covers that ground today (student tips, the parent guide, the help
 * centre) rather than to articles that have not been written.
 */
export function Resources() {
  return (
    <section
      id="resources"
      aria-labelledby="resources-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width">
        <div className="mb-[clamp(22px,2.2vw,30px)] flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[660px]">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">{resources.eyebrow}</p>
            <h2
              id="resources-heading"
              className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
            >
              {resources.heading}
            </h2>
          </div>
          <Link href={resources.cta.href} className={mmButton({ variant: "outline" })}>
            {resources.cta.label}
          </Link>
        </div>

        <div className="grid gap-[clamp(20px,2.4vw,32px)] lg:grid-cols-3">
          {resources.items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col justify-between rounded-[20px] border border-mm-line/80 bg-white p-4 shadow-sm transition-all hover:border-mm-brand/40 hover:shadow-md text-inherit"
            >
              <div>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[14px]">
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="grid gap-1.5 p-2 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mm-brand">{item.kicker}</p>
                  <p className="font-display text-[18px] font-bold leading-[1.3] tracking-[-0.02em] text-mm-ink transition-colors group-hover:text-mm-brand">
                    {item.title}
                  </p>
                  <p className="text-[13.5px] leading-[1.55] text-mm-muted">{item.body}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
