"use client";

import { Clock, ClipboardList } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const MOCK_SECTIONS = [
  { title: "Objective Section 1 — Mathematics", minutes: 30 },
  { title: "Objective Section 2 — Numerical Reasoning", minutes: 30 },
  { title: "Objective Section 3 — Verbal Reasoning", minutes: 30 },
  { title: "Objective Section 4 — Reading Comprehension", minutes: 30 },
  { title: "Writing Task — Creative/Persuasive", minutes: 15 },
];

export function VihaanMockExams() {
  return (
    <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Mock examinations</h2>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          Timed · Scored · Reviewed
        </span>
      </div>
      <p className="text-sm text-mm-muted mb-6">
        Simulates the full scholarship examination experience: four 30-minute
        objective sections plus a 15-minute writing task. Runs through the
        existing exam engine for server-authoritative scoring and real attempt
        history. Nothing is fabricated.
      </p>
      <div className="space-y-3">
        {MOCK_SECTIONS.map((section) => (
          <div
            key={section.title}
            className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4"
          >
            <div>
              <h3 className="text-sm font-bold text-ink">{section.title}</h3>
              <p className="mt-1 text-[11px] text-mm-muted">{section.minutes}-minute timed section</p>
            </div>
            <a
              href="#"
              className="rounded-btn border border-mm-line bg-mm-page/50 px-3.5 py-2 text-xs font-semibold text-mm-muted"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              Start section
            </a>
            <p className="mt-2 text-[10px] text-mm-muted italic">
              Pending content approval
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
