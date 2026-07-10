"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Code2,
  MousePointerClick,
  Shapes,
  Sparkles,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, Card, ErrorState, buttonClasses } from "@/components/ui";
import { questionBank } from "@/content/questions/question-bank";
import type { CandidateAnswer } from "@/features/exam-engine";
import { QuestionRenderer } from "@/features/exam-engine/question-renderers";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import { QUESTION_TYPES } from "@/schemas/question.schema";
import { VISUAL_TYPES } from "@/schemas/visual.schema";

function formatType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const workingQuestionTypes = new Set(["multiple_choice", "number_entry"]);
const workingVisualTypes = new Set(["bar_chart"]);

export default function ShowcasePage() {
  const [multipleChoiceAnswer, setMultipleChoiceAnswer] =
    useState<CandidateAnswer>(null);
  const [numberAnswer, setNumberAnswer] = useState<CandidateAnswer>(null);

  const multipleChoiceQuestion = questionBank.find(
    (question) => question.type === "multiple_choice",
  );
  const numberEntryQuestion = questionBank.find(
    (question) => question.type === "number_entry",
  );
  const barChart = questionBank
    .flatMap((question) => question.visuals)
    .find((visual) => visual.type === "bar_chart");

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white/90 backdrop-blur-xl">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <Link
            href="/"
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </header>

      <main id="main-content">
        <section className="surface-grid border-b border-royal/8 py-14 sm:py-18">
          <div className="site-width">
            <Badge variant="orange">
              <Code2 aria-hidden="true" className="h-3.5 w-3.5" />
              Renderer foundation
            </Badge>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] text-ink sm:text-6xl">
                  One engine, many ways to think.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                  Explore the first working interactions and the complete renderer map
                  prepared for MindMosaic’s next phase.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-royal/10 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(49,32,86,0.06)]">
                  <strong className="block text-2xl font-black text-royal">14</strong>
                  <span className="text-xs font-bold text-muted">Question types</span>
                </div>
                <div className="rounded-2xl border border-royal/10 bg-white px-5 py-4 shadow-[0_10px_26px_rgba(49,32,86,0.06)]">
                  <strong className="block text-2xl font-black text-warning">10</strong>
                  <span className="text-xs font-bold text-muted">Visual types</span>
                </div>
                <div className="col-span-2 rounded-2xl border border-success/15 bg-success/5 px-5 py-4 sm:col-span-1">
                  <strong className="block text-2xl font-black text-success">3</strong>
                  <span className="text-xs font-bold text-muted">Working now</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-width py-14 sm:py-18" aria-labelledby="working-examples-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="success">
                <MousePointerClick aria-hidden="true" className="h-3.5 w-3.5" />
                Try them
              </Badge>
              <h2
                id="working-examples-title"
                className="mt-4 text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl"
              >
                Working examples
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted">
              These examples use the same registry-driven renderers as the sample exam.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Card className="p-6 sm:p-8" variant="default">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal/8 text-royal">
                    <MousePointerClick aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-ink">Multiple choice</h3>
                    <p className="text-xs font-semibold text-muted">Interactive renderer</p>
                  </div>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              {multipleChoiceQuestion ? (
                <>
                  {multipleChoiceQuestion.visuals.map((visual) => (
                    <VisualRenderer
                      key={visual.id}
                      visual={visual}
                      className="mb-6 rounded-2xl bg-page p-3"
                    />
                  ))}
                  <QuestionRenderer
                    question={multipleChoiceQuestion}
                    answer={multipleChoiceAnswer}
                    onAnswerChange={setMultipleChoiceAnswer}
                  />
                </>
              ) : (
                <ErrorState description="The multiple-choice example is unavailable." />
              )}
            </Card>

            <Card className="p-6 sm:p-8" variant="default">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-royal-orange/10 text-warning">
                    <Sparkles aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-ink">Number entry</h3>
                    <p className="text-xs font-semibold text-muted">Interactive renderer</p>
                  </div>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              {numberEntryQuestion ? (
                <QuestionRenderer
                  question={numberEntryQuestion}
                  answer={numberAnswer}
                  onAnswerChange={setNumberAnswer}
                />
              ) : (
                <ErrorState description="The number-entry example is unavailable." />
              )}
            </Card>

            <Card className="p-6 sm:p-8 lg:col-span-2" variant="default">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                    <BarChart3 aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-ink">Bar chart</h3>
                    <p className="text-xs font-semibold text-muted">Deterministic SVG renderer</p>
                  </div>
                </div>
                <Badge variant="success">Ready</Badge>
              </div>
              <div className="rounded-2xl border border-royal/8 bg-page p-3 sm:p-6">
                {barChart ? (
                  <VisualRenderer visual={barChart} className="mx-auto" />
                ) : (
                  <ErrorState description="The bar-chart example is unavailable." />
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y border-royal/8 bg-white py-14 sm:py-18" aria-labelledby="question-types-title">
          <div className="site-width">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal text-white">
                <Shapes aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2 id="question-types-title" className="text-2xl font-black text-ink sm:text-3xl">
                  All question types
                </h2>
                <p className="mt-1 text-sm text-muted">14 registry entries, ready to extend independently.</p>
              </div>
            </div>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {QUESTION_TYPES.map((type, index) => {
                const isWorking = workingQuestionTypes.has(type);
                return (
                  <li
                    key={type}
                    className="flex min-h-20 items-center gap-3 rounded-2xl border border-royal/10 bg-page/65 p-4"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        isWorking
                          ? "bg-success/10 text-success"
                          : "bg-royal/8 text-royal"
                      }`}
                    >
                      {isWorking ? (
                        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-extrabold text-ink">
                      {formatType(type)}
                    </span>
                    {isWorking && <span className="sr-only">Working renderer</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="site-width py-14 sm:py-18" aria-labelledby="visual-types-title">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal-orange text-white">
              <BarChart3 aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2 id="visual-types-title" className="text-2xl font-black text-ink sm:text-3xl">
                All visual types
              </h2>
              <p className="mt-1 text-sm text-muted">10 structured formats with safe, deterministic output.</p>
            </div>
          </div>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {VISUAL_TYPES.map((type, index) => {
              const isWorking = workingVisualTypes.has(type);
              return (
                <li
                  key={type}
                  className="rounded-2xl border border-royal/10 bg-white p-4 shadow-[0_8px_24px_rgba(49,32,86,0.05)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black tabular-nums text-royal/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {isWorking && <Badge variant="success">Ready</Badge>}
                  </div>
                  <h3 className="mt-5 text-sm font-extrabold text-ink">{formatType(type)}</h3>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
