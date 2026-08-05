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

        <div className="grid gap-[clamp(18px,2vw,28px)] lg:grid-cols-3">
          {resources.items.map((item) => (
            <Link key={item.title} href={item.href} className="group grid min-w-0 gap-4 text-inherit">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="grid gap-2.5">
                <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-brand">{item.kicker}</p>
                <p className="text-[19px] font-bold leading-[1.3] tracking-[-0.02em] text-mm-ink group-hover:text-mm-brand">
                  {item.title}
                </p>
                <p className="text-[14.5px] leading-[1.55] text-mm-muted">{item.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
