import { ArrowRight } from "lucide-react";

import { ConceptCaption, PlannedBadge, StudentHeader } from "./chrome";
import { useCompact } from "./compact";

const STEPS = [
  { n: 1, title: "Draw the model", body: "One bar for the whole, split in the ratio 3 : 5." },
  { n: 2, title: "Count the units", body: "3 + 5 = 8 equal units, and 8 units is 40 stickers." },
  { n: 3, title: "Find one unit", body: "40 ÷ 8 = 5 stickers in 1 unit." },
] as const;

const UNITS = 8;
const MIA = 3;

/** A bracket over `span` of the eight columns, with its label centred on it. */
function Bracket({ span, label, tone, below = false }: { span: number; label: string; tone: string; below?: boolean }) {
  return (
    <div
      style={{ gridColumn: `span ${span} / span ${span}` }}
      className={`flex flex-col items-center gap-1 ${below ? "flex-col-reverse" : ""}`}
    >
      <span className={`whitespace-nowrap font-jakarta text-[12.5px] font-bold tabular-nums ${tone}`}>{label}</span>
      <span className={`h-2.5 w-full border-current ${below ? "rounded-b-md border-x-2 border-b-2" : "rounded-t-md border-x-2 border-t-2"} ${tone}`} />
    </div>
  );
}

/**
 * Illustrative concept: one bar for the whole, eight equal units, the first three Mia's and the last five Ben's.
 * The 40-sticker bracket spans the whole bar. The numbers match the Chapter 2 sample (8 units = 40 stickers).
 */
export function SingaporePreview() {
  const compact = useCompact();
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="practice" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-6 pt-4">
        <p className="m-0 font-vietnam text-[12px] font-semibold uppercase tracking-wider text-plum-muted">Practice / Singapore Maths</p>
        <PlannedBadge programme="Singapore Maths" />
      </div>
      <div className={`grid min-h-0 flex-1 gap-4 px-6 py-4 ${compact ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_240px]"}`}>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-coral-border bg-white shadow-warm-card">
          <div className="shrink-0 border-b border-coral-border/60 bg-coral-light/60 px-6 py-4">
            <p className="m-0 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-coral-accent">Bar model · Part–whole</p>
            <p className="m-0 mt-1.5 font-jakarta text-[16px] font-bold leading-snug text-plum-dark">
              Mia and Ben share 40 stickers in the ratio 3 : 5. How many stickers does each child get?
            </p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 px-6 py-5">
            <div className="grid grid-cols-8">
              <Bracket span={UNITS} label="40 stickers" tone="text-plum-dark" />
              {Array.from({ length: UNITS }, (_, index) => (
                <div
                  key={index}
                  className={`mt-2 grid h-14 place-items-center text-[13px] font-bold text-white ${
                    index < MIA ? "bg-coral-accent" : "bg-primary"
                  } ${index > 0 && index !== MIA ? "border-l border-white/50" : ""} ${index === 0 || index === MIA ? "rounded-l-md" : ""} ${index === MIA - 1 || index === UNITS - 1 ? "rounded-r-md" : ""}`}
                >
                  1u
                </div>
              ))}
              <div className="col-span-8 mt-2 grid grid-cols-8">
                <Bracket span={MIA} label="Mia · 3 units" tone="text-coral-accent" below />
                <Bracket span={UNITS - MIA} label="Ben · 5 units" tone="text-primary" below />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-surface-container-low px-4 py-3 font-jakarta text-[14px] font-bold text-plum-dark">
              <span className="tabular-nums">8 units = 40</span>
              <ArrowRight className="h-4 w-4 text-coral-accent" aria-hidden="true" />
              <span className="tabular-nums">1 unit = 5</span>
              <ArrowRight className="h-4 w-4 text-coral-accent" aria-hidden="true" />
              <span className="tabular-nums">Mia 15 · Ben 25</span>
            </div>
          </div>
        </section>
        {!compact && (
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
        )}
      </div>
      <ConceptCaption>Singapore Maths · in development</ConceptCaption>
    </div>
  );
}
