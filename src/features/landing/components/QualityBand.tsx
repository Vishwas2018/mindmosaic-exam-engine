import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { qualityBand } from "../content";
import { MosaicFragments, type Fragment } from "./MosaicFragments";

const FRAGMENTS: readonly Fragment[] = [
  { col: 1, row: 1, tone: "brand", x: "-10px", y: "-8px" },
  { col: 2, row: 1, tone: "coral", x: "6px", y: "-12px", r: "12deg" },
  { col: 1, row: 2, tone: "lilac", x: "-12px", y: "6px", r: "-8deg" },
];

/**
 * The page's one dark band: the originality statement and four evidenced
 * points. No testimonials, stats or educator-review claims — the published
 * pipeline's checks are automated (see qualityBand's doc comment).
 * Coral is kept to the numerals and one fragment.
 */
export function QualityBand() {
  return (
    <section aria-labelledby="quality-heading" className="relative overflow-hidden bg-[#2A1257] py-[clamp(72px,10vw,144px)] text-white">
      <div className="mm-width grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <MosaicFragments fragments={FRAGMENTS} className="w-[64px]" />
          <h2
            id="quality-heading"
            className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.12] tracking-[-0.034em] text-white"
          >
            {qualityBand.statement}
          </h2>
          <Link
            href={qualityBand.link.href}
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-lg text-[16px] font-semibold text-white underline decoration-white/40 underline-offset-[6px] transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            {qualityBand.link.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        <ol className="m-0 grid list-none self-end p-0 lg:col-span-6">
          {qualityBand.points.map((point, index) => (
            <li
              key={point.title}
              className="grid grid-cols-[44px_1fr] gap-4 border-t border-[#4A2F7E] py-6 last:border-b"
            >
              <span aria-hidden="true" className="pt-0.5 text-sm font-semibold tabular-nums text-[#FF8A8D]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="grid gap-1.5">
                <strong className="text-[18px] font-semibold tracking-[-0.01em]">{point.title}</strong>
                <span className="text-[15.5px] leading-[1.6] text-[#DCD5E5]">{point.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
