import Image from "next/image";
import Link from "next/link";

import { hero } from "../content";
import { Eyebrow, mmButton, MosaicRule } from "./primitives";

const dotTones: Record<string, string> = {
  brand: "bg-mm-brand",
  coral: "bg-mm-coral",
  lilac: "bg-mm-lilac",
};

/**
 * Copy left, learner photo right, bleeding off the right edge of the
 * viewport with the mosaic rule tucked under it — the design file's own
 * arrangement. The photo column keeps its negative right margin only from
 * lg up; below that there is no gutter to spill into.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-mm-page pb-[clamp(36px,4vw,60px)] pt-[clamp(28px,3vw,44px)]"
    >
      <div className="mm-width grid items-center gap-[clamp(24px,2.6vw,40px)] lg:grid-cols-2">
        <div className="min-w-0 max-w-[580px]">
          <Eyebrow rule className="mb-[22px]">
            {hero.eyebrow}
          </Eyebrow>

          <h1
            id="hero-heading"
            className="text-[clamp(36px,4.8vw,62px)] font-bold leading-[1.04] tracking-[-0.04em] text-mm-ink"
          >
            {hero.headlineLines.map((line) => (
              <span key={line.text} className={line.tone === "brand" ? "block text-mm-brand" : "block"}>
                {line.text}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[520px] text-pretty text-[clamp(16.5px,1.35vw,19px)] leading-[1.6] text-mm-muted">
            {hero.subheadline}
          </p>

          <div className="mt-[34px] flex flex-wrap gap-3">
            <Link href={hero.primaryCta.href} className={mmButton({ size: "lg" })}>
              {hero.primaryCta.label}
            </Link>
            <Link href={hero.secondaryCta.href} className={mmButton({ variant: "outline", size: "lg" })}>
              {hero.secondaryCta.label}
            </Link>
          </div>

          <ul className="mt-9 grid gap-x-5 gap-y-[13px] sm:grid-cols-2">
            {hero.points.map((point) => (
              <li key={point.label} className="flex items-start gap-[11px] text-[15px] font-medium text-mm-ink-soft">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2 w-2 shrink-0 ${dotTones[point.tone] ?? dotTones.brand}`}
                />
                {point.label}
              </li>
            ))}
          </ul>
        </div>

        {/* The photo sits inside the container rather than bleeding into the
            right gutter, so all four corners keep the same 20px radius, and
            the mosaic rule under it spans exactly the photo's width. */}
        <div className="grid min-w-0 gap-2.5">
          <div className="relative h-[clamp(420px,52vw,660px)] w-full overflow-hidden rounded-[20px]">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: hero.image.objectPosition }}
            />
          </div>
          <MosaicRule tiles={hero.tiles} className="w-full h-[clamp(30px,3vw,44px)]" />
        </div>
      </div>
    </section>
  );
}
