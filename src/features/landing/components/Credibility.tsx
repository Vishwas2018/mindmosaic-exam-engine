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
    <section aria-labelledby="credibility-heading" className="bg-mm-tint py-[clamp(28px,3vw,40px)]">
      <div className="mm-width">
        <h2
          id="credibility-heading"
          className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand"
        >
          {credibility.heading}
        </h2>

        <div className="grid gap-px overflow-hidden rounded-[16px] border border-mm-line/70 bg-mm-line/70 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {credibility.cards.map((card) => {
            const brand = card.tone === "brand";
            return (
              <div
                key={card.title}
                className={`flex flex-col justify-between px-5 py-5 transition-colors ${
                  brand ? "bg-mm-brand text-white" : "bg-white text-mm-ink"
                }`}
              >
                <div>
                  <p
                    className={`font-display text-[20px] font-bold tracking-[-0.025em] ${
                      brand ? "text-white" : "text-mm-ink"
                    }`}
                  >
                    {card.title}
                  </p>
                  <p
                    className={`mt-2 text-[13.5px] leading-[1.5] ${
                      brand ? "text-white/85" : "text-mm-muted"
                    }`}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 max-w-[800px] text-[13px] leading-[1.6] text-mm-muted">
          {credibility.disclaimer}{" "}
          <Link
            href={credibility.disclaimerLink.href}
            className="font-semibold text-mm-brand underline underline-offset-2 hover:text-mm-brand-deep"
          >
            {credibility.disclaimerLink.label}
          </Link>
        </p>
      </div>
    </section>
  );
}
