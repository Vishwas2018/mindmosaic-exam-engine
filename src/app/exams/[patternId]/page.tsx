import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { AppHeader } from "@/components/shell/AppHeader";
import { getExamPattern } from "@/features/exam-engine/exam-patterns";
import { ExamPatternStarter } from "@/features/exam-engine/exam-patterns/components/ExamPatternStarter";
import { PatternAdaptations } from "@/features/exam-engine/exam-patterns/components/PatternAdaptations";
import { describePaperShape } from "@/features/exam-engine/exam-patterns/pattern-session";
import { EXAM_STYLE_NAMES } from "@/features/exam-engine/exam-patterns/pattern-presentation";
import {
  getPatternReadinessFor,
  getViewerIdForSamplePreview,
  isScholarshipHiddenFor,
  isScholarshipSampleAllowedFor,
  SCHOLARSHIP_SAMPLE_NOTICE,
  SCHOLARSHIP_SAMPLE_PATTERN_ID,
} from "@/server/scholarship-sample-preview";

/**
 * One full-length practice paper: what it is, how it differs from the real
 * assessment, and the way in.
 *
 * A pattern with nothing to draw — including every deferred writing task —
 * renders a "coming soon" page rather than 404ing: the picker links here, and
 * a broken route is a worse answer than an honest one (doc §6).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ patternId: string }>;
}): Promise<Metadata> {
  const { patternId } = await params;
  const pattern = getExamPattern(patternId);
  if (!pattern) return { title: "Full-length practice" };
  const styleLabel = EXAM_STYLE_NAMES[pattern.examStyle] ?? "Practice";
  return {
    title: pattern.label,
    description: `${describePaperShape(pattern.questionCount, pattern.timeMinutes)}. Practice written by MindMosaic — ${styleLabel} paper.`,
  };
}

export default async function ExamPatternPage({
  params,
}: {
  params: Promise<{ patternId: string }>;
}) {
  const { patternId } = await params;
  const pattern = getExamPattern(patternId);
  if (!pattern) notFound();

  /* Unchanged unless the gated Scholarship sample preview is active; then non-allowlisted viewers get a 404. */
  const viewerId = await getViewerIdForSamplePreview();
  if (isScholarshipHiddenFor(pattern, viewerId)) notFound();

  const readiness = (await getPatternReadinessFor(viewerId))[pattern.id];
  if (!readiness) notFound();

  const isDeferred = pattern.status === "deferred";
  const startable = readiness.state !== "unavailable";

  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <AppHeader />

      <main id="main-content" className="site-width py-12 sm:py-16">
        <Link
          href="/exams"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          All practice papers
        </Link>

        <div className="mt-5 max-w-2xl">
          <Badge variant="purple" className="mb-4">
            {EXAM_STYLE_NAMES[pattern.examStyle] ?? "Practice"}
          </Badge>
          <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-black leading-[1.02] tracking-[-0.045em] text-ink">
            {pattern.label}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            {describePaperShape(pattern.questionCount, pattern.timeMinutes)}
            {pattern.presentation === "practice_module" &&
              " · Practice module — not a full-length paper"}
          </p>
        </div>

        {pattern.id === SCHOLARSHIP_SAMPLE_PATTERN_ID && isScholarshipSampleAllowedFor(viewerId) && (
          <p
            role="note"
            data-testid="scholarship-sample-notice"
            className="mt-6 max-w-2xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
          >
            {SCHOLARSHIP_SAMPLE_NOTICE}
          </p>
        )}

        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            {startable ? (
              <Suspense
                fallback={
                  <Card className="p-8" variant="default">
                    <p className="text-sm font-semibold text-muted">Loading this paper…</p>
                  </Card>
                }
              >
                <ExamPatternStarter pattern={pattern} readiness={readiness} />
              </Suspense>
            ) : (
              <Card className="p-8" variant="default">
                <h2 className="text-xl font-black text-ink">Coming soon</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {isDeferred
                    ? "Writing tasks are marked by a person against a rubric, which this app cannot do yet, so this paper is not available to sit."
                    : "We do not have enough reviewed questions for this paper yet. Every question is written and checked by hand before a child ever sees it, so this one will appear here once its bank is deep enough."}
                </p>
                <p className="mt-4 text-sm leading-6 text-muted">
                  <Link
                    href={pattern.examStyle === "scholarship_style" ? "/practice/scholarship-prep" : "/practice"}
                    className="font-bold text-royal underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-royal"
                  >
                    {pattern.examStyle === "scholarship_style"
                      ? "See where scholarship-style practice is up to"
                      : "Try a shorter practice set instead"}
                  </Link>
                </p>
              </Card>
            )}
          </div>

          <div className="mm-root">
            <PatternAdaptations pattern={pattern} />
          </div>
        </div>
      </main>
    </div>
  );
}
