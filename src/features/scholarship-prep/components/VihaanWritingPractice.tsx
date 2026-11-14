"use client";

import { Clock, Edit } from "lucide-react";
import { buttonClasses } from "@/components/ui";

const WRITING_TASKS = [
  { title: "Creative: The Unopened Door", type: "Creative", minutes: 15 },
  { title: "Persuasive: Should Homework Be Banned?", type: "Persuasive", minutes: 15 },
];

export function VihaanWritingPractice() {
  return (
    <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink">Writing practice</h2>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          15-minute timer · Rubric feedback
        </span>
      </div>
      <p className="text-sm text-mm-muted mb-6">
        Creative and persuasive writing tasks with a 15-minute timer. Responses
        receive rubric-based feedback and example responses. All scoring is
        server-authoritative — no fabricated results.
      </p>
      <div className="space-y-3">
        {WRITING_TASKS.map((task) => (
          <div
            key={task.title}
            className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4"
          >
            <div>
              <h3 className="text-sm font-bold text-ink">{task.title}</h3>
              <p className="mt-1 text-[11px] text-mm-muted">
                {task.type} · {task.minutes}-minute timer
              </p>
            </div>
            <a
              href="#"
              className="rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
              aria-disabled="true"
              onClick={(e) => e.preventDefault()}
            >
              Write
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
