"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

export function OnboardingStepWelcome({
  firstName,
  onNext,
}: {
  firstName: string | null;
  onNext: () => void;
}) {
  const { yearLevel, setYearLevel } = useOnboardingStore();

  const greeting = firstName ? `Welcome, ${firstName}!` : "Welcome to MindMosaic!";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          Step 1 of 3 · Year Level
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink sm:text-3xl">
          {greeting}
        </h2>
        <p className="text-sm leading-relaxed text-mm-muted">
          Let&apos;s get your learning portal set up. Please confirm your year level so we can personalise your questions.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-mm-ink">Choose your school year:</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setYearLevel(3)}
            aria-pressed={yearLevel === 3}
            className={`relative flex min-h-16 flex-col justify-center rounded-2xl border-2 p-4 text-left transition-all ${
              yearLevel === 3
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-royal/15 bg-white text-mm-ink hover:border-royal/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                Year 3
              </span>
              {yearLevel === 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check aria-hidden="true" className="h-4 w-4" />
                </span>
              )}
            </div>
            <span className="mt-1 text-xs text-mm-muted">
              Primary · NAPLAN & ICAS practice
            </span>
          </button>

          <button
            type="button"
            onClick={() => setYearLevel(5)}
            aria-pressed={yearLevel === 5}
            className={`relative flex min-h-16 flex-col justify-center rounded-2xl border-2 p-4 text-left transition-all ${
              yearLevel === 5
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-royal/15 bg-white text-mm-ink hover:border-royal/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                Year 5
              </span>
              {yearLevel === 5 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check aria-hidden="true" className="h-4 w-4" />
                </span>
              )}
            </div>
            <span className="mt-1 text-xs text-mm-muted">
              Upper Primary · NAPLAN & ICAS practice
            </span>
          </button>
        </div>
      </fieldset>

      <div className="pt-2 flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          className="min-h-12 w-full sm:w-auto px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
