import Link from "next/link";

import { Reveal } from "./Reveal";
import { qualityBand } from "../content";
import { underlineLinkClasses, underlineTransition } from "./primitives";

/**
 * Public/Home.dc.html section 5, the single deep-purple "Quality"
 * section: a statement and four evidenced points (original questions,
 * worked explanations, automated publication checks, Australian and
 * accessible) — deliberately no testimonials, stats or claims of
 * educator review (handoff/FACT_LOG.md: "no human educator review
 * claimed"). Distinct from `quality.standards` (Quality.tsx,
 * /methodology's ten-item list) — see qualityBand's own doc comment.
 */
export function QualityBand() {
  return (
    <section aria-labelledby="quality-heading" className="bg-[#2A1257] py-[clamp(80px,10vw,144px)] text-white">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-[clamp(20px,4vw,64px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20">
        <div className="flex flex-col gap-7">
          <Reveal>
            <p
              id="quality-heading"
              className="m-0 text-pretty text-[clamp(32px,3.8vw,56px)] font-medium leading-[1.06] tracking-[-0.035em]"
            >
              {qualityBand.statement}
            </p>
          </Reveal>
          <Reveal>
            <Link
              href={qualityBand.link.href}
              style={underlineTransition}
              className={underlineLinkClasses({
                tone: "brand",
                className: "inline-flex w-fit items-center gap-2 font-semibold text-white",
              })}
            >
              {qualityBand.link.label}
            </Link>
          </Reveal>
        </div>

        <ol className="m-0 grid list-none p-0">
          {qualityBand.points.map((point, index) => (
            <Reveal
              key={point.title}
              delayMs={index * 90}
              className="grid grid-cols-[40px_1fr] gap-4 border-t border-[#4A2F7E] py-[22px] transition-transform hover:translate-x-2.5 last:border-b"
            >
              <span className="pt-0.5 text-sm font-semibold text-[#FF8A8D]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="grid gap-1.5">
                <strong className="text-lg font-semibold">{point.title}</strong>
                <span className="text-[15.5px] leading-[1.55] text-[#DCD5E5]">{point.body}</span>
              </span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
