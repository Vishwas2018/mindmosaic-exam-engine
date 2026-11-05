"use client";

import { ArrowLeft, ArrowRight, Clock3, Flag, ListChecks } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui";
import type { ExamSelectionConfig, TimingMode } from "@/features/exam-engine/selection";

import { describeConfig } from "./describe-config";

export interface ExamInstructionsProps {
  config: ExamSelectionConfig;
  /**
   * Headline for this sitting, overriding the config description. A
   * full-length practice paper is named by its pattern ("NAPLAN-style Year 5
   * Numeracy — full-length practice"), which is what the child chose;
   * describing it by its filters instead would read as a different, smaller
   * thing. Omitted by the configurator, which has only filters to describe.
   */
  title?: string;
  /** Questions this sitting will actually serve — "full" already resolved. */
  questionCount: number;
  timing: TimingMode;
  durationMinutes: number;
  /** Mixed-subject sittings include writing tasks a person marks later. */
  includesManualMarking: boolean;
  onBack: () => void;
  onStart: () => void;
  isBusy: boolean;
  error?: string | null;
  /**
   * The session exists but the push to /exam was dropped. Surfaced here as
   * well as on the setup sheet because the navigation is now kicked off from
   * this page — without it a student whose push failed would be left on the
   * instructions with no way forward.
   */
  navigationFailed?: boolean;
  onRetryNavigation?: () => void;
}

/**
 * The standard instructions every sitting passes through, between choosing
 * the paper and the first question.
 *
 * It renders *before* the session is created, not after: a signed-in
 * session's clock starts server-side the moment /api/exam/session accepts it,
 * so showing this after creation would quietly spend a student's exam time on
 * reading the rules. Nothing here creates state — `onStart` is what runs the
 * existing start path.
 *
 * Every line below states what this app actually does. The numbering is real
 * sequence (this is the order a sitting happens in), not decoration.
 */
export function ExamInstructions({
  config,
  title,
  questionCount,
  timing,
  durationMinutes,
  includesManualMarking,
  onBack,
  onStart,
  isBusy,
  error,
  navigationFailed = false,
  onRetryNavigation,
}: ExamInstructionsProps) {
  /* A named full-length paper is an exam; a quick practice sitting is practice. */
  const isFullPaper = title !== undefined;
  const steps = [
    {
      title: "Do them in any order",
      body: "Use Next and Previous, or tap a number to jump to a question. Your answers are kept as you go.",
    },
    {
      title: "Flag the tricky ones",
      body: "Tap Flag for review to find a question again later. Flagging never changes your answer.",
    },
    timing === "timed"
      ? {
          title: `You have ${durationMinutes} minutes`,
          body: "The clock starts when you press start. If it runs out, the answers you have given are sent in for you. Nothing is lost.",
        }
      : {
          title: "No time limit",
          body: "Take as long as you need. We still note how long it takes, so you can see it in your results.",
        },
    {
      title: "Check, then submit",
      body: includesManualMarking
        ? "Before you finish, you will see what is answered, not answered and flagged. Written answers are marked by a person, so those results arrive later."
        : "Before you finish, you will see what is answered, not answered and flagged. After you submit, your answers are locked and you see your results.",
    },
    {
      title: "If you leave early",
      body: "You will be asked to confirm first. Answers from that attempt can’t be brought back.",
    },
  ];

  /*
   * The timed-sitting rules are said here, in plain words, rather than sprung on a
   * child mid-sitting: the first time copy stops working should not be a surprise
   * during a running clock. Timed only, matching ExamIntegrityMonitor. What the app
   * does is stated exactly (copy and paste off, leaving the tab is noted, a refresh
   * asks first); only the tone is gentler.
   */
  if (timing === "timed") {
    steps.push({
      title: "Quiet rules while the clock runs",
      body: "Copy, paste and right-click are off, and we note if you switch to another tab or app. If you refresh or close the page, we ask you first.",
    });
  }

  return (
    <Card className="overflow-hidden p-0" variant="default">
      {/* Same masthead treatment as the setup cover sheet, so this reads as
          the next page of one exam booklet rather than a separate screen. */}
      <div className="relative border-b border-dashed border-royal/20 bg-[linear-gradient(145deg,#FFFFFF_0%,#F7F4FF_100%)] px-5 py-6 sm:px-8 sm:py-8">
        <Badge variant="orange">
          <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
          Before you begin
        </Badge>
        <h2
          data-testid="instructions-summary"
          className="mt-3 font-[family-name:var(--font-instrument-sans)] text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink text-balance sm:text-3xl"
        >
          {title ?? describeConfig(config)}
        </h2>
        <p className="mt-3 text-sm font-semibold text-muted">
          Have a quick read, then start when you are ready.
        </p>
      </div>

      <dl className="grid gap-px border-b border-royal/10 bg-royal/10 sm:grid-cols-3">
        <div className="bg-white px-6 py-5 sm:px-8">
          <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-royal">
            Questions
          </dt>
          <dd className="mt-1.5 text-lg font-black text-ink" data-testid="instructions-questions">
            {questionCount}
          </dd>
        </div>
        <div className="bg-white px-6 py-5 sm:px-8">
          <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-royal">Timing</dt>
          <dd className="mt-1.5 inline-flex items-center gap-1.5 text-lg font-black text-ink">
            <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
            {timing === "timed" ? `${durationMinutes} minutes` : "Untimed"}
          </dd>
        </div>
        <div className="bg-white px-6 py-5 sm:px-8">
          <dt className="text-xs font-extrabold uppercase tracking-[0.14em] text-royal">Marking</dt>
          <dd className="mt-1.5 text-lg font-black text-ink">
            {includesManualMarking ? "Instant + by a person" : "Instant"}
          </dd>
        </div>
      </dl>

      <ol className="divide-y divide-royal/10">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 px-5 py-4 sm:px-8 sm:py-5">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-royal/8 text-sm font-black text-royal"
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-black text-ink">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-6 border-t-2 border-dashed border-royal/20 sm:mx-8" aria-hidden="true" />

      <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Button
          variant="secondary"
          data-testid="back-to-setup"
          onClick={onBack}
          disabled={isBusy}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to setup
        </Button>
        <p className="order-last inline-flex items-center gap-1.5 text-sm font-bold text-muted sm:order-none">
          <Flag aria-hidden="true" className="h-4 w-4 text-royal" />
          You can flag questions and come back to them
        </p>
        <Button
          variant="primary"
          size="lg"
          data-testid="begin-exam"
          onClick={onStart}
          disabled={isBusy}
        >
          {isBusy ? "Opening…" : isFullPaper ? "Start exam" : "Start practice"}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>

      {error && (
        <p
          data-testid="instructions-error"
          role="status"
          className="mx-6 mb-6 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning sm:mx-8"
        >
          {error}
        </p>
      )}

      {navigationFailed && (
        <p
          data-testid="navigation-failed"
          role="alert"
          className="mx-6 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error sm:mx-8"
        >
          Your exam is ready, but we could not open it automatically.
          <Button variant="secondary" size="sm" onClick={onRetryNavigation}>
            Try again
          </Button>
        </p>
      )}
    </Card>
  );
}
