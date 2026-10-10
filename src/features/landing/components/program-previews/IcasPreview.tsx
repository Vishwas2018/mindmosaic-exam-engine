import { ArrowRight, BookOpen, Calculator, FlaskConical, Laptop2, SpellCheck } from "lucide-react";

import { StudentHeader } from "./chrome";

/**
 * The ICAS-style practice hub as it stands in /practice/icas. The names and blurbs are the live catalogue's
 * (a unit test pins them), so the preview cannot drift from the product. Science and Digital Technologies are
 * shown the way the real page shows a subject without enough published questions: dashed, and not offered.
 */
export const ICAS_PREVIEW_CORE = [
  { icon: Calculator, name: "ICAS-style Mathematics — Grade 3", blurb: "Challenge-oriented mathematical reasoning and problem solving." },
  { icon: BookOpen, name: "ICAS-style English: Reading — Grade 3", blurb: "Reasoning-focused reading practice with original passages." },
  { icon: SpellCheck, name: "ICAS-style English: Language — Grade 3", blurb: "Reasoning-focused spelling, grammar and punctuation practice." },
] as const;

const ALSO = [
  { icon: FlaskConical, label: "Science" },
  { icon: Laptop2, label: "Digital Technologies" },
  { icon: SpellCheck, label: "Spelling" },
] as const;

export function IcasPreview() {
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="practice" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
        <div className="relative shrink-0 overflow-hidden rounded-3xl border-2 border-teal-border bg-white p-6 shadow-warm-card">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-gradient-to-br from-teal-light/70 to-primary-tint/40 blur-3xl"
          />
          <div className="relative max-w-[560px]">
            <span className="mb-2.5 inline-block rounded-lg bg-teal-light px-3 py-1 font-vietnam text-xs font-bold uppercase tracking-wide text-teal-accent">
              Years 3 &amp; 5 · Competition-style practice
            </span>
            <p className="m-0 font-jakarta text-[32px] font-extrabold leading-tight tracking-tight text-plum-dark">ICAS practice</p>
            <p className="m-0 mt-2 font-vietnam text-[14.5px] leading-relaxed text-plum-muted">
              High-order, reasoning-focused questions in the ICAS style — your own objective marks after every sitting, never a
              percentile or class ranking.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-vietnam text-[13px] font-semibold text-plum-muted">Year level:</span>
          <div className="inline-flex gap-1.5 rounded-2xl bg-surface-container-high p-1.5 shadow-inner">
            <span className="rounded-xl bg-white px-5 py-1.5 font-jakarta text-[13px] font-bold text-teal-accent shadow-sm">Year 3</span>
            <span className="rounded-xl px-5 py-1.5 font-jakarta text-[13px] font-bold text-plum-muted">Year 5</span>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-4">
          {ICAS_PREVIEW_CORE.map(({ icon: Icon, name, blurb }) => (
            <div
              key={name}
              className="flex flex-col justify-between rounded-2xl border border-parchment-border bg-white p-5 shadow-warm-sm"
            >
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-light text-teal-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="m-0 font-jakarta text-[15px] font-bold leading-snug text-plum-dark">{name}</p>
                <p className="m-0 mt-1.5 font-vietnam text-[12.5px] leading-relaxed text-plum-muted">{blurb}</p>
              </div>
              <span className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-accent font-jakarta text-[13px] font-bold text-white">
                Configure session
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          <p className="m-0 mb-2.5 font-jakarta text-[15px] font-bold text-plum-dark">Also part of ICAS</p>
          <div className="grid grid-cols-3 gap-4">
            {ALSO.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-dashed border-parchment-border bg-surface-container-low p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-plum-muted">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="m-0 font-jakarta text-[13px] font-bold text-plum-dark">{label}</p>
                <p className="m-0 mt-1 font-vietnam text-[11.5px] text-plum-muted">
                  Not enough questions published yet for Year 3 — not offered as a session today.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
