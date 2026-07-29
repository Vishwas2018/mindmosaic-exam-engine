"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { faq } from "../content";
import { SectionHeading } from "./primitives";

/** Accessible single-open disclosure accordion (button + aria-expanded/aria-controls, no external library). */
function FaqItem({
  id,
  question,
  answer,
  open,
  onToggle,
}: {
  id: string;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;
  return (
    <div className="border-b border-brand/10 py-1">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full min-h-14 items-center justify-between gap-4 rounded-xl px-2 text-left text-base font-bold text-lp-ink transition hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        >
          <span>{question}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-brand transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      {open && (
        <div id={panelId} role="region" aria-labelledby={buttonId} className="px-2 pb-4 pt-1">
          <p className="text-sm leading-6 text-lp-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="site-width scroll-mt-24 py-16 sm:py-24">
      <SectionHeading
        id="faq-heading"
        eyebrow="FAQ"
        title={faq.heading}
        intro={faq.subheading}
        align="center"
      />

      <div className="mx-auto mt-10 max-w-2xl">
        {faq.items.map((item, index) => (
          <FaqItem
            key={item.question}
            id={`faq-${index}`}
            question={item.question}
            answer={item.answer}
            open={openIndex === index}
            onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
          />
        ))}
      </div>
    </section>
  );
}
