import Image from "next/image";
import Link from "next/link";

import { forParents } from "../content";
import { Eyebrow, mmButton } from "./primitives";

/**
 * Photo left, copy right. The CTA is a same-page anchor back up to the
 * showcase's parent view — that view is the thing being described, and
 * the real parent dashboard is behind sign-in.
 */
export function ForParents() {
  return (
    <section
      id="progress"
      aria-labelledby="for-parents-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width grid items-center gap-[clamp(28px,3.2vw,48px)] lg:grid-cols-2">
        <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[24px] border border-mm-line/80 shadow-[0_4px_24px_rgba(24,21,31,0.06)]">
          <Image
            src={forParents.image.src}
            alt={forParents.image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <Eyebrow className="mb-4">{forParents.eyebrow}</Eyebrow>
          <h2
            id="for-parents-heading"
            className="text-pretty text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {forParents.heading}
          </h2>
          <p className="mt-[18px] max-w-[520px] text-pretty text-[16px] leading-[1.6] text-mm-muted">
            {forParents.intro}
          </p>

          <div className="mt-7 grid gap-px overflow-hidden rounded-[16px] border border-mm-line/80 bg-mm-line/80 shadow-sm sm:grid-cols-2">
            {forParents.cards.map((card, index) => (
              <div
                key={card.title}
                className={`p-4.5 ${index === forParents.cards.length - 1 ? "bg-mm-tint-soft" : "bg-white"}`}
              >
                <p className="text-[14.5px] font-bold text-mm-ink">{card.title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-mm-muted">{card.body}</p>
              </div>
            ))}
          </div>

          <Link href={forParents.cta.href} className={mmButton({ className: "mt-7" })}>
            {forParents.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
