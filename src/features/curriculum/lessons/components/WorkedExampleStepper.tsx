"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import type { WorkedExampleSection as WorkedExampleSectionType } from "../schema";
import { LessonVisualRenderer } from "./LessonVisualRenderer";

interface WorkedExampleStepperProps {
  section: WorkedExampleSectionType;
}

export function WorkedExampleStepper({ section }: WorkedExampleStepperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);

  const totalSteps = section.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  // Keyboard navigation for stepping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only listen when stepper or child has focus or active inside
      if (!stepperRef.current?.contains(document.activeElement)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (!showAllSteps && currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (!showAllSteps && currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, totalSteps, showAllSteps]);

  return (
    <section
      ref={stepperRef}
      id={section.id}
      aria-labelledby={`heading-${section.id}`}
      className="scroll-mt-36 overflow-hidden rounded-2xl border border-mm-line bg-white shadow-xs transition-shadow duration-200 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-mm-brand"
      tabIndex={0}
    >
      {/* Header */}
      <div className="border-b border-mm-line-soft bg-gradient-to-r from-mm-tint/50 via-mm-tint-soft/30 to-white px-6 py-4.5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mm-brand">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-brand text-white shadow-2xs">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
              Step-by-Step Worked Example
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllSteps((prev) => !prev)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-mm-line bg-white px-3.5 text-xs font-bold text-mm-ink shadow-2xs transition-all duration-180 hover:border-mm-brand hover:bg-mm-tint/40 hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showAllSteps ? "Step-by-step view" : "Show all steps"}</span>
            </button>
          </div>
        </div>

        <h2 id={`heading-${section.id}`} className="mt-2 text-xl font-bold tracking-tight text-mm-ink sm:text-2xl">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-6 p-6 sm:p-8">
        {/* Problem Statement Card */}
        <div className="relative overflow-hidden rounded-2xl border border-mm-brand/20 bg-gradient-to-br from-mm-tint/30 via-slate-50/70 to-white p-5 sm:p-6">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
            Problem
          </span>
          <p className="mt-2 text-[16.5px] font-semibold leading-relaxed text-mm-ink whitespace-pre-line">
            {section.problem}
          </p>
          {section.visualAsset && (
            <div className="mt-4 overflow-hidden rounded-xl border border-mm-line bg-white p-3.5 shadow-2xs">
              <LessonVisualRenderer visual={section.visualAsset} />
            </div>
          )}
        </div>

        {/* Step Progress Indicators */}
        {!showAllSteps && (
          <div className="flex flex-col gap-2.5 rounded-xl bg-slate-50/80 p-4 border border-mm-line-soft">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-mm-muted">
              <span className="flex items-center gap-1.5 text-mm-ink">
                <span className="h-2 w-2 rounded-full bg-mm-brand" />
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span className="font-mono text-mm-brand">
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="flex gap-2">
              {section.steps.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    setShowAllSteps(false);
                  }}
                  aria-label={`Jump to step ${idx + 1}: ${s.label}`}
                  className={clsx(
                    "h-2.5 flex-1 rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-mm-brand",
                    idx === currentStepIndex
                      ? "bg-mm-brand ring-4 ring-mm-brand/20 shadow-xs"
                      : idx < currentStepIndex
                      ? "bg-emerald-500"
                      : "bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div aria-live="polite" className="grid gap-5">
          {(showAllSteps ? section.steps : [section.steps[currentStepIndex]]).map((step) => (
            <article
              key={step.stepNumber}
              className="overflow-hidden rounded-2xl border border-mm-line bg-white shadow-2xs transition-shadow duration-200 hover:shadow-xs"
            >
              <div className="flex items-center gap-3 border-b border-mm-line-soft bg-slate-50/80 px-5 py-3.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-mm-brand text-xs font-bold text-white shadow-2xs">
                  {step.stepNumber}
                </span>
                <h3 className="text-[15px] font-bold text-mm-ink">{step.label}</h3>
              </div>

              <div className="grid gap-4 p-5 sm:p-6">
                <div className="prose max-w-none text-[15.5px] leading-relaxed text-mm-ink font-medium whitespace-pre-line">
                  {step.working}
                </div>

                {step.visualAsset && (
                  <div className="my-1 overflow-hidden rounded-xl border border-mm-line bg-slate-50/60 p-4 shadow-inner">
                    <LessonVisualRenderer visual={step.visualAsset} />
                  </div>
                )}

                {/* Why this step callout */}
                <div className="flex items-start gap-3 rounded-xl border-l-4 border-mm-brand bg-gradient-to-r from-mm-tint/50 to-white p-4 text-[14px] text-mm-ink-soft shadow-2xs">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-mm-brand/10 text-mm-brand shrink-0">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="leading-relaxed">
                    <strong className="font-bold text-mm-ink">Why this step: </strong>
                    <span>{step.why}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Navigation Buttons (when not showing all) */}
        {!showAllSteps && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isFirstStep}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-mm-line bg-white px-4.5 text-sm font-bold text-mm-ink shadow-2xs transition-all duration-180 disabled:opacity-40 disabled:cursor-not-allowed hover:border-mm-brand hover:text-mm-brand hover:bg-mm-tint/30 focus-visible:outline-2 focus-visible:outline-mm-brand cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Previous step</span>
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => setShowAllSteps(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-xs transition-all duration-180 hover:bg-emerald-700 hover:shadow-sm active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Review all steps</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-mm-brand px-5.5 text-sm font-bold text-white shadow-xs transition-all duration-180 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand cursor-pointer"
              >
                <span>Next step</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Final Answer Box (shown on last step or all steps) */}
        {(isLastStep || showAllSteps) && (
          <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Final Answer
              </h3>
            </div>
            <p className="mt-3 text-[16px] font-bold leading-relaxed text-emerald-950 whitespace-pre-line">
              {section.finalAnswer}
            </p>
          </div>
        )}

        {/* Common Error Warning Box */}
        {section.commonError && (isLastStep || showAllSteps) && (
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50/90 to-amber-100/40 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 text-amber-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Common Mistake to Watch Out For
              </h3>
            </div>
            <div className="mt-3.5 grid gap-2 text-sm leading-relaxed text-amber-950">
              <p className="rounded-lg bg-white/70 p-2.5 border border-amber-200/80">
                <strong className="font-bold text-amber-900">The Mistake: </strong>
                {section.commonError.mistake}
              </p>
              <p className="pl-1">
                <strong className="font-bold text-amber-900">Why it happens: </strong>
                {section.commonError.whyItHappens}
              </p>
              <p className="pl-1">
                <strong className="font-bold text-amber-900">How to avoid it: </strong>
                {section.commonError.howToAvoid}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
