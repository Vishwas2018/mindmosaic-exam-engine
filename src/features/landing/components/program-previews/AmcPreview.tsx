import { Lightbulb, Search, Undo2 } from "lucide-react";

import { ConceptCaption, PlannedBadge, StudentHeader } from "./chrome";
import { useCompact } from "./compact";

const OPTIONS = ["47", "71", "95", "96", "191"] as const;
const HINTS = [
  { icon: Search, title: "Look for the rule", body: "What happens between one term and the next?" },
  { icon: Undo2, title: "Try working backwards", body: "Start from what you know and undo a step." },
  { icon: Lightbulb, title: "Test a smaller case", body: "Check your rule on the first few terms." },
] as const;

/** Illustrative concept: a competition-style, non-routine problem. Original wording; nothing here is a past paper. */
export function AmcPreview() {
  const compact = useCompact();
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="practice" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-4">
        <p className="m-0 font-vietnam text-[12px] font-semibold uppercase tracking-wider text-plum-muted">
          {compact ? "Practice / AMC" : "Practice / AMC (Australian Mathematics Competition)"}
        </p>
        <PlannedBadge programme="AMC" />
      </div>
      <div className={`grid min-h-0 flex-1 gap-4 px-6 py-4 ${compact ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_250px]"}`}>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.09)]">
          <div className="flex shrink-0 items-center justify-between border-b border-primary/8 bg-[linear-gradient(110deg,#FFFFFF_0%,#F7F4FF_100%)] px-6 py-4">
            <div>
              <p className="m-0 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-primary">Problem 4 of 10</p>
              <p className="m-0 mt-1 text-[12.5px] font-semibold text-plum-muted">Non-routine arithmetic &amp; patterns · Multi-step</p>
            </div>
            <span className="rounded-full bg-primary-tint px-3 py-1 text-[12px] font-bold text-primary">Untimed investigation</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
            <p className="m-0 font-jakarta text-[17px] font-bold leading-snug text-plum-dark">
              Each number in this pattern is double the one before it, plus 1. What is the sixth number?
            </p>
            <div className="flex shrink-0 items-end gap-2 overflow-hidden rounded-2xl border border-parchment-border bg-surface-container-low px-3 py-4">
              {[2, 5, 11, 23].map((value, index) => (
                <div key={value} className="flex flex-col items-center gap-1.5">
                  <div
                    className="grid place-items-center rounded-lg bg-primary text-[15px] font-extrabold tabular-nums text-white"
                    style={{ width: (compact ? 34 : 48) + index * (compact ? 4 : 8), height: 36 + index * 10, opacity: 0.55 + index * 0.15 }}
                  >
                    {value}
                  </div>
                  <span className="text-[11.5px] font-bold text-plum-muted">Term {index + 1}</span>
                </div>
              ))}
              {[5, 6].map((term) => (
                <div key={term} className="flex flex-col items-center gap-1.5">
                  <div className={`grid h-[84px] place-items-center ${compact ? "w-[40px]" : "w-[88px]"} rounded-lg border-2 border-dashed border-primary/45 text-[18px] font-extrabold text-primary`}>
                    ?
                  </div>
                  <span className="text-[11.5px] font-bold text-plum-muted">Term {term}</span>
                </div>
              ))}
            </div>
            <div className={`grid shrink-0 gap-2.5 ${compact ? "grid-cols-3" : "grid-cols-5"}`}>
              {OPTIONS.map((option, index) => (
                <div
                  key={option}
                  className="flex min-h-12 items-center gap-2.5 rounded-xl border border-royal/15 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(49,32,86,0.04)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-page text-[13px] font-bold text-muted">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums text-ink">{option}</span>
                </div>
              ))}
            </div>
            {!compact && (
            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-dashed border-parchment-border bg-surface-container-low/60 px-4 py-3">
              <p className="m-0 font-jakarta text-[12px] font-extrabold uppercase tracking-wider text-plum-muted">Your working</p>
              <div className="mt-2 grid flex-1 content-start gap-[26px] opacity-60">
                {[0, 1, 2].map((line) => (
                  <span key={line} className="h-px w-full bg-parchment-border" />
                ))}
              </div>
            </div>
            )}
          </div>
        </section>
        {!compact && (
        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <p className="m-0 font-jakarta text-[13px] font-extrabold uppercase tracking-wider text-plum-muted">Ways to start</p>
          {HINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-parchment-border bg-white p-4 shadow-warm-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-tint text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="m-0 font-jakarta text-[13.5px] font-bold text-plum-dark">{title}</p>
              </div>
              <p className="m-0 mt-2 font-vietnam text-[12.5px] leading-snug text-plum-muted">{body}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary-tint/40 p-4 font-vietnam text-[12.5px] leading-snug text-plum-muted">
            Worked solutions with every problem, once this track launches.
          </div>
        </aside>
        )}
      </div>
      <ConceptCaption>AMC · in development</ConceptCaption>
    </div>
  );
}
