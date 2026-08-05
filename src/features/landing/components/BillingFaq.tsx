import { plans } from "../content";
import { Section } from "./primitives";

/**
 * The five billing questions that close the Plans screen.
 *
 * Same native <details>/<summary> accordion as ./Faq.tsx — keyboard
 * operable, correctly exposed to assistive tech and working before
 * JavaScript loads. Kept as its own component rather than a prop on Faq
 * because the two lists answer different questions on different pages, and
 * sharing one component would only mean threading a "which list?" flag
 * through it.
 */
export function BillingFaq() {
  return (
    <Section tone="white" labelledBy="billing-faq-heading">
      <div className="grid items-start gap-[clamp(24px,2.6vw,40px)] lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="min-w-0">
          <h2
            id="billing-faq-heading"
            className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {plans.faq.heading}
          </h2>
          <p className="mt-[18px] text-[15px] leading-[1.6] text-mm-muted">
            {plans.faq.footnote}
          </p>
        </div>

        <div className="grid min-w-0 gap-2.5">
          {plans.faq.items.map((item) => (
            <details
              key={item.question}
              className="rounded-[13px] border border-mm-line bg-mm-page px-5"
            >
              <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-bold text-mm-ink">
                {item.question}
                <span
                  aria-hidden="true"
                  className="mm-plus shrink-0 text-xl font-semibold text-mm-brand"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-[15px] leading-[1.6] text-mm-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
