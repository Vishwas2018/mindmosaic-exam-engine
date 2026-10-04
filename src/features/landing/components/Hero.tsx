import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { hero } from "../content";
import { MosaicFragments, type Fragment } from "./MosaicFragments";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

const FRAGMENTS: readonly Fragment[] = [
  { col: 3, row: 1, tone: "lilac", x: "10px", y: "-12px", r: "8deg" },
  { col: 4, row: 1, tone: "brand", x: "16px", y: "-6px", r: "-6deg" },
  { col: 4, row: 2, tone: "coral", x: "14px", y: "10px", r: "10deg" },
  { col: 2, row: 1, tone: "tint", x: "-8px", y: "-14px" },
];

/** Stagger for the copy column — 70ms apart, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * 70}ms` } as CSSProperties;
}

/**
 * Copy first, then a wide campaign photograph. The headline runs the full
 * width so each line of the promise stays whole; the proposition and CTAs
 * share an asymmetric row beneath it, and the image below runs nearly the
 * full container width — at that size the cards inside the photograph stay
 * legible, which they would not squeezed into half a column. Under 480px
 * the photograph crops to a square frame on the two students rather
 * than shrinking every card to an unreadable size.
 *
 * A server component: the only motion is a one-off CSS entrance
 * (`.mm-hero-rise`, `.mm-hero-settle`), which reduced motion skips.
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-mm-page">
      <div className="mm-width relative pb-[clamp(24px,3vw,40px)] pt-[clamp(36px,6vw,88px)]">
        <MosaicFragments
          fragments={FRAGMENTS}
          className="absolute right-[clamp(20px,4vw,64px)] top-[clamp(20px,3vw,40px)] hidden w-[88px] md:grid"
        />

        <h1
          id="hero-heading"
          className="m-0 text-[clamp(40px,5vw,68px)] leading-[1.04] tracking-[-0.034em] text-mm-ink"
        >
          <span className="mm-hero-rise block" style={rise(0)}>
            {hero.heading}
          </span>
          <span className="mm-hero-rise block text-mm-brand" style={rise(1)}>
            {hero.headingEmphasis}
          </span>
        </h1>

        <div className="mt-6 grid gap-6 lg:mt-9 lg:grid-cols-12 lg:items-end lg:gap-10">
          <p
            className="mm-hero-rise m-0 max-w-[54ch] text-balance text-[clamp(17px,1.35vw,19px)] leading-[1.6] text-mm-ink-soft lg:col-span-7"
            style={rise(2)}
          >
            {hero.subheadline}
          </p>
          <div
            className="mm-hero-rise flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap lg:col-span-5 lg:justify-end"
            style={rise(3)}
          >
            <Link href={hero.primaryCta.href} className={mmButton({ size: "lg" })}>
              {hero.primaryCta.label}
            </Link>
            <Link href={hero.secondaryCta.href} className={mmButton({ variant: "outline", size: "lg" })}>
              {hero.secondaryCta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <ul
          className="mm-hero-rise m-0 mt-7 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-[14.5px] font-medium text-mm-ink-soft lg:mt-9"
          style={rise(4)}
          aria-label="What MindMosaic includes"
        >
          {hero.credibility.map((item) => (
            <li key={item} className="inline-flex items-center gap-2.5">
              <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 rounded-[1px] bg-mm-coral" />
              {item}
            </li>
          ))}
        </ul>

        <figure className="m-0 mt-6 lg:mt-7">
          <div className="relative aspect-square overflow-hidden rounded-[clamp(20px,2vw,28px)] bg-mm-tint min-[480px]:aspect-[16/10] sm:aspect-[16/9] lg:aspect-[2/1]">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="(max-width: 1440px) calc(100vw - 2 * clamp(20px, 4vw, 64px)), 1312px"
              className="mm-hero-settle object-cover object-[7%_50%] min-[480px]:object-[50%_45%]"
            />
          </div>
          <figcaption className="mt-4 text-[14.5px] leading-[1.6] text-mm-ink-soft">
            <span aria-hidden="true" className="mr-2.5 inline-block h-2 w-2 rounded-full bg-[#0B6B63] align-[1px]" />
            {hero.availability.text}{" "}
            <Link
              href={hero.availability.link.href}
              style={underlineTransition}
              className={underlineLinkClasses({ tone: "brand", className: "font-semibold text-mm-brand" })}
            >
              {hero.availability.link.label}
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
