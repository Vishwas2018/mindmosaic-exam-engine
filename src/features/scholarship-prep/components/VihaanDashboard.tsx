"use client";

import Link from "next/link";

import type { StudentContext } from "@/features/student/require-student";
import type { StudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { buildStudyPlan, recommendNextFocus } from "../lib/study-plan";
import { VihaanSmartRevision } from "./VihaanSmartRevision";
import { VihaanStudyPlan } from "./VihaanStudyPlan";

export function VihaanDashboard({
  student,
}: {
  student: StudentContext;
  shellData: StudentPortalShellData;
}) {
  const plan = buildStudyPlan([]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Vihaan Scholarship Prep</h1>
        <p className="mt-2 text-sm text-mm-muted">
          Welcome, {student.displayName ?? "Vihaan"}. Your Year 5 scholarship preparation
          workspace is awaiting content approval.
        </p>
      </div>
      <section className="rounded-2xl border border-mm-line bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Content is being reviewed</h2>
          <Link
            href="/student/vihaan/diagnostic"
            className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
          >
            Open diagnostic assessment
          </Link>
        </div>
        <p className="text-sm text-mm-muted">
          Lessons, randomised practice, revision, writing tasks and mock papers will become
          available after validation and human approval. Draft questions are unavailable to
          students.
        </p>
      </section>
      <section className="rounded-2xl border border-mm-line bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-ink">Suggested study routine</h2>
        <p className="mb-4 text-sm text-mm-muted">
          A suggested routine, pending approved activities. Personalised recommendations need
          recorded practice results.
        </p>
        <VihaanStudyPlan plan={plan} nextFocus={recommendNextFocus([])} />
      </section>
      <VihaanSmartRevision />
    </div>
  );
}
