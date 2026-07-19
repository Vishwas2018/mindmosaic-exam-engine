import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  if (mastery.length === 0) {
    return null;
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
