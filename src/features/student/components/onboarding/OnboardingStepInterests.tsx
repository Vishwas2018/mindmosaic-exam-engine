"use client";

import { BookOpen, Calculator, Check, Compass, Cpu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

interface SubjectOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ElementType;
}

const SUBJECT_OPTIONS: readonly SubjectOption[] = [
  {
    id: "Mathematics",
    label: "Mathematics & Numeracy",
    description: "Number facts, arithmetic, patterns and problem solving",
    icon: Calculator,
  },
  {
    id: "Reading",
    label: "Reading & Comprehension",
    description: "Stories, informational articles, vocabulary and poetry",
    icon: BookOpen,
  },
  {
    id: "Language Conventions",
    label: "Grammar & Spelling",
    description: "Punctuation, word building, spelling rules and syntax",
    icon: Sparkles,
  },
  {
    id: "Science",
    label: "Science & Inquiry",
    description: "Living world, physical forces, earth and experiments",
    icon: Compass,
  },
  {
    id: "Problem Solving",
    label: "Logic & Digital Tech",
    description: "Computational thinking, patterns, algorithms and puzzles",
    icon: Cpu,
  },
];

export function OnboardingStepInterests({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const { interests, toggleInterest } = useOnboardingStore();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          Step 2 of 3 · Focus Areas
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink sm:text-3xl">
          What would you like to focus on?
        </h2>
        <p className="text-sm leading-relaxed text-mm-muted">
          Select one or more subjects you want to practise. You can explore all subjects anytime.
        </p>
      </div>

      <div className="space-y-2.5">
        {SUBJECT_OPTIONS.map((option) => {
          const isSelected = interests.includes(option.id);
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleInterest(option.id)}
              aria-pressed={isSelected}
              className={`flex w-full min-h-14 items-center justify-between rounded-2xl border-2 p-3.5 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 text-mm-ink"
                  : "border-royal/15 bg-white text-mm-ink hover:border-royal/30"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-royal/5 text-royal"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-mm-ink">{option.label}</p>
                  <p className="text-xs text-mm-muted">{option.description}</p>
                </div>
              </div>

              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-royal/25 bg-white"
                }`}
              >
                {isSelected && <Check aria-hidden="true" className="h-4 w-4 stroke-[3]" />}
              </div>
            </button>
          );
        })}
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
          onClick={onNext}
          disabled={interests.length === 0}
          className="min-h-12 px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
