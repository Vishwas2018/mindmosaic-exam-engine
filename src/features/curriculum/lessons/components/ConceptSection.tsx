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
      aria-labelledby={`heading-${section.id}`}
      className="overflow-hidden rounded-2xl border border-parchment-border bg-white shadow-sm"
    >
      <div className="border-b border-parchment-border/60 bg-primary-tint/60 px-6 py-4">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Concept & Key Rules</span>
        </div>
        <h2 id={`heading-${section.id}`} className="mt-1 font-jakarta text-xl font-bold text-plum-dark">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-6 p-6">
        <div className="prose max-w-none text-[15.5px] leading-[1.7] text-plum-muted whitespace-pre-line">
          {section.explanation}
        </div>

        {section.keyTerms && section.keyTerms.length > 0 && (
          <div className="rounded-xl border border-parchment-border/60 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-plum-dark">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold uppercase tracking-wide">Key Vocabulary</h3>
            </div>
            <dl className="grid gap-2.5 sm:grid-cols-2">
              {section.keyTerms.map((kt) => (
                <div key={kt.term} className="rounded-lg border border-parchment-border bg-white p-3">
                  <dt className="text-sm font-bold text-plum-dark">{kt.term}</dt>
                  <dd className="mt-1 text-[13.5px] text-plum-muted">{kt.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {section.visualAsset && (
          <div className="mt-2 rounded-xl border border-parchment-border bg-slate-50/50 p-4">
            <LessonVisualRenderer visual={section.visualAsset} />
          </div>
        )}
      </div>
    </section>
  );
}
