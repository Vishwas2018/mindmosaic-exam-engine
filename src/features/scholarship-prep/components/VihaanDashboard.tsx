"use client";

import { useState } from "react";
import Link from "next/link";

import type { StudentContext } from "@/features/student/require-student";
import type { StudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import type { Question } from "@/schemas/question.schema";
import {
  buildVihaanParentSummary,
  type RecordedOutcome,
  type VihaanSolutionDetail,
} from "../lib/practice";
import { buildStudyPlan, recommendNextFocus } from "../lib/study-plan";
import { VihaanDiagnosticExamRunner } from "./DiagnosticExamRunner";
import { VihaanSmartRevision } from "./VihaanSmartRevision";
import { VihaanStudyPlan } from "./VihaanStudyPlan";

const PRACTICE_SUBJECTS = [
  { key: "numeracy", label: "Mathematics" },
  { key: "numerical_reasoning", label: "Numerical Reasoning" },
  { key: "verbal_reasoning", label: "Verbal Reasoning" },
  { key: "reading", label: "Reading Comprehension" },
  { key: "writing", label: "Written Expression" },
] as const;

export function VihaanDashboard({
  student,
  questions = [],
  solutionsById = {},
  outcomes = [],
}: {
  student: StudentContext;
  shellData?: StudentPortalShellData;
  questions?: readonly Question[];
  solutionsById?: Readonly<Record<string, VihaanSolutionDetail>>;
  outcomes?: readonly RecordedOutcome[];
}) {
  const [activePracticeSubject, setActivePracticeSubject] = useState<string | null>(null);
  const summary = buildVihaanParentSummary(outcomes);
  const plan = buildStudyPlan(summary.weakSubjects);
  const hasApprovedQuestions = questions.length > 0;
  const activeQuestions = activePracticeSubject
    ? questions.filter((question) => question.metadata.subject === activePracticeSubject)
    : [];

  if (activePracticeSubject && activeQuestions.length > 0) {
    return (
      <div className="space-y-6" data-testid="vihaan-practice-runner">
        <VihaanDiagnosticExamRunner
          key={activePracticeSubject}
          questions={activeQuestions}
          subject={activePracticeSubject}
          solutionsById={solutionsById}
          persistToServer
          onExit={() => setActivePracticeSubject(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink">Vihaan Scholarship Prep</h1>
          <p className="mt-2 text-sm text-mm-muted">
            Welcome, {student.displayName ?? "Vihaan"}.{" "}
            {hasApprovedQuestions
              ? `${questions.length} verified Year 6 scholarship questions are approved for your DEV practice and diagnostic workspace.`
              : "Your scholarship preparation workspace is awaiting content approval."}
          </p>
        </div>
        {hasApprovedQuestions && (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Published for DEV ({questions.length} items)
          </span>
        )}
      </div>

      <section className="rounded-2xl border border-mm-line bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {hasApprovedQuestions ? "Diagnostic assessment" : "Content is being reviewed"}
            </h2>
            <p className="mt-1 text-sm text-mm-muted">
              {hasApprovedQuestions
                ? `Sit the full ${questions.length}-question mixed scholarship diagnostic covering Mathematics, Reasoning, Reading, and Writing with worked solutions and progress saving.`
                : "Lessons, randomised practice, revision, writing tasks and mock papers will become available after validation and human approval. Draft questions are unavailable to students."}
            </p>
          </div>
          <Link
            href="/student/vihaan/diagnostic"
            className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
          >
            Open diagnostic assessment
          </Link>
        </div>
      </section>

      {hasApprovedQuestions && (
        <section
          data-testid="vihaan-practice-section"
          className="rounded-2xl border border-mm-line bg-white p-6 space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold text-ink">Subject practice</h2>
            <p className="mt-1 text-sm text-mm-muted">
              Choose a scholarship domain to practise approved items with instant marking, worked
              solutions, and 1–5 writing rubric guidance.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_SUBJECTS.map((entry) => {
              const count = questions.filter((q) => q.metadata.subject === entry.key).length;
              return (
                <button
                  key={entry.key}
                  type="button"
                  data-testid={`vihaan-practice-${entry.key}`}
                  disabled={count === 0}
                  onClick={() => setActivePracticeSubject(entry.key)}
                  className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 px-4 py-3 text-left transition hover:border-primary hover:bg-mm-tint disabled:opacity-50"
                >
                  <span className="text-sm font-bold text-ink">{entry.label}</span>
                  <span className="rounded border border-mm-line bg-white px-2 py-0.5 text-xs font-semibold text-mm-muted">
                    {count} {count === 1 ? "question" : "questions"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-mm-line bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-ink">Suggested study routine</h2>
        <p className="mb-4 text-sm text-mm-muted">
          {summary.recordedItemsCount > 0
            ? `Updated from ${summary.recordedItemsCount} recorded item attempts (${summary.activitiesCompleted} activities completed).`
            : "A suggested weekly routine calibrated for Year 6 scholarship skills. Complete practice or the diagnostic to personalise your next focus."}
        </p>
        <VihaanStudyPlan plan={plan} nextFocus={recommendNextFocus(summary.weakSubjects)} />
      </section>

      <VihaanSmartRevision outcomes={outcomes} />
    </div>
  );
}
