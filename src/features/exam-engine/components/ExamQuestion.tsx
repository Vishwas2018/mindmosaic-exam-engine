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

/**
 * Ownership split between this shell and the question-type renderers:
 * the shell renders common stimulus and visual content by default, but a
 * handful of renderers need to own their visual (or stimulus) completely
 * rather than have it duplicated — reading comprehension already links
 * its interactive control to the passage via aria-describedby, and label
 * diagram / hotspot render their single visual as part of the
 * interaction itself (a static copy plus an interactive one would show
 * every diagram twice). This shell skips the piece each of those owns
 * instead of also rendering it generically.
 */
const TYPES_OWNING_STIMULUS = new Set(["reading_comprehension"]);
const TYPES_OWNING_VISUALS = new Set(["label_diagram", "hotspot"]);

export function ExamQuestion({
  question,
  answer,
  onAnswerChange,
  disabled,
}: ExamQuestionProps) {
  const stimulusHeadingId = `${question.id}-stimulus-heading`;
  const rendersOwnStimulus = TYPES_OWNING_STIMULUS.has(question.type);
  const rendersOwnVisuals = TYPES_OWNING_VISUALS.has(question.type);

  return (
    <article className="space-y-7" data-question-id={question.id}>
      {question.stimulus && !rendersOwnStimulus ? (
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

      {question.visuals.length > 0 && !rendersOwnVisuals ? (
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
