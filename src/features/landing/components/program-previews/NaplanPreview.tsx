import { ArrowLeft, ArrowRight, Check, Flag, Grid2X2, PencilLine, Clock3 } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, Button, Card, ProgressBar } from "@/components/ui";
import { MultipleChoiceRenderer } from "@/features/exam-engine/question-renderers/MultipleChoiceRenderer";
import type { CandidateQuestion } from "@/features/exam-engine/types";

import { learningDemo } from "../../content";
import { useCompact } from "./compact";
import { ExampleCue } from "./chrome";

const demo = learningDemo.prepareDemo;

/** The sample question from the landing contract, in the shape the real exam renderer takes. */
const QUESTION = {
  id: "landing-preview-naplan-q6",
  type: "multiple_choice",
  answerKind: "single_option",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  prompt: demo.question,
  options: demo.options.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
  visuals: [],
  metadata: { subject: "numeracy", strand: "Number", topic: "Division", difficulty: "easy", estimatedTimeSeconds: 60 },
} as unknown as CandidateQuestion;

const SELECTED = String.fromCharCode(97 + demo.selectedIndex);

/** NAPLAN-style practice as it runs in /exam: header with timer, navigator, the real multiple-choice renderer. */
export function NaplanPreview() {
  const compact = useCompact();
  const flagged = new Set<number>(demo.flaggedQuestions);
  const answered = demo.currentQuestion - 1;
  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="shrink-0 border-b border-primary/10 bg-white">
        <div aria-hidden="true" className="h-[3px] w-full bg-primary/10">
          <div
            className="h-full bg-[linear-gradient(90deg,var(--brand-bright),var(--purple))]"
            style={{ width: `${Math.round(((demo.currentQuestion - 1) / demo.questionCount) * 100)}%` }}
          />
        </div>
        <div className="flex min-h-[60px] items-center justify-between gap-3 px-6 py-2">
          <MindMosaicLogo size="md" trademark="none" />
          <div className="flex items-center gap-4">
            <ExampleCue />
            <div className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-page px-3.5 text-sm font-extrabold tabular-nums text-ink">
              <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
              {compact ? "34:12" : "34:12 remaining"}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
        {!compact && (
        <section className="flex shrink-0 items-end justify-between gap-6">
          <div>
            <Badge variant="purple">Full-length practice paper</Badge>
            <p className="m-0 mt-2.5 font-jakarta text-[26px] font-black leading-tight tracking-[-0.035em] text-plum-dark">
              NAPLAN-style Numeracy, Year 3
            </p>
          </div>
          <div className="w-[230px] shrink-0">
            <ProgressBar value={answered} max={demo.questionCount} label="Questions answered" showValue />
          </div>
        </section>
        )}

        <div className={`grid min-h-0 flex-1 items-stretch gap-4 ${compact ? "grid-cols-1" : "grid-cols-[200px_minmax(0,1fr)]"}`}>
          {!compact && (
          <Card className="min-h-0 overflow-hidden p-4" variant="default">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 flex items-center gap-2 font-jakarta text-[13px] font-extrabold text-plum-dark">
                <Grid2X2 aria-hidden="true" className="h-4 w-4 text-primary" />
                Questions
              </p>
              <span className="text-xs font-bold text-plum-muted">
                {answered}/{demo.questionCount}
              </span>
            </div>
            <ol className="m-0 mt-4 grid list-none grid-cols-4 gap-1.5 p-0">
              {Array.from({ length: demo.questionCount }, (_, index) => {
                const n = index + 1;
                const current = n === demo.currentQuestion;
                const isFlagged = flagged.has(n);
                const done = n < demo.currentQuestion && !isFlagged;
                return (
                  <li
                    key={n}
                    className={`relative flex h-9 items-center justify-center rounded-[9px] border text-[13px] font-bold ${
                      current
                        ? "border-primary bg-primary text-white"
                        : isFlagged
                          ? "border-coral-border bg-coral-light text-coral-accent"
                          : done
                            ? "border-primary/25 bg-primary-tint text-primary"
                            : "border-parchment-border bg-white text-plum-muted"
                    }`}
                  >
                    {n}
                    {isFlagged && <Flag aria-hidden="true" className="absolute right-0.5 top-0.5 h-2.5 w-2.5" fill="currentColor" />}
                    {done && <Check aria-hidden="true" className="absolute right-0.5 top-0.5 h-2.5 w-2.5 text-primary" />}
                  </li>
                );
              })}
            </ol>
            <ul className="m-0 mt-4 grid list-none gap-1.5 border-t border-primary/8 p-0 pt-3 text-[11.5px] text-plum-muted">
              {[
                ["Answered", "bg-primary-tint border-primary/25"],
                ["Flagged for review", "bg-coral-light border-coral-border"],
                ["Current question", "bg-primary border-primary"],
              ].map(([label, swatch]) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`h-3 w-3 shrink-0 rounded border ${swatch}`} />
                  {label}
                </li>
              ))}
            </ul>
          </Card>
          )}

          <Card className="flex min-h-0 flex-col overflow-hidden" variant="default">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary/8 bg-[linear-gradient(110deg,#FFFFFF_0%,#F7F4FF_100%)] px-6 py-4">
              <div>
                <p className="m-0 text-[13px] font-extrabold uppercase tracking-[0.1em] text-primary">
                  Question {demo.currentQuestion} of {demo.questionCount}
                </p>
                <p className="m-0 mt-1 text-[13px] font-semibold text-plum-muted">Grade 3 · Numeracy · Division · Easy</p>
              </div>
              <div className="flex items-center gap-2">
                {!compact && (
                  <Button variant="secondary" size="sm" tabIndex={-1}>
                    <PencilLine aria-hidden="true" className="h-4 w-4" />
                    Rough work
                  </Button>
                )}
                <Button variant="secondary" size="sm" tabIndex={-1}>
                  <Flag aria-hidden="true" className="h-4 w-4" />
                  Flag for review
                </Button>
              </div>
            </div>
            <div
              className={`min-h-0 flex-1 overflow-hidden px-6 ${
                compact ? "py-3 [&_fieldset]:space-y-2.5 [&_[role=radiogroup]]:gap-2 [&_label]:min-h-11 [&_label]:py-2.5" : "py-5"
              }`}
            >
              <MultipleChoiceRenderer question={QUESTION as never} answer={SELECTED} />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-primary/8 bg-canvas/65 px-6 py-3.5">
              <Button variant="secondary" size="sm" tabIndex={-1}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="primary" size="sm" tabIndex={-1}>
                Next question
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
