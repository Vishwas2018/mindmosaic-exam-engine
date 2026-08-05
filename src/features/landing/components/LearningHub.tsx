import Image from "next/image";
import Link from "next/link";

import { learningHub } from "../content";
import { Eyebrow, mmButton, MosaicRule } from "./primitives";

/** Copy left, photo + mosaic rule right. */
export function LearningHub() {
  return (
    <section id="hub" aria-labelledby="hub-heading" className="bg-mm-page py-[clamp(40px,4vw,64px)]">
      <div className="mm-width grid items-center gap-[clamp(24px,2.6vw,40px)] lg:grid-cols-2">
        <div className="min-w-0">
          <Eyebrow className="mb-4">{learningHub.eyebrow}</Eyebrow>
          <h2
            id="hub-heading"
            className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {learningHub.heading}
          </h2>
          <p className="mt-[18px] max-w-[520px] text-pretty text-[17px] leading-[1.6] text-mm-muted">
            {learningHub.intro}
          </p>

          <ul className="mt-[30px] grid gap-px overflow-hidden rounded-[14px] border border-mm-line bg-mm-line">
            {learningHub.steps.map((step, index) => (
              <li
                key={step}
                className={`px-[18px] py-4 text-[15px] font-semibold text-mm-ink ${
                  index === learningHub.steps.length - 1 ? "bg-mm-tint-soft" : "bg-white"
                }`}
              >
                {step}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link href={learningHub.primaryCta.href} className={mmButton()}>
              {learningHub.primaryCta.label}
            </Link>
            <Link href={learningHub.secondaryCta.href} className={mmButton({ variant: "outline" })}>
              {learningHub.secondaryCta.label}
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-2.5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[18px]">
            <Image
              src={learningHub.image.src}
              alt={learningHub.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <MosaicRule
            tiles={["brand", "quiet", "lilac", "coral", "quiet", "brand"]}
            className="h-[clamp(28px,3vw,44px)]"
          />
        </div>
      </div>
    </section>
  );
}
