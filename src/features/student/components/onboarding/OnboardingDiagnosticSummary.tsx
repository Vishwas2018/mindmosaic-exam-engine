"use client";

import { CheckCircle2, Sparkles, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

export function OnboardingDiagnosticSummary({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const { diagnosticResult, baselineRecord, yearLevel } = useOnboardingStore();

  const totalQuestions = diagnosticResult?.totalQuestions ?? 5;
  const correctCount = diagnosticResult?.correctCount ?? 0;
  const accuracy = diagnosticResult?.objectivePercentage ?? Math.round((correctCount / totalQuestions) * 100);

  const strengths = baselineRecord?.skills.filter((s) => s.performanceTier === "strength") ?? [];

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
        <Trophy aria-hidden="true" className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          Diagnostic Completed · Year {yearLevel}
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink sm:text-3xl">
          Your starting baseline is ready!
        </h2>
        <p className="text-sm leading-relaxed text-mm-muted max-w-md mx-auto">
          We&apos;ve recorded your warmup results to personalise your recommended practice and skill pathways.
        </p>
      </div>

      {/* Score card */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-royal/15 bg-white p-4 shadow-sm">
        <div className="border-r border-royal/10 pr-2">
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-primary">
            {accuracy}%
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider text-mm-muted">
            Warmup Accuracy
          </p>
        </div>
        <div className="pl-2">
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-mm-ink">
            {correctCount} / {totalQuestions}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider text-mm-muted">
            Questions Correct
          </p>
        </div>
      </div>

      {/* Key insights / strengths */}
      {strengths.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-emerald-600" />
            <span>Identified Strengths</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-emerald-950">
            {strengths.map((skill) => (
              <li key={skill.skill} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{skill.strand}: <strong className="font-semibold">{skill.skill}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="button"
          onClick={onFinish}
          className="min-h-12 w-full sm:w-auto px-8 gap-2"
        >
          <span>Go to my dashboard</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
