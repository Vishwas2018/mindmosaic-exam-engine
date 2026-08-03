import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";

import { Card, ProgressBar } from "@/components/ui";

import type { SubjectMastery } from "../attempt-summary";

const ATTENTION_THRESHOLD = 65;

function tone(percent: number): "success" | "purple" | "orange" {
  if (percent >= 75) return "success";
  if (percent < ATTENTION_THRESHOLD) return "orange";
  return "purple";
}

/**
 * Per-subject mastery aggregated from every server-scored attempt
 * (marks-weighted, see aggregateMastery). Sorted strongest-first, with a
 * "needs attention" split matching the learning-hub mockup.
 */
export function MasterySnapshot({ mastery }: { mastery: readonly SubjectMastery[] }) {
  /*
   * Was `return null` with nothing in its place, so the dashboard silently
   * lost a panel until the first scored session — the student had no way to
   * know per-subject mastery was a thing the product tracks. It keeps its
   * slot now and says what will fill it.
   */
  if (mastery.length === 0) {
    return (
      <Card variant="default">
        <div className="border-b border-royal/8 px-6 py-4">
          <h2 className="text-sm font-extrabold text-ink">Mastery snapshot</h2>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            Across all your scored sessions
          </p>
        </div>
        <div className="px-6 py-8 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-royal/8 text-royal"
          >
            <BarChart3 className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-bold text-ink">No subjects scored yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted">
            Finish a session and each subject appears here with how much of it you
            have mastered.
          </p>
        </div>
      </Card>
    );
  }

  const strong = mastery.filter((entry) => entry.percent >= ATTENTION_THRESHOLD);
  const needsAttention = mastery.filter(
    (entry) => entry.percent < ATTENTION_THRESHOLD,
  );

  return (
    <Card variant="default">
      <div className="border-b border-royal/8 px-6 py-4">
        <h2 className="text-sm font-extrabold text-ink">Mastery snapshot</h2>
        <p className="mt-0.5 text-xs font-semibold text-muted">
          Across all your scored sessions
        </p>
      </div>
      <div className="space-y-5 px-6 py-5">
        {strong.map((entry) => (
          <ProgressBar
            key={entry.subject}
            value={entry.percent}
            label={entry.label}
            showValue
            tone={tone(entry.percent)}
          />
        ))}
        {needsAttention.length > 0 && (
          <>
            <p className="border-t border-royal/8 pt-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
              Needs attention
            </p>
            {needsAttention.map((entry) => (
              <ProgressBar
                key={entry.subject}
                value={entry.percent}
                label={entry.label}
                showValue
                tone={tone(entry.percent)}
              />
            ))}
          </>
        )}
      </div>
      <div className="border-t border-royal/8 px-6 py-4">
        <Link
          href="/results"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          View full results breakdown
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
