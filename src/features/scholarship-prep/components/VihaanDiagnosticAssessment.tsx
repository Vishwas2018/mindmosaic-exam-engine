"use client";

import { Clock } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const DIAGNOSTIC_SECTIONS = [
  { title: "Mathematics", questions: 10, minutes: 15, subject: "mathematics" },
  { title: "Numerical Reasoning", questions: 10, minutes: 15, subject: "numerical_reasoning" },
  { title: "Verbal Reasoning", questions: 10, minutes: 15, subject: "verbal_reasoning" },
  { title: "Reading Comprehension", questions: 10, minutes: 15, subject: "reading_comprehension" },
  { title: "Written Expression", questions: 1, minutes: 15, subject: "written_expression" },
];

export function VihaanDiagnosticAssessment({ student }: { student: { displayName: string | null } }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Diagnostic Assessment
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            Establish your baseline for Year 7 scholarship preparation
          </p>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          One-time baseline — no scores are published — results personalise your study plan
        </span>
      </div>

      <p className="text-sm text-mm-muted mb-6">
        This diagnostic covers all five scholarship areas: Mathematics, Numerical Reasoning,
        Verbal Reasoning, Reading Comprehension and Written Expression. It takes about 75
        minutes. Your results are used only to personalise your study plan — nothing is
        published or shared beyond your account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIAGNOSTIC_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-mm-line bg-mm-page/50 p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white mb-3">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-ink">{section.title}</h3>
            <p className="mt-1 text-[11px] text-mm-muted">
              {section.questions} question{section.questions !== 1 ? "s" : ""} · {section.minutes} min
            </p>
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-1 rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-[11px] font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              Start section
            </a>
            <p className="mt-3 text-[10px] text-mm-muted italic">
              Diagnostic content pending approval — not yet servable
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-mm-line/40 bg-mm-tint/40 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-mm-coral" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink">About this diagnostic</p>
            <p className="text-xs text-mm-muted">
              Results establish your baseline across all five subjects. They are used solely
              to recommend where to focus your 60-minute daily practice. No score from this
              diagnostic is published or used for any certification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
