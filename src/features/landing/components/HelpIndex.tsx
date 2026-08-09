import Link from "next/link";
import {
  Accessibility,
  ChartLine,
  CreditCard,
  MessageCircle,
  Monitor,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hub } from "../content";
import { mmButton } from "./primitives";

/**
 * A mark for each Help Centre topic, keyed by the card's own title.
 *
 * A lookup rather than a field on the content, because these are pure
 * presentation: the title and the one-line explanation are what a reader
 * uses to choose, and the icon only makes the six tiles distinguishable at
 * a glance. Every tile keeps its words, so nothing here carries meaning on
 * its own.
 *
 * A title with no entry falls back to the generic mark rather than throwing
 * — a new Help Centre topic should ship, not crash the Resources page.
 */
const TOPIC_ICON: Record<string, LucideIcon> = {
  "Getting started": Sparkles,
  "Account and billing": CreditCard,
  "Using exam simulations": Monitor,
  "Parent view": ChartLine,
  Accessibility: Accessibility,
  "Contact us": MessageCircle,
};

/**
 * The decorative rail behind the closing band: the same indexed-guide motif
 * the hero opens with, reduced to three tabbed cards.
 *
 * Vector rather than a photograph, and drawn in --mm-lilac on --mm-tint, so
 * it never competes with the heading beside it or lands under the buttons
 * at a contrast the copy has to fight. Hidden from assistive technology and
 * from viewports narrower than lg, where the band has no spare width.
 */
function ClosingDecoration() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      viewBox="0 0 240 200"
      className="hidden h-[186px] w-[224px] shrink-0 xl:block"
    >
      <g opacity="0.55">
        <rect x="18" y="34" width="150" height="104" rx="12" fill="#ffffff" opacity="0.7" />
        <rect x="38" y="50" width="150" height="104" rx="12" fill="#ffffff" opacity="0.85" />
        <rect
          x="58"
          y="66"
          width="150"
          height="104"
          rx="12"
          fill="#ffffff"
          stroke="var(--mm-tint-line)"
        />
        <rect x="200" y="82" width="22" height="16" rx="4" fill="var(--mm-lilac)" />
        <rect x="200" y="106" width="22" height="16" rx="4" fill="var(--mm-ember)" opacity="0.7" />
        <rect x="200" y="130" width="22" height="16" rx="4" fill="var(--mm-brand)" opacity="0.6" />
        <rect x="74" y="84" width="58" height="7" rx="3.5" fill="var(--mm-brand)" opacity="0.55" />
        <rect x="74" y="102" width="112" height="6" rx="3" fill="var(--mm-lilac)" />
        <rect x="74" y="118" width="92" height="6" rx="3" fill="var(--mm-lilac)" />
        <rect x="74" y="140" width="70" height="6" rx="3" fill="var(--mm-lilac)" />
      </g>
    </svg>
  );
}

/**
 * The Help Centre index that closes the Resources screen — six link tiles
 * beside a short explanation, then the closing band.
 *
 * Server component: nothing here is interactive beyond links.
 */
export function HelpIndex() {
  return (
    <>
      <section
        aria-labelledby="hub-help-heading"
        className="border-t border-mm-line bg-white py-[clamp(52px,6vw,88px)]"
      >
        <div className="mm-width grid items-start gap-[clamp(28px,3.2vw,56px)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="max-w-[46ch]">
            <h2
              id="hub-help-heading"
              className="text-[clamp(26px,3vw,38px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
            >
              {hub.help.heading}
            </h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-mm-muted">{hub.help.intro}</p>
            <p className="mt-5 border-t border-mm-line-soft pt-4 text-[14.5px] leading-[1.6] text-mm-muted">
              {hub.help.note}
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {hub.help.cards.map((card) => {
              const Icon = TOPIC_ICON[card.title] ?? Sparkles;
              return (
                <li key={card.title}>
                  <Link
                    href={card.href}
                    className="group grid h-full content-start gap-2.5 rounded-[14px] border border-mm-line p-5 text-mm-ink transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-mm-brand hover:bg-mm-tint-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mm-tint text-mm-brand transition-colors duration-200 group-hover:bg-white"
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="text-[15.5px] font-bold leading-tight">{card.title}</span>
                    <span className="text-[14px] leading-[1.55] text-mm-muted">{card.body}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        aria-labelledby="hub-closing-heading"
        className="overflow-hidden bg-mm-tint py-[clamp(52px,6vw,88px)]"
      >
        {/* Three children under `justify-between`: the decoration takes the
            gap that opens up between the copy and the buttons at xl, rather
            than being absolutely positioned under them where it would have
            to fight the button labels for contrast. */}
        <div className="mm-width flex flex-wrap items-center justify-between gap-[clamp(24px,3vw,48px)]">
          <div className="max-w-[600px]">
            <h2
              id="hub-closing-heading"
              className="text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.03em] text-mm-ink"
            >
              {hub.closing.heading}
            </h2>
            <p className="mt-4 text-[16.5px] leading-[1.6] text-mm-muted">{hub.closing.body}</p>
          </div>

          <ClosingDecoration />

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
