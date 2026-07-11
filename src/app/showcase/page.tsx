"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Code2, MousePointerClick, Shapes } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge, Card, buttonClasses } from "@/components/ui";
import {
  showcaseQuestions,
  showcaseVisuals,
} from "@/content/questions/showcase-fixtures";
import type { CandidateAnswer } from "@/features/exam-engine";
import { ExamQuestion } from "@/features/exam-engine/components";
import { toCandidateQuestion } from "@/features/exam-engine/types";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import type { QuestionType } from "@/schemas/question.schema";
import { QUESTION_TYPES } from "@/schemas/question.schema";
import { VISUAL_TYPES } from "@/schemas/visual.schema";

function formatType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const notes: Record<QuestionType, { interaction: string; accessibility: string }> = {
  multiple_choice: {
    interaction: "Single-choice radio buttons.",
    accessibility: "Radio group inside a labelled fieldset.",
  },
  multiple_select: {
    interaction: "Checkboxes with exact-set scoring.",
    accessibility: "Checkbox group; instruction stated in text.",
  },
  number_entry: {
    interaction: "Numeric input with optional tolerance.",
    accessibility: "Labelled number field with decimal input mode.",
  },
  fill_blank: {
    interaction: "Inline text inputs per blank.",
    accessibility: "Every blank has a programmatic label.",
  },
  dropdown: {
    interaction: "Native select per field.",
    accessibility: "Each select has a visible label.",
  },
  true_false: {
    interaction: "True / false radio buttons.",
    accessibility: "Radio group inside a labelled fieldset.",
  },
  matching: {
    interaction: "Select a match for each item.",
    accessibility: "No pointer dragging required.",
  },
  ordering: {
    interaction: "Move up / move down buttons.",
    accessibility: "Fully keyboard-operable reordering.",
  },
  short_answer: {
    interaction: "Short text input.",
    accessibility: "Accepted-answer matching with normalisation.",
  },
  reading_comprehension: {
    interaction: "Passage with a linked question.",
    accessibility: "Question is associated with the passage.",
  },
  essay: {
    interaction: "Text area with live word count.",
    accessibility: "Manual review only; never auto-marked.",
  },
  label_diagram: {
    interaction: "Diagram with a select per label.",
    accessibility: "Choose a target position without dragging.",
  },
  hotspot: {
    interaction: "Selectable regions on an SVG.",
    accessibility: "Regions are keyboard-focusable checkboxes.",
  },
  drag_drop: {
    interaction: "Drag items or use the placement menu.",
    accessibility: "Keyboard placement menu is always available.",
  },
};

export default function ShowcasePage() {
  const [responses, setResponses] = useState<Record<string, CandidateAnswer>>({});

  const firstOfType = new Map<QuestionType, (typeof showcaseQuestions)[number]>();
  for (const question of showcaseQuestions) {
    if (!firstOfType.has(question.type)) firstOfType.set(question.type, question);
  }

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
          <Link href="/" className={buttonClasses({ variant: "secondary", size: "sm" })}>
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
              Renderer showcase
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.05em] text-ink sm:text-6xl">
              Every question and visual, interactive.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              All 14 question renderers and 10 visual renderers, each driven by the same
              registry-based engine as the exam.
            </p>
            <div className="mt-6 flex gap-3">
              <div className="rounded-2xl border border-success/15 bg-success/5 px-5 py-4">
                <strong className="block text-2xl font-black text-success">14</strong>
                <span className="text-xs font-bold text-muted">Question types</span>
              </div>
              <div className="rounded-2xl border border-success/15 bg-success/5 px-5 py-4">
                <strong className="block text-2xl font-black text-success">10</strong>
                <span className="text-xs font-bold text-muted">Visual types</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className="site-width py-14 sm:py-18"
          aria-labelledby="question-renderers-title"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal text-white">
              <MousePointerClick aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h2
                id="question-renderers-title"
                className="text-2xl font-black text-ink sm:text-3xl"
              >
                Question renderers
              </h2>
              <p className="mt-1 text-sm text-muted">
                Interactive examples for all {QUESTION_TYPES.length} question types.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {QUESTION_TYPES.map((type) => {
              const question = firstOfType.get(type);
              const note = notes[type];
              return (
                <Card
                  key={type}
                  className="p-6 sm:p-7"
                  variant="default"
                  data-question-type={type}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-ink">{formatType(type)}</h3>
                    <Badge variant="success">Ready</Badge>
                  </div>
                  <dl className="mb-5 grid gap-1.5 text-sm">
                    <div className="flex gap-2">
                      <dt className="font-bold text-muted">Interaction:</dt>
                      <dd className="text-slate-600">{note.interaction}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-bold text-muted">Accessibility:</dt>
                      <dd className="text-slate-600">{note.accessibility}</dd>
                    </div>
                  </dl>
                  {question ? (
                    <ExamQuestion
                      question={toCandidateQuestion(question)}
                      answer={responses[question.id]}
                      onAnswerChange={(answer) =>
                        setResponses((previous) => ({
                          ...previous,
                          [question.id]: answer,
                        }))
                      }
                    />
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>

        <section
          className="border-t border-royal/8 bg-white py-14 sm:py-18"
          aria-labelledby="visual-renderers-title"
        >
          <div className="site-width">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-royal-orange text-white">
                <BarChart3 aria-hidden="true" className="h-6 w-6" />
              </span>
              <div>
                <h2
                  id="visual-renderers-title"
                  className="text-2xl font-black text-ink sm:text-3xl"
                >
                  Visual renderers
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Deterministic output for all {VISUAL_TYPES.length} visual types.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {VISUAL_TYPES.map((type) => {
                const visual = showcaseVisuals.find((item) => item.type === type);
                return (
                  <Card
                    key={type}
                    className="p-6"
                    variant="default"
                    data-visual-type={type}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-base font-black text-ink">
                        <Shapes aria-hidden="true" className="h-4 w-4 text-royal" />
                        {formatType(type)}
                      </h3>
                      <Badge variant="success">Ready</Badge>
                    </div>
                    <div className="rounded-2xl border border-royal/8 bg-page p-3 sm:p-5">
                      {visual ? <VisualRenderer visual={visual} className="mx-auto" /> : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
