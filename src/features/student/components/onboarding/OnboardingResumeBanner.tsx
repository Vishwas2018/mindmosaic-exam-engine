"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

export function OnboardingResumeBanner({
  onboardingCompleted,
  yearLevel,
  interests,
  weeklyGoalMinutes,
}: {
  onboardingCompleted: boolean;
  yearLevel: number | null;
  interests?: readonly string[];
  weeklyGoalMinutes?: number;
}) {
  const { open } = useOnboardingStore();

  if (onboardingCompleted) {
    return null;
  }

  return (
    <aside
      aria-label="Diagnostic warmup invitation"
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,rgba(107,33,168,0.06)_0%,rgba(249,115,22,0.06)_100%)] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
              Discover your starting point with a quick 5-question warmup
            </h3>
            <p className="mt-0.5 text-xs text-mm-muted">
              Complete your initial diagnostic to unlock personalised recommendations and baseline mastery.
            </p>
          </div>
        </div>

        <div className="sm:shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              open({
                initialYearLevel: yearLevel,
                initialInterests: interests,
                initialWeeklyGoal: weeklyGoalMinutes,
              })
            }
            className="w-full sm:w-auto gap-1.5"
          >
            <span>Start warmup</span>
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
