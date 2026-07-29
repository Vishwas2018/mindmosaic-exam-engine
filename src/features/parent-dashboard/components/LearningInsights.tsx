import Link from "next/link";
import { Lightbulb, Target } from "lucide-react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, UpgradeRequired } from "@/components/ui";

import type { ChildSummary } from "../summary";

/**
 * Deeper, prose-style read on a child's practice (observations +
 * recommended next actions), gated behind an active subscription — a
 * trial-expired or otherwise inactive parent sees an upgrade prompt instead
 * of the panel body. The plain score/subject breakdowns above this stay
 * free; this is the "premium insight" surface named in the mockup.
 */
export function LearningInsights({
  child,
  hasAccess,
}: {
  child: ChildSummary;
  hasAccess: boolean;
}) {
  if (!hasAccess) {
    return (
      <UpgradeRequired
        title="Unlock learning insights"
        description={`Get plain-language observations and recommended next steps for ${child.displayName}, generated from every scored attempt.`}
        planName="Family plan"
        action={
          <Link href="/billing" className="text-sm font-extrabold text-royal underline underline-offset-4">
            See plans
          </Link>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb aria-hidden="true" className="h-5 w-5 text-royal" />
          Learning observations
        </CardTitle>
        <CardDescription>What the last few attempts show.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {child.observations.length === 0 ? (
          <p className="text-sm font-semibold text-muted">
            Not enough scored attempts yet to draw observations.
          </p>
        ) : (
          <ul className="space-y-2">
            {child.observations.map((observation) => (
              <li key={observation} className="flex gap-2 text-sm leading-6 text-ink">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-royal" />
                {observation}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-royal/8 pt-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
            <Target aria-hidden="true" className="h-4 w-4 text-royal" />
            Recommended next actions
          </p>
          <ul className="space-y-3">
            {child.recommendedActions.map((action) => (
              <li
                key={action.id}
                className="rounded-2xl border border-royal/8 bg-page/60 p-4"
              >
                <p className="text-sm font-bold text-ink">{action.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{action.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-royal/8 pt-5">
          <Badge variant="purple">{child.topicsMasteredCount} topics mastered</Badge>
          {child.readinessScore !== null && (
            <Badge variant={child.readinessScore >= 80 ? "success" : "neutral"}>
              Readiness score: {child.readinessScore}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
