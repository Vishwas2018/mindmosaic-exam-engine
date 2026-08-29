"use client";

import { AlertCircle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import type { MisconceptionSection as MisconceptionSectionType } from "../schema";

interface MisconceptionCardProps {
  section: MisconceptionSectionType;
}

export function MisconceptionCard({ section }: MisconceptionCardProps) {
  return (
    <section
      aria-labelledby={`heading-${section.id}`}
      className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm"
    >
      <div className="border-b border-rose-100 bg-rose-50/70 px-6 py-4">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Common Misconception & Trap
          </span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-1 text-xl font-bold text-mm-ink">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-4 p-6">
        {/* The False Claim */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4">
          <div className="flex items-start gap-2.5">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-800">
                What Many Students Think (Incorrect):
              </p>
              <p className="mt-1 text-[15px] font-semibold text-rose-950">&ldquo;{section.claim}&rdquo;</p>
            </div>
          </div>
        </div>

        {/* Why it is wrong */}
        <div className="rounded-xl border border-mm-line bg-slate-50/60 p-4">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-mm-muted" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-mm-muted">
                Why this thinking doesn&apos;t work:
              </p>
              <p className="mt-1 text-[14.5px] leading-relaxed text-mm-ink-soft">{section.whyWrong}</p>
            </div>
          </div>
        </div>

        {/* The Correct Understanding */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                The Correct Mathematical Rule:
              </p>
              <p className="mt-1 text-[15px] font-medium leading-relaxed text-emerald-950">
                {section.correction}
              </p>
              {section.example && (
                <p className="mt-2 rounded-lg bg-white/80 p-2.5 text-[13.5px] font-mono text-emerald-900 border border-emerald-100">
                  <strong>Example: </strong>
                  {section.example}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
