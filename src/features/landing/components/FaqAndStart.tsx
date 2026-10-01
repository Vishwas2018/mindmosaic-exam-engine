"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Reveal } from "./Reveal";
import { faqAndStart } from "../content";
import { mmButton, Section, SectionHeading, underlineLinkClasses, underlineTransition } from "./primitives";

/**
 * Public/Home.dc.html's final section: a single-open FAQ accordion (4
 * items, matching handoff/FACT_LOG.md's product facts) beside a compact
 * "start with one practice set" card — not the full ClosingCta band
 * MarketingPage.tsx uses on the other marketing routes, which this page
 * no longer renders.
 */
export function FaqAndStart() {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <Section labelledBy="faq-heading">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-7">
          <SectionHeading id="faq-heading" eyebrow={faqAndStart.eyebrow} title={faqAndStart.heading} />

          <div className="border-t border-mm-line">
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
                      className="flex min-h-[68px] w-full items-center justify-between gap-4 border-0 bg-none py-3.5 text-left text-[17.5px] font-semibold text-mm-ink transition-colors hover:text-mm-brand"
                    >
                      {item.question}
                      <ChevronDown
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-mm-brand transition-transform"
                        style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                      />
                    </button>
                  </h3>
                  {isOpen && (
                    <div id={panelId} role="region" aria-labelledby={buttonId} className="pb-5 pr-10 text-[16px] leading-[1.6] text-mm-ink-soft">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Reveal className="flex flex-col gap-4 rounded-[28px] border border-mm-line bg-white p-[clamp(24px,3vw,40px)]">
          <h2 className="m-0 text-pretty text-[clamp(28px,2.6vw,40px)] font-medium leading-[1.06] tracking-[-0.035em] text-mm-ink">
            {faqAndStart.card.heading}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-mm-ink-soft">{faqAndStart.card.body}</p>
          <Link
            href={faqAndStart.card.primaryCta.href}
            className={mmButton({ size: "lg", className: "justify-center" })}
          >
            {faqAndStart.card.primaryCta.label}
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
            <Link
              href={faqAndStart.card.plansLink.href}
              style={underlineTransition}
              className={underlineLinkClasses({ tone: "brand", className: "font-semibold" })}
            >
              {faqAndStart.card.plansLink.label}
            </Link>
            <Link
              href={faqAndStart.card.helpLink.href}
              style={underlineTransition}
              className={underlineLinkClasses({ tone: "brand", className: "font-semibold" })}
            >
              {faqAndStart.card.helpLink.label}
            </Link>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
