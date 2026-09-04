"use client";

import { AlertCircle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import type { MisconceptionSection as MisconceptionSectionType } from "../schema";

interface MisconceptionCardProps {
  section: MisconceptionSectionType;
}

export function MisconceptionCard({ section }: MisconceptionCardProps) {
  return (
    <section
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-sm"
    >
      <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white px-6 py-4.5 sm:px-8">
        <div className="flex items-center gap-2 text-rose-700">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-600 text-white shadow-2xs">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-700">
            Common Misconception & Trap
          </span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-2 text-xl font-bold tracking-tight text-mm-ink sm:text-2xl">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-4.5 p-6 sm:p-8">
        {/* The False Claim */}
        <div className="rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/70 to-rose-100/30 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-rose-100 text-rose-600 shrink-0">
              <XCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                What Many Students Think (Incorrect):
              </p>
              <p className="mt-1.5 text-[15.5px] font-semibold text-rose-950 leading-snug">
                &ldquo;{section.claim}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Why it is wrong */}
        <div className="rounded-2xl border border-mm-line bg-slate-50/70 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200/80 text-mm-muted shrink-0">
              <HelpCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mm-muted">
                Why this thinking doesn&apos;t work:
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-mm-ink-soft">
                {section.whyWrong}
              </p>
            </div>
          </div>
        </div>

        {/* The Correct Understanding */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
              <CheckCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                The Correct Mathematical Rule:
              </p>
              <p className="mt-1.5 text-[15.5px] font-medium leading-relaxed text-emerald-950">
                {section.correction}
              </p>
              {section.example && (
                <div className="mt-3 rounded-xl bg-white/90 p-3 text-[14px] text-emerald-950 border border-emerald-200/70 shadow-2xs">
                  <strong className="font-bold text-emerald-900">Example: </strong>
                  <span className="font-mono text-[13.5px]">{section.example}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
