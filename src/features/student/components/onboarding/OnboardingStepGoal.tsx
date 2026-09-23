"use client";

import { Check, Flame, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

interface GoalOption {
  readonly minutes: number;
  readonly title: string;
  readonly subtitle: string;
  readonly badge?: string;
}

const GOAL_OPTIONS: readonly GoalOption[] = [
  {
    minutes: 30,
    title: "30 mins / week",
    subtitle: "Light & steady · 1–2 quick sessions",
  },
  {
    minutes: 60,
    title: "60 mins / week",
    subtitle: "Balanced · 2–3 regular practice sessions",
    badge: "Recommended",
  },
  {
    minutes: 90,
    title: "90 mins / week",
    subtitle: "Dedicated · 3–4 focused sessions",
  },
  {
    minutes: 120,
    title: "120 mins / week",
    subtitle: "Ambitious · Consistent daily mastery",
  },
];

export function OnboardingStepGoal({
  onBack,
  onStartWarmup,
}: {
  onBack: () => void;
  onStartWarmup: () => void;
}) {
  const { weeklyGoalMinutes, setWeeklyGoalMinutes } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          Step 3 of 3 · Weekly Target
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink sm:text-3xl">
          Set your weekly practice goal
        </h2>
        <p className="text-sm leading-relaxed text-mm-muted">
          Setting a target helps you build momentum and track your progress over time.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Choose your weekly practice target:</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GOAL_OPTIONS.map((option) => {
            const isSelected = weeklyGoalMinutes === option.minutes;

            return (
              <button
                key={option.minutes}
                type="button"
                onClick={() => setWeeklyGoalMinutes(option.minutes)}
                aria-pressed={isSelected}
                className={`relative flex min-h-20 flex-col justify-center rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-royal/15 bg-white text-mm-ink hover:border-royal/30"
                }`}
              >
                {option.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    {option.badge}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target aria-hidden="true" className="h-4 w-4 text-primary" />
                    <span className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
                      {option.title}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                      <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-mm-muted">{option.subtitle}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex items-start gap-3">
          <Flame aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs text-amber-950">
            <span className="font-bold">Next: 5-Question Diagnostic Warmup</span>
            <p className="mt-0.5 text-amber-900/90 leading-relaxed">
              We&apos;ll now run a quick, untimed 5-question warmup across your chosen curriculum to discover your initial baseline.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="min-h-12 px-6"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onStartWarmup}
          className="min-h-12 px-8"
        >
          Start Warmup
        </Button>
      </div>
    </div>
  );
}
