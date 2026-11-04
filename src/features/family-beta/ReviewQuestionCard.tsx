"use client";

import { useState } from "react";

import { QuestionRenderer } from "@/features/exam-engine/question-renderers/QuestionRenderer";
import type { CandidateAnswer, PresentationQuestion } from "@/features/exam-engine/types";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers/VisualRenderer";

/**
 * One reviewable item, rendered with the SAME renderers the exam uses, so what
 * the reviewer sees and interacts with is what a child would see.
 *
 * The expected answer arrives as an already-formatted string (`answerSummary`)
 * rather than as an answer-key object, so no key structure reaches the client.
 * It is NOT secret here, though: because the reveal is client state, the
 * summary and explanation are in this component's props and therefore in the
 * page payload, whether or not the reviewer presses the button. That is
 * acceptable only because the whole route is gated to non-production
 * deployments and exists for the reviewer — it must never be reachable by a
 * student. The exam path itself delivers candidate questions with no key.
 */
export interface ReviewQuestionCardProps {
  readonly slot: number;
  readonly question: PresentationQuestion;
  readonly marks: number;
  readonly skill: string;
  readonly answerSummary: string;
  readonly explanation: string;
  readonly findings: readonly { kind: string; detail: string }[];
}

export function ReviewQuestionCard({
  slot,
  question,
  marks,
  skill,
  answerSummary,
  explanation,
  findings,
}: ReviewQuestionCardProps) {
  const [answer, setAnswer] = useState<CandidateAnswer | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);

  return (
    <li className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold text-slate-900">Question {slot}</h3>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
          {question.type}
        </span>
        <span className="text-xs text-slate-600">
          {marks} {marks === 1 ? "mark" : "marks"}
        </span>
        <span className="text-xs text-slate-500">{skill}</span>
      </div>

      {findings.length > 0 ? (
        <ul className="mb-4 space-y-1 rounded-lg border border-amber-400 bg-amber-50 p-3">
          {findings.map((f) => (
            <li key={f.kind} className="text-sm text-amber-900">
              <strong>{f.kind}</strong> — {f.detail}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mb-4 text-slate-900">{question.prompt}</p>

      {(question.visuals ?? []).map((visual) => (
        <div key={visual.id} className="mb-4">
          <VisualRenderer visual={visual} />
          <p className="mt-1 text-xs italic text-slate-500">alt: {visual.altText}</p>
        </div>
      ))}

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <QuestionRenderer question={question} answer={answer} onAnswerChange={setAnswer} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="min-h-11 rounded-lg border border-slate-400 px-4 text-sm font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          aria-expanded={revealed}
        >
          {revealed ? "Hide expected answer" : "Show expected answer"}
        </button>
        <span className="text-xs text-slate-600">
          your input: <code>{answer === undefined ? "(none)" : JSON.stringify(answer)}</code>
        </span>
      </div>

      {revealed ? (
        <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-900">Expected: {answerSummary}</p>
          <p className="mt-1 text-sm text-emerald-900">{explanation}</p>
        </div>
      ) : null}
    </li>
  );
}
