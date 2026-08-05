import Link from "next/link";

import { hub } from "../content";
import { mmButton } from "./primitives";

/**
 * The Help Centre index that closes the Resources screen — six link cards
 * beside a short explanation, then the closing band.
 *
 * Server component: nothing here is interactive beyond links.
 */
export function HelpIndex() {
  return (
    <>
      <section
        aria-labelledby="hub-help-heading"
        className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
      >
        <div className="mm-width grid items-start gap-[clamp(24px,3vw,56px)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h2
              id="hub-help-heading"
              className="text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
            >
              {hub.help.heading}
            </h2>
            <p className="mt-3.5 text-[16.5px] leading-[1.6] text-mm-muted">{hub.help.intro}</p>
            <p className="mt-4 text-[15px] leading-[1.6] text-mm-muted">{hub.help.note}</p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {hub.help.cards.map((card) => (
              <li key={card.title}>
                <Link
                  href={card.href}
                  className="grid h-full content-start gap-2 rounded-[14px] border border-mm-line p-5 text-mm-ink transition-colors hover:border-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  <span className="text-base font-bold">{card.title}</span>
                  <span className="text-sm leading-[1.55] text-mm-muted">{card.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="hub-closing-heading"
        className="bg-mm-tint py-[clamp(40px,4vw,64px)]"
      >
        <div className="mm-width flex flex-wrap items-center justify-between gap-[clamp(24px,3vw,48px)]">
          <div className="max-w-[620px]">
            <h2
              id="hub-closing-heading"
              className="text-[clamp(26px,3.2vw,42px)] font-bold leading-[1.1] text-mm-ink"
            >
              {hub.closing.heading}
            </h2>
            <p className="mt-3.5 text-[16.5px] leading-[1.6] text-mm-muted">{hub.closing.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={hub.closing.cta.href} className={mmButton({ size: "lg" })}>
              {hub.closing.cta.label}
            </Link>
            <Link
              href={hub.closing.secondaryCta.href}
              className={mmButton({ variant: "outline", size: "lg" })}
            >
              {hub.closing.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
