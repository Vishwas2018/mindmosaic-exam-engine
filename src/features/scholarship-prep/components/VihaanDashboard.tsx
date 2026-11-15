"use client";
import type { StudentContext } from "@/features/student/require-student";
import type { StudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { buildStudyPlan, recommendNextFocus } from "../lib/study-plan";
import { VihaanStudyPlan } from "./VihaanStudyPlan";
import { VihaanSmartRevision } from "./VihaanSmartRevision";

export function VihaanDashboard({ student }: { student: StudentContext; shellData: StudentPortalShellData }) {
  const plan = buildStudyPlan([]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-ink">Vihaan Scholarship Prep</h1>
        <p className="mt-2 text-sm text-mm-muted">Welcome, {student.displayName ?? "Vihaan"}. Your Year 5 scholarship preparation workspace is awaiting content approval.</p>
      </div>
      <section className="rounded-2xl border border-mm-line bg-white p-6">
        <h2 className="text-xl font-bold text-ink">Content is being reviewed</h2>
        <p className="mt-3 text-sm text-mm-muted">Lessons, randomised practice, revision, writing tasks and mock papers will become available after validation and human approval. Draft questions are unavailable to students.</p>
      </section>
      <section className="rounded-2xl border border-mm-line bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-ink">Suggested study routine</h2>
        <p className="mb-4 text-sm text-mm-muted">A suggested routine, pending approved activities. Personalised recommendations need recorded practice results.</p>
        <VihaanStudyPlan plan={plan} nextFocus={recommendNextFocus([])} />
      </section>
      <VihaanSmartRevision />
    </div>
  );
}
