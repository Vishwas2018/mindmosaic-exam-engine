"use client";

import { BookOpen, KeyRound } from "lucide-react";
import type { ConceptSection as ConceptSectionType } from "../schema";
import { LessonVisualRenderer } from "./LessonVisualRenderer";

interface ConceptSectionProps {
  section: ConceptSectionType;
}

export function ConceptSection({ section }: ConceptSectionProps) {
  return (
    <section
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-mm-line bg-white shadow-xs transition-shadow duration-200 hover:shadow-sm"
    >
      <div className="border-b border-mm-line-soft bg-gradient-to-r from-mm-tint/50 via-mm-tint-soft/30 to-white px-6 py-4.5 sm:px-8">
        <div className="flex items-center gap-2 text-mm-brand">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-brand text-white shadow-2xs">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
            Concept & Key Rules
          </span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-2 text-xl font-bold tracking-tight text-mm-ink sm:text-2xl">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-6 p-6 sm:p-8">
        <div className="prose max-w-none text-[15.5px] leading-[1.75] text-mm-ink-soft whitespace-pre-line font-normal">
          {section.explanation}
        </div>

        {section.keyTerms && section.keyTerms.length > 0 && (
          <div className="rounded-2xl border border-mm-brand/15 bg-gradient-to-br from-mm-tint/25 to-slate-50/60 p-5 sm:p-6">
            <div className="mb-3.5 flex items-center gap-2 text-mm-ink">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-mm-brand/10 text-mm-brand">
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-mm-brand">
                Key Vocabulary & Terms
              </h3>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {section.keyTerms.map((kt) => (
                <div
                  key={kt.term}
                  className="rounded-xl border border-mm-line bg-white p-3.5 shadow-2xs transition-all duration-180 hover:border-mm-brand/30 hover:shadow-xs"
                >
                  <dt className="text-sm font-bold text-mm-ink flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-mm-brand shrink-0" />
                    {kt.term}
                  </dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-mm-muted pl-3">
                    {kt.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {section.visualAsset && (
          <div className="mt-1 overflow-hidden rounded-2xl border border-mm-line bg-slate-50/70 p-4 shadow-inner sm:p-6">
            <LessonVisualRenderer visual={section.visualAsset} />
          </div>
        )}
      </div>
    </section>
  );
}
