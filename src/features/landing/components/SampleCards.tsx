import { Check, Lightbulb } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

import { hero, productTour } from "../content";

/**
 * Marketing renditions of real product UI, built as HTML so the words,
 * numbers and logo are live text and the official brain mark — never part
 * of a photograph (docs/design.md §27). They are simplified, static and
 * clearly samples: not focusable, not interactive, no claims beyond what
 * the product does.
 */

const CARD = "rounded-2xl border border-mm-line bg-white shadow-[0_18px_40px_-24px_rgba(24,21,31,0.45)]";

export function SampleQuestionCard({ className }: { className?: string }) {
  const { demo } = hero;
  return (
    <article aria-label={demo.label} className={twMerge(CARD, "p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5">
          <MindMosaicLogo layout="mark" size="sm" trademark="none" />
          <span className="rounded-md bg-mm-tint px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-mm-brand">
            {demo.subject}
          </span>
        </span>
        <span className="whitespace-nowrap text-[13px] tabular-nums text-mm-muted">
          Question {demo.progress.current} of {demo.progress.total}
        </span>
      </div>
      <div aria-hidden="true" className="mt-3 grid h-1.5 grid-flow-col gap-1">
        {Array.from({ length: demo.progress.total }, (_, i) => (
          <span key={i} className={`rounded-full ${i < demo.progress.current ? "bg-mm-brand" : "bg-mm-track"}`} />
        ))}
      </div>
      <p className="m-0 mt-4 text-pretty text-[15px] font-medium leading-[1.5] text-mm-ink">{demo.question}</p>
      <ul className="m-0 mt-3.5 grid list-none grid-cols-2 gap-2 p-0">
        {demo.options.map((option) => (
          <li
            key={option.key}
            className={`flex min-h-10 items-center gap-3 rounded-xl border px-3 text-[15px] ${
              option.selected
                ? "border-2 border-mm-brand bg-mm-tint font-semibold text-mm-ink"
                : "border-mm-line bg-white text-mm-ink-soft"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                option.selected ? "bg-mm-brand text-white" : "border border-mm-line text-mm-muted"
              }`}
            >
              {option.key}
            </span>
            <span className="tabular-nums">
              <span className="sr-only">Option {option.key}: </span>
              {option.label}
            </span>
            {option.selected && <span className="sr-only">(selected answer)</span>}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SampleExplanationCard({ className }: { className?: string }) {
  const { explanation } = hero.demo;
  return (
    <article aria-label={explanation.label} className={twMerge(CARD, "bg-mm-wash p-4 sm:p-5", className)}>
      <p className="m-0 flex items-center gap-2.5 text-[15px] font-semibold text-mm-ink">
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-mm-ember-tint text-mm-ember-ink">
          <Lightbulb className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        {explanation.title}
      </p>
      <ol className="m-0 mt-3 grid list-none gap-1.5 p-0 text-[15px] leading-[1.45] text-mm-ink-soft tabular-nums">
        {explanation.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </article>
  );
}

/**
 * Learn -> Practise -> Progress, as three small connected screens: stacked
 * with a vertical thread below `sm`, three across with a small chevron
 * between them from `sm`.
 */
export function SampleFlow({ className }: { className?: string }) {
  const { flow, flowLabel } = productTour;
  return (
    <div className={className}>
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
        {flow.map((step) => (
          <li key={step.id} className="relative">
            <article className={twMerge(CARD, "relative z-[1] h-full p-4")} aria-label={`${step.label}: ${step.title}`}>
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.12em] text-mm-brand">{step.label}</p>
              <p className="m-0 mt-1.5 text-[17px] font-semibold tracking-[-0.01em] text-mm-ink">{step.title}</p>
              <p className="m-0 mt-1 text-[14px] leading-[1.45] text-mm-muted">{step.detail}</p>
              {"action" in step && (
                <span className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-mm-brand px-3.5 text-[14px] font-semibold text-white">
                  {step.action}
                </span>
              )}
              {"score" in step && (
                <div className="mt-3 flex items-center gap-3">
                  <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0B6B63] text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2DFD8]">
                    <span
                      className="block h-full rounded-full bg-[#0B6B63]"
                      style={{ width: `${(step.score.correct / step.score.total) * 100}%` }}
                    />
                  </span>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>
      <p className="m-0 mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-mm-muted">{flowLabel}</p>
    </div>
  );
}
