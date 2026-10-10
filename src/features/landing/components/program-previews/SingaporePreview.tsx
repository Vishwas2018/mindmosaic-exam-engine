import { ArrowRight } from "lucide-react";

import { ConceptCaption, PlannedBadge, StudentHeader } from "./chrome";

const STEPS = [
  { n: 1, title: "Draw the model", body: "Mia has 3 units, Ben has 5 units." },
  { n: 2, title: "Count the units", body: "3 + 5 = 8 units, and 8 units is 40 stickers." },
  { n: 3, title: "Find one unit", body: "40 ÷ 8 = 5 stickers in 1 unit." },
] as const;

const ROWS = [
  { who: "Mia", units: 3, tone: "bg-coral-accent" },
  { who: "Ben", units: 5, tone: "bg-primary" },
] as const;

/** Illustrative concept: a bar model built step by step. The numbers match the Chapter 2 sample (8 units = 40 stickers). */
export function SingaporePreview() {
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="practice" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-4">
        <p className="m-0 font-vietnam text-[12px] font-semibold uppercase tracking-wider text-plum-muted">Practice / Singapore Maths</p>
        <PlannedBadge programme="Singapore Maths" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_240px] gap-4 px-6 py-4">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-coral-border bg-white shadow-warm-card">
          <div className="shrink-0 border-b border-coral-border/60 bg-coral-light/60 px-6 py-4">
            <p className="m-0 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-coral-accent">Bar model · Part–whole</p>
            <p className="m-0 mt-1.5 font-jakarta text-[16px] font-bold leading-snug text-plum-dark">
              Mia and Ben share 40 stickers. Ben has 5 parts for every 3 parts Mia has. How many stickers does each child have?
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-6 py-5">
            <div className="relative pt-7">
              <div className="absolute inset-x-0 top-0 flex items-center gap-2 text-[12.5px] font-bold text-plum-dark">
                <span className="h-2.5 w-px bg-plum-muted" />
                <span className="h-px flex-1 bg-plum-muted" />
                <span className="rounded-md bg-white px-2 tabular-nums">40 stickers</span>
                <span className="h-px flex-1 bg-plum-muted" />
                <span className="h-2.5 w-px bg-plum-muted" />
              </div>
              {ROWS.map((row) => (
                <div key={row.who} className="mb-3 flex items-center gap-3">
                  <span className="w-9 shrink-0 font-jakarta text-[13px] font-bold text-plum-dark">{row.who}</span>
                  <div className="grid flex-1 grid-cols-8 gap-1">
                    {Array.from({ length: 8 }, (_, index) => (
                      <div
                        key={index}
                        className={`grid h-14 place-items-center rounded-md text-[13px] font-bold ${
                          index < row.units ? `${row.tone} text-white` : "border border-dashed border-parchment-border"
                        }`}
                      >
                        {index < row.units ? "1u" : ""}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 font-jakarta text-[14px] font-bold text-plum-dark">
              <span className="tabular-nums">8 units = 40</span>
              <ArrowRight className="h-4 w-4 text-coral-accent" aria-hidden="true" />
              <span className="tabular-nums">1 unit = 5</span>
              <ArrowRight className="h-4 w-4 text-coral-accent" aria-hidden="true" />
              <span className="tabular-nums">Mia 15 · Ben 25</span>
            </div>
          </div>
        </section>
        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <p className="m-0 font-jakarta text-[13px] font-extrabold uppercase tracking-wider text-plum-muted">Build it step by step</p>
          {STEPS.map((step, index) => (
            <div
              key={step.n}
              className={`rounded-2xl border bg-white p-3.5 ${index === 1 ? "border-coral-accent shadow-warm-card" : "border-parchment-border shadow-warm-sm"}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-extrabold ${
                    index === 1 ? "bg-coral-accent text-white" : "bg-surface-container-high text-plum-muted"
                  }`}
                >
                  {step.n}
                </span>
                <p className="m-0 font-jakarta text-[13.5px] font-bold text-plum-dark">{step.title}</p>
              </div>
              <p className="m-0 mt-1.5 font-vietnam text-[12.5px] leading-snug text-plum-muted">{step.body}</p>
            </div>
          ))}
        </aside>
      </div>
      <ConceptCaption>Singapore Maths · in development</ConceptCaption>
    </div>
  );
}
