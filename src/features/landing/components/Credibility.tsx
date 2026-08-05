import Link from "next/link";

import { credibility } from "../content";

/**
 * The tinted band under the hero: five hairline-divided cards, the last
 * one reversed out in brand purple, then the assessment disclaimer. The
 * heading is the eyebrow itself here — the design gives this band a
 * label, not a title.
 */
export function Credibility() {
  return (
    <section aria-labelledby="credibility-heading" className="bg-mm-tint py-[clamp(32px,3vw,44px)]">
      <div className="mm-width">
        <h2
          id="credibility-heading"
          className="mb-5 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand"
        >
          {credibility.heading}
        </h2>

        <div className="grid gap-px overflow-hidden rounded-[14px] border border-mm-tint-line-strong bg-mm-tint-line-strong sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {credibility.cards.map((card) => {
            const brand = card.tone === "brand";
            return (
              <div key={card.title} className={`px-[22px] py-6 ${brand ? "bg-mm-brand" : "bg-white"}`}>
                <p
                  className={`font-display text-2xl font-extrabold tracking-[-0.03em] ${
                    brand ? "text-white" : "text-mm-ink"
                  }`}
                >
                  {card.title}
                </p>
                <p className={`mt-[7px] text-sm leading-[1.5] ${brand ? "text-white/85" : "text-mm-muted"}`}>
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 max-w-[760px] text-[13.5px] leading-[1.6] text-mm-muted">
          {credibility.disclaimer}{" "}
          <Link
            href={credibility.disclaimerLink.href}
            className="font-semibold text-mm-brand underline underline-offset-2"
          >
            {credibility.disclaimerLink.label}
          </Link>
        </p>
      </div>
    </section>
  );
}
