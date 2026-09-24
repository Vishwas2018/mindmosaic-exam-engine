import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

import { hero } from "../content";
import { Eyebrow, mmButton } from "./primitives";

/**
 * Copy left, learner photo right.
 * Purpose-led headline with clean trust points and refined visual framing.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="bg-mm-page pb-[clamp(36px,4vw,60px)] pt-[clamp(28px,3vw,44px)]"
    >
      <div className="mm-width grid items-center gap-[clamp(28px,3.2vw,48px)] lg:grid-cols-2">
        <div className="min-w-0 max-w-[580px]">
          <Eyebrow rule className="mb-[20px]">
            {hero.eyebrow}
          </Eyebrow>

          <h1
            id="hero-heading"
            className="text-[clamp(36px,4.6vw,58px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink"
          >
            {hero.headlineLines.map((line) => (
              <span
                key={line.text}
                className={line.tone === "brand" ? "block text-mm-brand" : "block"}
              >
                {line.text}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[520px] text-pretty text-[clamp(16.5px,1.3vw,18.5px)] leading-[1.6] text-mm-muted">
            {hero.subheadline}
          </p>

          <div className="mt-[32px] flex flex-wrap items-center gap-3">
            <Link href={hero.primaryCta.href} className={mmButton({ size: "lg" })}>
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className={mmButton({ variant: "outline", size: "lg" })}
            >
              {hero.secondaryCta.label}
            </Link>
          </div>

          <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {hero.points.map((point) => (
              <li
                key={point.label}
                className="flex items-center gap-2.5 text-[14.5px] font-medium text-mm-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-mm-brand/10 text-mm-brand"
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                {point.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-w-0">
          <div className="relative h-[clamp(380px,46vw,580px)] w-full overflow-hidden rounded-[24px] border border-mm-line/80 shadow-[0_4px_24px_rgba(24,21,31,0.06)]">
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
        </div>
      </div>
    </section>
  );
}
