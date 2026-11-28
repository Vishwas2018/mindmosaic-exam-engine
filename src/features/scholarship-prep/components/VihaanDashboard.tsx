"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { StudentContext } from "@/features/student/require-student";
import type { StudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import type { Question } from "@/schemas/question.schema";
import type { WritingHistoryItem } from "@/server/writing/queries";
import { type VihaanConceptLesson } from "../content/concept-lessons";
import {
  buildVihaanParentSummary,
  selectAdaptivePractice,
  selectMockExamQuestions,
  type MockExamSectionKey,
  type RecordedOutcome,
  type VihaanSolutionDetail,
} from "../lib/practice";
import { buildStudyPlan, recommendNextFocus, type StudyPlanDay } from "../lib/study-plan";
import { VihaanDiagnosticExamRunner } from "./DiagnosticExamRunner";
import { VihaanConceptLearning } from "./VihaanConceptLearning";
import { VihaanMockExams } from "./VihaanMockExams";
import { VihaanSmartRevision } from "./VihaanSmartRevision";
import { VihaanStudyPlan } from "./VihaanStudyPlan";
import { VihaanWritingPractice } from "./VihaanWritingPractice";

const PRACTICE_SUBJECTS = [
  { key: "numeracy", label: "Mathematics" },
  { key: "numerical_reasoning", label: "Numerical Reasoning" },
  { key: "verbal_reasoning", label: "Verbal Reasoning" },
  { key: "reading", label: "Reading Comprehension" },
  { key: "writing", label: "Written Expression" },
] as const;

interface ActiveSessionConfig {
  readonly key: string;
  readonly title: string;
  readonly subject: string;
  readonly attemptMode: "practice" | "sectional" | "mock" | "writing";
  readonly durationMinutes?: number;
  readonly questions: readonly Question[];
}

export function VihaanDashboard({
  student,
  questions = [],
  mockQuestions = [],
  solutionsById = {},
  outcomes = [],
  writingHistory = [],
  isSyntheticE2e = false,
}: {
  student: StudentContext;
  shellData?: StudentPortalShellData;
  questions?: readonly Question[];
  mockQuestions?: readonly Question[];
  solutionsById?: Readonly<Record<string, VihaanSolutionDetail>>;
  outcomes?: readonly RecordedOutcome[];
  writingHistory?: readonly WritingHistoryItem[];
  isSyntheticE2e?: boolean;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(null);
  const summary = useMemo(() => buildVihaanParentSummary(outcomes), [outcomes]);
  const plan = useMemo(
    () => buildStudyPlan(summary.weakSubjects, summary.weakTopics),
    [summary.weakSubjects, summary.weakTopics],
  );
  const attemptedQuestionIds = useMemo(
    () => new Set(outcomes.filter((o) => o.status !== "unanswered").map((o) => o.questionId)),
    [outcomes],
  );

  const practiceAvailableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of PRACTICE_SUBJECTS) {
      counts[entry.key] = questions.filter((q) => q.metadata.subject === entry.key).length;
    }
    return counts;
  }, [questions]);

  const writingPrompts = useMemo(
    () => questions.filter((q) => q.metadata.subject === "writing"),
    [questions],
  );

  const hasApprovedQuestions = questions.length > 0;
  const totalBankCount = questions.length + mockQuestions.length;
  const unseenPracticeCount = questions.filter((q) => !attemptedQuestionIds.has(q.id)).length;

  const sessionSeqRef = useRef(0);
  function nextSessionKey(prefix: string) {
    sessionSeqRef.current += 1;
    return `${prefix}-${sessionSeqRef.current}`;
  }

  function startAdaptiveSubjectPractice(subjectKey: string, subjectLabel: string) {
    const picked = selectAdaptivePractice(questions, 10, {
      subject: subjectKey,
      outcomes,
    });
    if (picked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`practice-${subjectKey}`),
      title: subjectLabel,
      subject: subjectKey,
      attemptMode: subjectKey === "writing" ? "writing" : "practice",
      durationMinutes: subjectKey === "writing" ? 15 : undefined,
      questions: picked,
    });
  }

  function handleLaunchStudyPlanDay(day: StudyPlanDay) {
    if (day.canonicalSubject === "writing") {
      const picked = selectAdaptivePractice(questions, 1, { subject: "writing", outcomes });
      if (picked.length === 0) return;
      setActiveSession({
        key: nextSessionKey(`plan-day-${day.day}`),
        title: `Day ${day.day} — Written Expression (60-min Study Block)`,
        subject: "writing",
        attemptMode: "writing",
        durationMinutes: 15,
        questions: picked,
      });
      return;
    }

    const subjectFilter = day.canonicalSubject === "mixed" ? undefined : day.canonicalSubject;
    const picked = selectAdaptivePractice(questions, day.recommendedQuestionCount, {
      subject: subjectFilter,
      weakTopics: day.targetTopics.length > 0 ? day.targetTopics : undefined,
      outcomes,
    });
    const fallbackPicked =
      picked.length > 0
        ? picked
        : selectAdaptivePractice(questions, day.recommendedQuestionCount, {
            subject: subjectFilter,
            outcomes,
          });
    if (fallbackPicked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`plan-day-${day.day}`),
      title: `Day ${day.day}: ${day.focus.replace(/_/g, " ")} (Daily Plan)`,
      subject: day.canonicalSubject,
      attemptMode: "practice",
      durationMinutes: 20,
      questions: fallbackPicked,
    });
  }

  function handlePractiseConcept(lesson: VihaanConceptLesson) {
    let picked = selectAdaptivePractice(questions, lesson.subject === "writing" ? 1 : 6, {
      subject: lesson.subject,
      skill: lesson.skillId,
      outcomes,
    });
    if (picked.length === 0) {
      picked = selectAdaptivePractice(questions, lesson.subject === "writing" ? 1 : 6, {
        subject: lesson.subject,
        outcomes,
      });
    }
    if (picked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`concept-${lesson.id}`),
      title: `Concept Practice: ${lesson.title}`,
      subject: lesson.subject,
      attemptMode: lesson.subject === "writing" ? "writing" : "practice",
      durationMinutes: lesson.subject === "writing" ? 15 : undefined,
      questions: picked,
    });
  }

  function handleReviseTopic(topicInfo: { readonly subject: string; readonly topic: string }) {
    let picked = selectAdaptivePractice(questions, 10, {
      subject: topicInfo.subject,
      weakTopics: [topicInfo.topic],
      outcomes,
    });
    if (picked.length === 0) {
      picked = selectAdaptivePractice(questions, 10, {
        subject: topicInfo.subject,
        outcomes,
      });
    }
    if (picked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`revision-${topicInfo.topic}`),
      title: `Weak-Topic Revision: ${topicInfo.topic}`,
      subject: topicInfo.subject,
      attemptMode: "practice",
      questions: picked,
    });
  }

  function handleStartSectional(subjectKey: string, count: number, minutes: number) {
    const picked = selectAdaptivePractice(questions, count, {
      subject: subjectKey,
      outcomes,
    });
    if (picked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`sectional-${subjectKey}`),
      title: `Timed Sectional Test — ${subjectKey.replace(/_/g, " ")}`,
      subject: subjectKey,
      attemptMode: "sectional",
      durationMinutes: minutes,
      questions: picked,
    });
  }

  function handleStartMockSection(section: MockExamSectionKey, minutes: number, label: string) {
    const picked = selectMockExamQuestions(mockQuestions, section, outcomes);
    if (picked.length === 0) return;
    setActiveSession({
      key: nextSessionKey(`mock-${section}`),
      title: label,
      subject: section === "full_mock" ? "mixed" : section,
      attemptMode: "mock",
      durationMinutes: minutes,
      questions: picked,
    });
  }

  function handleStartWritingPrompt(prompt: Question, minutes: number) {
    setActiveSession({
      key: nextSessionKey(`writing-${prompt.id}`),
      title: "Timed Writing Practice",
      subject: "writing",
      attemptMode: "writing",
      durationMinutes: minutes,
      questions: [prompt],
    });
  }

  if (activeSession && activeSession.questions.length > 0) {
    return (
      <div className="space-y-6" data-testid="vihaan-practice-runner">
        <VihaanDiagnosticExamRunner
          key={activeSession.key}
          questions={activeSession.questions}
          subject={activeSession.subject}
          sessionTitle={activeSession.title}
          attemptMode={activeSession.attemptMode}
          durationMinutes={activeSession.durationMinutes}
          isSyntheticE2e={isSyntheticE2e}
          solutionsById={solutionsById}
          persistToServer
          onExit={() => setActiveSession(null)}
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
              ? `${totalBankCount} verified Year 6 scholarship questions published in DEV (${questions.length} daily practice items${mockQuestions.length > 0 ? `, ${mockQuestions.length} unseen mock exam items` : "; unseen mock papers are not available yet"}).`
              : "Your scholarship preparation workspace is awaiting content approval."}
          </p>
        </div>
        {hasApprovedQuestions && (
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Published for DEV ({totalBankCount} items · {unseenPracticeCount} unseen practice)
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
                ? "Sit the 20-question baseline scholarship diagnostic covering Mathematics, Reasoning, Reading, and Writing with worked solutions and progress saving."
                : "Lessons, randomised practice, revision, writing tasks and mock papers will become available after validation and human approval. Draft questions are unavailable to students."}
            </p>
          </div>
          <Link
            href={isSyntheticE2e ? "/student/vihaan/diagnostic?e2e=1" : "/student/vihaan/diagnostic"}
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
            <h2 className="text-xl font-bold text-ink">Adaptive subject practice</h2>
            <p className="mt-1 text-sm text-mm-muted">
              Select a domain to practise unseen items first, adapting difficulty cleanly without
              touching the {mockQuestions.length} questions reserved for mock examinations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_SUBJECTS.map((entry) => {
              const count = practiceAvailableCounts[entry.key] ?? 0;
              return (
                <button
                  key={entry.key}
                  type="button"
                  data-testid={`vihaan-practice-${entry.key}`}
                  disabled={count === 0}
                  onClick={() => startAdaptiveSubjectPractice(entry.key, entry.label)}
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
        <h2 className="mb-2 text-xl font-bold text-ink">Personalised 60-minute daily study plan</h2>
        <p className="mb-4 text-sm text-mm-muted">
          {summary.recordedItemsCount > 0
            ? `Personalised from ${summary.recordedItemsCount} genuine recorded item attempts (${summary.activitiesCompleted} activities completed, ${summary.overallAccuracyPercent ?? 0}% objective accuracy).`
            : "A structured 6-day routine (60 minutes daily) combining concept learning, adaptive practice, and timed revision."}
        </p>
        <VihaanStudyPlan
          plan={plan}
          nextFocus={recommendNextFocus(summary.weakSubjects)}
          onLaunchDay={hasApprovedQuestions ? handleLaunchStudyPlanDay : undefined}
        />
      </section>

      <VihaanConceptLearning
        onPractiseLesson={hasApprovedQuestions ? handlePractiseConcept : undefined}
      />

      <VihaanSmartRevision
        outcomes={outcomes}
        onReviseTopic={hasApprovedQuestions ? handleReviseTopic : undefined}
      />

      <VihaanMockExams
        reservedCount={mockQuestions.length}
        practiceAvailableCounts={practiceAvailableCounts}
        onStartSectional={hasApprovedQuestions ? handleStartSectional : undefined}
        onStartMockSection={mockQuestions.length > 0 ? handleStartMockSection : undefined}
      />

      <VihaanWritingPractice
        writingPrompts={writingPrompts}
        writingHistory={writingHistory}
        onStartWritingPrompt={writingPrompts.length > 0 ? handleStartWritingPrompt : undefined}
      />
    </div>
  );
}
