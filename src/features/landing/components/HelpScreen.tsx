"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

import { SUPPORT_EMAIL, helpPage } from "../content";
import { mmButton } from "./primitives";

/**
 * Help and contact — Public/Help.dc.html, merged with the former /contact
 * page (owner ruling, 1 Oct; /contact now permanently redirects here).
 *
 * The design draws a three-field "Send a message" form with no real
 * endpoint (a `setTimeout` fakes success or failure). This product has a
 * standing "no contact form" decision instead: one real email address that
 * reaches a person. A form that animates to "Message sent" without
 * anything actually being sent would be exactly the kind of invented claim
 * this product elsewhere goes out of its way to avoid, so the contact
 * section here is a real `mailto:` link, not a simulated submit.
 */
export function HelpScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mm-width grid gap-12 py-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
      <div className="grid min-w-0 gap-7">
        <h1 className="text-[clamp(40px,5vw,76px)] font-bold leading-none tracking-[-0.04em] text-mm-ink">
          {helpPage.heading}
        </h1>
        <p className="max-w-[540px] text-lg leading-[1.6] text-mm-muted">{helpPage.intro}</p>

        <div className="border-t border-mm-line">
          {helpPage.faqs.map((faq, index) => {
            const open = openIndex === index;
            const panelId = `help-panel-${index}`;
            const buttonId = `help-button-${index}`;
            return (
              <div key={faq.question} className="border-b border-mm-line">
                <h2 className="m-0">
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 bg-transparent py-3 text-left font-semibold text-[17px] text-mm-ink"
                  >
                    {faq.question}
                    {open ? (
                      <Minus aria-hidden="true" className="h-5 w-5 shrink-0 text-mm-brand" />
                    ) : (
                      <Plus aria-hidden="true" className="h-5 w-5 shrink-0 text-mm-brand" />
                    )}
                  </button>
                </h2>
                {open && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="pb-[18px] pr-10 text-[16px] leading-[1.6] text-mm-muted"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <section
        id="contact"
        aria-labelledby="help-contact-heading"
        className="grid gap-[18px] rounded-[24px] border border-mm-line bg-white p-[clamp(22px,2.8vw,36px)]"
      >
        <h2
          id="help-contact-heading"
          className="text-[clamp(26px,2.4vw,34px)] font-bold tracking-[-0.03em] text-mm-ink"
        >
          {helpPage.contact.heading}
        </h2>
        <p className="text-[15.5px] leading-[1.6] text-mm-muted">{helpPage.contact.intro}</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className={mmButton({ className: "w-fit" })}>
          Email {SUPPORT_EMAIL}
        </a>
        <p className="text-[13.5px] leading-[1.5] text-mm-muted">{helpPage.contact.note}</p>
      </section>
    </div>
  );
}
