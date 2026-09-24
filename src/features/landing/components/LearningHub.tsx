import Image from "next/image";
import Link from "next/link";

import { learningHub } from "../content";
import { Eyebrow, mmButton } from "./primitives";

/** Copy left, photo right with structured concept steps. */
export function LearningHub() {
  return (
    <section id="hub" aria-labelledby="hub-heading" className="bg-mm-page py-[clamp(40px,4vw,64px)]">
      <div className="mm-width grid items-center gap-[clamp(28px,3.2vw,48px)] lg:grid-cols-2">
        <div className="min-w-0">
          <Eyebrow className="mb-4">{learningHub.eyebrow}</Eyebrow>
          <h2
            id="hub-heading"
            className="text-[clamp(28px,3.2vw,42px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {learningHub.heading}
          </h2>
          <p className="mt-[18px] max-w-[520px] text-pretty text-[16px] leading-[1.6] text-mm-muted">
            {learningHub.intro}
          </p>

          <ul className="mt-[28px] grid gap-px overflow-hidden rounded-[16px] border border-mm-line/80 bg-mm-line/80 shadow-sm">
            {learningHub.steps.map((step, index) => (
              <li
                key={step}
                className={`flex items-center gap-3 px-5 py-3.5 text-[14.5px] font-medium text-mm-ink ${
                  index === learningHub.steps.length - 1 ? "bg-mm-tint-soft text-mm-brand font-semibold" : "bg-white"
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mm-tint text-xs font-bold text-mm-brand">
                  {index + 1}
                </span>
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

        <div className="relative min-w-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-mm-line/80 shadow-[0_4px_24px_rgba(24,21,31,0.06)]">
            <Image
              src={learningHub.image.src}
              alt={learningHub.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
