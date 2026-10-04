"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { faqAndStart } from "../content";
import { MosaicFragments, type Fragment } from "./MosaicFragments";
import { Eyebrow, mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

const FRAGMENTS: readonly Fragment[] = [
  { col: 1, row: 1, tone: "brand", x: "-12px", y: "-10px", r: "-10deg" },
  { col: 2, row: 1, tone: "lilac", x: "4px", y: "-14px" },
  { col: 2, row: 2, tone: "coral", x: "12px", y: "8px", r: "14deg" },
  { col: 3, row: 2, tone: "teal", x: "16px", y: "-4px" },
];

/**
 * The FAQ (single-open accordion answering real purchase objections) and
 * the closing "start with one practice set" statement.
 *
 * Each question is a real <button> inside an <h3> with aria-expanded /
 * aria-controls; the answer region opens with a CSS grid-row transition
 * (`.mm-disclosure`) and is `visibility: hidden` while closed, so closed
 * answers are out of the tab order and the accessibility tree.
 */
export function FaqAndStart() {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <>
      <section aria-labelledby="faq-heading" className="border-t border-mm-line bg-white py-[clamp(64px,8vw,120px)]">
        <div className="mm-width grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[120px]">
              <Eyebrow rule className="mb-4">
                {faqAndStart.eyebrow}
              </Eyebrow>
              <h2
                id="faq-heading"
                className="m-0 text-pretty text-[clamp(30px,3.4vw,48px)] leading-[1.06] tracking-[-0.038em] text-mm-ink"
              >
                {faqAndStart.heading}
              </h2>
              <p className="m-0 mt-5 max-w-[34ch] text-[16px] leading-[1.6] text-mm-ink-soft">
                Something else?{" "}
                <Link
                  href={faqAndStart.card.helpLink.href}
                  style={underlineTransition}
                  className={underlineLinkClasses({ tone: "brand", className: "font-semibold text-mm-brand" })}
                >
                  {faqAndStart.card.helpLink.label}
                </Link>
              </p>
            </div>
          </div>

          <div className="border-t border-mm-line lg:col-span-8">
            {faqAndStart.items.map((item, index) => {
              const isOpen = open === index;
              const buttonId = `${baseId}-b${index}`;
              const panelId = `${baseId}-p${index}`;
              return (
                <div key={item.question} className="border-b border-mm-line">
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : index)}
                      className="group flex min-h-[72px] w-full items-center justify-between gap-5 rounded-lg border-0 bg-transparent py-4 text-left text-[17.5px] font-semibold leading-[1.4] tracking-[-0.01em] text-mm-ink transition-colors hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
                    >
                      {item.question}
                      <span
                        aria-hidden="true"
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-[background-color,border-color,color] duration-200 motion-reduce:transition-none ${
                          isOpen
                            ? "border-mm-brand bg-mm-brand text-white"
                            : "border-mm-line text-mm-brand group-hover:border-mm-tint-line-strong"
                        }`}
                      >
                        <Plus
                          className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`}
                          strokeWidth={2}
                        />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    data-open={isOpen}
                    className="mm-disclosure"
                  >
                    <div>
                      <p className="m-0 max-w-[68ch] pb-6 pr-12 text-[16px] leading-[1.65] text-mm-ink-soft">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="start-heading" className="bg-white pb-[clamp(64px,8vw,120px)]">
        <div className="mm-width">
          <div className="relative overflow-hidden rounded-[clamp(24px,2.4vw,36px)] bg-mm-tint px-[clamp(24px,5vw,80px)] py-[clamp(48px,6vw,88px)]">
            <MosaicFragments
              fragments={FRAGMENTS}
              className="absolute right-[clamp(24px,5vw,80px)] top-[clamp(28px,4vw,56px)] hidden w-[96px] sm:grid"
            />
            <h2
              id="start-heading"
              className="m-0 max-w-[18ch] text-balance text-[clamp(32px,4.4vw,60px)] leading-[1.04] tracking-[-0.04em] text-mm-ink"
            >
              {faqAndStart.card.heading}
            </h2>
            <p className="m-0 mt-5 max-w-[48ch] text-pretty text-[17.5px] leading-[1.6] text-mm-ink-soft">
              {faqAndStart.card.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={faqAndStart.card.primaryCta.href} className={mmButton({ size: "lg" })}>
                {faqAndStart.card.primaryCta.label}
              </Link>
              <Link
                href={faqAndStart.card.secondaryCta.href}
                className={mmButton({ variant: "outline", size: "lg", className: "border-mm-tint-line-strong" })}
              >
                {faqAndStart.card.secondaryCta.label}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
