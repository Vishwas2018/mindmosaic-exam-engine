import { Lightbulb } from "lucide-react";

import type { SubjectMastery } from "@/features/student/attempt-summary";

/**
 * "Pedagogical Insight" from the Stitch mock, using the real weakest
 * subject (overview.recommendedFocus) instead of the mock's fabricated
 * "multiplication accuracy is now at 100%... transition to decimal
 * fractions" narrative — there is no per-skill insight-generation model in
 * this codebase.
 */
export function MyProgressInsightCard({ recommendedFocus }: { recommendedFocus: SubjectMastery | null }) {
  if (!recommendedFocus) return null;

  return (
    <section className="flex items-start gap-4 rounded-2xl border border-mm-line bg-mm-page/60 p-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mm-tint text-primary">
        <Lightbulb aria-hidden="true" className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
          Worth practising
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-mm-muted">
          {recommendedFocus.label} has your lowest marks so far: {recommendedFocus.marksEarned} of{" "}
          {recommendedFocus.marksAvailable} marks across {recommendedFocus.sets} sets. That is a
          reason to try some more questions here, not a prediction of anything.
        </p>
      </div>
    </section>
  );
}
