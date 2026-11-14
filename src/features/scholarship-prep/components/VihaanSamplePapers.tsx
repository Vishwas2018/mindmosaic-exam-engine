"use client";

import { FileText } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const SAMPLE_PAPERS = [
  { title: "Mathematics — Sample Paper 1", questions: 40, minutes: 40, subject: "Mathematics" },
  { title: "Numerical Reasoning — Sample Paper 1", questions: 30, minutes: 30, subject: "Numerical Reasoning" },
  { title: "Verbal Reasoning — Sample Paper 1", questions: 30, minutes: 30, subject: "Verbal Reasoning" },
  { title: "Reading Comprehension — Sample Paper 1", questions: 30, minutes: 30, subject: "Reading Comprehension" },
];

export function VihaanSamplePapers() {
  return (
    <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Sample papers</h2>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-coral/40 text-[10px] font-semibold text-mm-coral">
          Unofficial — Edutest-style
        </span>
      </div>
      <p className="text-sm text-mm-muted mb-6">
        Original practice papers authored in the style of Edutest assessments.
        These are <strong>not</strong> official Edutest or ACER papers and are
        not endorsed by any examination body. Includes answers and detailed
        explanations. Printable format available.
      </p>
      <div className="space-y-3">
        {SAMPLE_PAPERS.map((paper) => (
          <div
            key={paper.title}
            className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4"
          >
            <div>
              <h3 className="text-sm font-bold text-ink">{paper.title}</h3>
              <p className="mt-1 text-[11px] text-mm-muted">
                {paper.questions} questions · {paper.minutes} min · {paper.subject}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-btn border border-mm-line bg-mm-page/50 px-3.5 py-2 text-xs font-semibold text-mm-muted"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                View paper
              </a>
              <a
                href="#"
                className="rounded-btn border border-mm-line bg-mm-page/50 px-3.5 py-2 text-xs font-semibold text-mm-muted"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
              >
                Print
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-mm-line/40 bg-mm-tint/40 p-4">
        <p className="text-[11px] font-semibold text-mm-ink">
          ⚠️ These are original MindMosaic practice papers, not official Edutest
          materials. No affiliation with or endorsement by Edutest or ACER is
          implied.
        </p>
      </div>
    </section>
  );
}
