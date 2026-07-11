"use client";

import { QuestionRenderer } from "@/features/exam-engine/question-renderers";
import type { CandidateAnswer, CandidateQuestion } from "@/features/exam-engine/types";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";

export interface ExamQuestionProps {
  question: CandidateQuestion;
  answer?: CandidateAnswer;
  onAnswerChange?: (answer: CandidateAnswer) => void;
  disabled?: boolean;
}

export function ExamQuestion({
  question,
  answer,
  onAnswerChange,
  disabled,
}: ExamQuestionProps) {
  const stimulusHeadingId = `${question.id}-stimulus-heading`;

  return (
    <article className="space-y-7" data-question-id={question.id}>
      {question.stimulus ? (
        <section
          aria-labelledby={stimulusHeadingId}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <h2
            id={stimulusHeadingId}
            className="text-lg font-semibold text-slate-900"
          >
            {question.stimulus.title ?? "Reading passage"}
          </h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
            {question.stimulus.body}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {question.stimulus.attribution}
          </p>
        </section>
      ) : null}

      {question.visuals.length > 0 ? (
        <div className="rounded-2xl border border-royal/8 bg-page p-3 sm:p-5">
          {question.visuals.map((visual) => (
            <VisualRenderer key={visual.id} visual={visual} />
          ))}
        </div>
      ) : null}

      <QuestionRenderer
        question={question}
        answer={answer}
        onAnswerChange={onAnswerChange}
        disabled={disabled}
      />
    </article>
  );
}
