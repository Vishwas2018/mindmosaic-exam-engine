import Link from "next/link";
import { Fragment } from "react";

import { faq } from "../content";
import { Eyebrow } from "./primitives";

/**
 * Native <details>/<summary> accordions: they open and close with Enter
 * and Space, are exposed correctly to assistive tech, and work before
 * JavaScript loads — no state, no client bundle. The "+" glyph rotates
 * into an "×" via the `.mm-plus` rule in globals.css.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-mm-page py-[clamp(40px,4vw,64px)]">
      <div className="mm-width grid items-start gap-[clamp(24px,2.6vw,40px)] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Eyebrow className="mb-4">{faq.eyebrow}</Eyebrow>
          <h2
            id="faq-heading"
            className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {faq.heading}
          </h2>
          <p className="mt-[18px] text-[16.5px] leading-[1.6] text-mm-muted">
            {faq.introLead}
            <Link href={faq.introLink.href} className="font-bold text-mm-brand underline underline-offset-2">
              {faq.introLink.label}
            </Link>
            {faq.introTail}
          </p>
        </div>

        <div className="grid min-w-0 gap-2.5">
          {faq.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-[14px] border border-mm-line/80 bg-white px-5 shadow-sm transition-all open:border-mm-brand/40"
            >
              <summary className="flex min-h-[58px] cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-bold text-mm-ink hover:text-mm-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mm-brand/30">
                <span>{item.question}</span>
                <span aria-hidden="true" className="mm-plus shrink-0 text-xl font-semibold text-mm-brand">
                  +
                </span>
              </summary>
              <p className="border-t border-mm-line/40 pt-3 pb-5 text-[14.5px] leading-[1.6] text-mm-muted">
                {item.answer}
                {item.link && (
                  <>
                    {" "}
                    <Link href={item.link.href} className="font-bold text-mm-brand underline underline-offset-2 hover:text-mm-brand-deep">
                      {item.link.label}
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}

          <p className="mt-1.5 text-[14.5px] leading-[1.6] text-mm-muted">
            {faq.footnoteLead}
            {faq.footnoteLinks.map((link, index) => (
              <Fragment key={link.label}>
                <Link href={link.href} className="font-bold text-mm-brand underline underline-offset-2">
                  {link.label}
                </Link>
                {index < faq.footnoteLinks.length - 2 ? ", " : null}
                {index === faq.footnoteLinks.length - 2 ? " and " : null}
                {index === faq.footnoteLinks.length - 1 ? "." : null}
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
