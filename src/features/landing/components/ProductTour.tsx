import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import { productTour } from "../content";
import { Eyebrow, mmButton } from "./primitives";

/**
 * "See MindMosaic in action": a wide poster image and the four stops the
 * tour will follow. There is no video yet, so nothing on this section
 * pretends to play — the poster carries a "Preview" label, the would-be
 * play control is a plain status line, and the working link goes to
 * How It Works, which walks the same journey in words.
 */
export function ProductTour() {
  return (
    <section aria-labelledby="tour-heading" className="bg-mm-tint py-[clamp(64px,8vw,120px)]">
      <div className="mm-width grid items-center gap-[clamp(32px,4vw,64px)] lg:grid-cols-12">
        <div className="lg:col-span-7 lg:order-2">
          <figure className="relative m-0 overflow-hidden rounded-[clamp(20px,2vw,28px)] bg-mm-tint-line">
            <div className="relative aspect-[16/10] sm:aspect-[16/9]">
              <Image
                src={productTour.image.src}
                alt={productTour.image.alt}
                fill
                sizes="(max-width: 1024px) calc(100vw - 40px), 760px"
                className="object-cover object-[45%_50%]"
              />
            </div>
            <figcaption className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-mm-ink shadow-[0_1px_2px_rgba(24,21,31,.1)] sm:left-4 sm:top-4">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mm-coral" />
              Preview
            </figcaption>
          </figure>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5 lg:order-1">
          <div>
            <Eyebrow rule className="mb-4">
              {productTour.eyebrow}
            </Eyebrow>
            <h2
              id="tour-heading"
              className="m-0 text-pretty text-[clamp(32px,3.6vw,52px)] leading-[1.05] tracking-[-0.04em] text-mm-ink"
            >
              {productTour.heading}
            </h2>
          </div>
          <p className="m-0 max-w-[48ch] text-pretty text-[17px] leading-[1.6] text-mm-ink-soft">{productTour.body}</p>

          <ol className="m-0 grid list-none gap-0 p-0" aria-label="What the tour follows">
            {productTour.stops.map((stop, index) => (
              <li key={stop} className="relative flex items-center gap-4 py-2.5 text-[16px] font-medium text-mm-ink">
                {index < productTour.stops.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[13px] top-[34px] h-[calc(100%-22px)] w-px bg-mm-tint-line-strong" />
                )}
                <span
                  aria-hidden="true"
                  className={`relative grid h-[27px] w-[27px] shrink-0 place-items-center rounded-[7px] text-[12px] font-semibold tabular-nums ${
                    index === 0 ? "bg-mm-brand text-white" : "border border-mm-tint-line-strong bg-white text-mm-brand"
                  }`}
                >
                  {index + 1}
                </span>
                {stop}
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 border-t border-mm-tint-line-strong pt-6">
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15.5px] text-mm-ink">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Clock3 aria-hidden="true" className="h-[18px] w-[18px] text-mm-brand" strokeWidth={1.9} />
                {productTour.videoLabel}
              </span>
              <span className="rounded-full border border-mm-tint-line-strong bg-white px-2.5 py-0.5 text-[13px] font-semibold text-mm-muted">
                {productTour.videoStatus}
              </span>
            </p>
            <p className="m-0 max-w-[48ch] text-[15px] leading-[1.55] text-mm-muted">{productTour.videoNote}</p>
            <Link
              href={productTour.link.href}
              className={mmButton({ variant: "outline", className: "mt-1 self-start border-mm-tint-line-strong" })}
            >
              {productTour.link.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
