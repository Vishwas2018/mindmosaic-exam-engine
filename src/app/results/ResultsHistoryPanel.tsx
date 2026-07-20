"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, History, LogIn, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Badge, Card, buttonClasses } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import type { SubjectFilter } from "@/features/exam-engine/selection";

import { fetchResultsHistory, type ResultsHistoryOutcome } from "./history-fetch";

export interface ResultsHistoryPanelProps {
  subject: SubjectFilter;
  /** exam_sessions.id for the just-submitted attempt, so it isn't counted as its own history. */
  sessionId: string | null;
  /** Current attempt's objective percentage; null when nothing was auto-marked. */
  currentScorePercent: number | null;
}

/**
 * Cross-attempt progress panel for /results: personal best and a
 * previous-attempt comparison, scoped to the subject just practised.
 * Fetches via the history-fetch server action on mount so guests (who have
 * no persisted attempts) and signed-in students share one component with
 * three fail-soft states: loading, guest, and ready.
 */
export function ResultsHistoryPanel({
  subject,
  sessionId,
  currentScorePercent,
}: ResultsHistoryPanelProps) {
  const [outcome, setOutcome] = useState<ResultsHistoryOutcome | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    fetchResultsHistory({ subject, excludeSessionId: sessionId })
      .then((result) => {
        if (!cancelled) setOutcome(result);
      })
      .catch(() => {
        if (!cancelled) {
          setOutcome({
            kind: "ready",
            stats: { subjectAttemptCount: 0, personalBestPercent: null, previousAttempt: null },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [subject, sessionId]);

  const subjectLabel = SUBJECT_LABELS[subject];

  if (outcome === "loading") {
    return (
      <Card className="mt-6 p-6 sm:p-8" variant="default" data-testid="results-history-panel">
        <p className="text-sm font-semibold text-muted" data-testid="history-loading">
          Loading your progress…
        </p>
      </Card>
    );
  }

  if (outcome.kind === "guest") {
    return (
      <Card className="mt-6 p-6 sm:p-8" variant="default" data-testid="results-history-panel">
        <div
          data-testid="history-guest-state"
          className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Badge variant="purple">
              <History aria-hidden="true" className="h-3.5 w-3.5" />
              Progress history
            </Badge>
            <h2 className="mt-3 text-xl font-black text-ink">
              Sign in to track your progress
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Create a free account to see your personal best, compare this
              attempt against your past ones, and build a practice streak.
            </p>
          </div>
          <Link href="/sign-in" className={buttonClasses({ variant: "primary", size: "md" })}>
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Sign in
          </Link>
        </div>
      </Card>
    );
  }

  const { stats } = outcome;

  if (stats.subjectAttemptCount === 0) {
    return (
      <Card className="mt-6 p-6 sm:p-8" variant="default" data-testid="results-history-panel">
        <Badge variant="purple">
          <History aria-hidden="true" className="h-3.5 w-3.5" />
          Progress history
        </Badge>
        <p className="mt-3 text-sm font-semibold text-ink" data-testid="history-first-attempt">
          This was your first {subjectLabel} attempt — nice work getting
          started. Practise again to start tracking your progress over time.
        </p>
      </Card>
    );
  }

  const best = stats.personalBestPercent;
  const previous = stats.previousAttempt;
  const isNewBest =
    currentScorePercent !== null && (best === null || currentScorePercent > best);
  const delta =
    currentScorePercent !== null && previous?.scorePercent != null
      ? currentScorePercent - previous.scorePercent
      : null;

  return (
    <Card className="mt-6 p-6 sm:p-8" variant="default" data-testid="results-history-panel">
      <Badge variant="purple">
        <History aria-hidden="true" className="h-3.5 w-3.5" />
        Progress history
      </Badge>
      <h2 className="mt-3 text-xl font-black text-ink">{subjectLabel} progress</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2" data-testid="history-comparison">
        <div className="rounded-2xl border border-royal/8 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
            <Award aria-hidden="true" className="h-4 w-4 text-royal-orange" />
            Personal best
          </div>
          <p className="mt-2 text-2xl font-black text-ink" data-testid="history-personal-best">
            {best !== null ? `${best}%` : "—"}
          </p>
          {isNewBest && (
            <Badge variant="success" className="mt-2" data-testid="history-new-best-badge">
              New personal best!
            </Badge>
          )}
        </div>

        <div className="rounded-2xl border border-royal/8 p-4">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-muted">
            {delta === null ? (
              <Minus aria-hidden="true" className="h-4 w-4" />
            ) : delta >= 0 ? (
              <TrendingUp aria-hidden="true" className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown aria-hidden="true" className="h-4 w-4 text-error" />
            )}
            Compared to last attempt
          </div>
          <p className="mt-2 text-2xl font-black text-ink" data-testid="history-delta">
            {delta === null ? "No prior score to compare" : `${delta > 0 ? "+" : ""}${delta} points`}
          </p>
          {previous && (
            <p className="mt-1 text-xs font-semibold text-muted">
              Previous: {previous.scorePercent !== null ? `${previous.scorePercent}%` : "Pending review"}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
