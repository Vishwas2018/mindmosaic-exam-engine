"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  HelpCircle,
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
      aria-labelledby={`heading-${section.id}`}
      className="overflow-hidden rounded-2xl border border-mm-line bg-white shadow-sm"
      tabIndex={0}
    >
      {/* Header */}
      <div className="border-b border-mm-line-soft bg-mm-tint/30 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-mm-brand">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              Step-by-Step Worked Example
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAllSteps((prev) => !prev)}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-mm-line bg-white px-3 text-xs font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showAllSteps ? "Step-by-step view" : "Show all steps"}</span>
            </button>
          </div>
        </div>

        <h2 id={`heading-${section.id}`} className="mt-1 text-xl font-bold text-mm-ink">
          {section.heading}
        </h2>
      </div>

      <div className="grid gap-6 p-6">
        {/* Problem Statement Card */}
        <div className="rounded-xl border border-mm-line bg-slate-50/80 p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">Problem</p>
          <p className="mt-1 text-[16px] font-semibold text-mm-ink whitespace-pre-line">{section.problem}</p>
          {section.visualAsset && (
            <div className="mt-4 rounded-lg border border-mm-line bg-white p-3">
              <LessonVisualRenderer visual={section.visualAsset} />
            </div>
          )}
        </div>

        {/* Step Progress Indicators */}
        {!showAllSteps && (
          <div className="flex flex-col gap-2 border-y border-mm-line-soft py-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-mm-muted">
              <span>
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="flex gap-1.5">
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
                    "h-2 flex-1 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-mm-brand",
                    idx === currentStepIndex
                      ? "bg-mm-brand ring-2 ring-mm-brand/30"
                      : idx < currentStepIndex
                      ? "bg-emerald-500"
                      : "bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* ARIA Live Region for Step Content */}
        <div aria-live="polite" className="grid gap-4">
          {(showAllSteps ? section.steps : [section.steps[currentStepIndex]]).map((step) => (
            <article
              key={step.stepNumber}
              className="overflow-hidden rounded-xl border border-mm-line bg-white transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-mm-line-soft bg-slate-50/70 px-4 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-mm-brand text-xs font-bold text-white">
                  {step.stepNumber}
                </span>
                <h3 className="text-sm font-bold text-mm-ink">{step.label}</h3>
              </div>

              <div className="grid gap-3 p-4">
                <div className="prose max-w-none text-[15px] leading-relaxed text-mm-ink font-medium whitespace-pre-line">
                  {step.working}
                </div>

                {step.visualAsset && (
                  <div className="my-2 rounded-lg border border-mm-line bg-slate-50/50 p-3">
                    <LessonVisualRenderer visual={step.visualAsset} />
                  </div>
                )}

                {/* Why this step callout */}
                <div className="flex items-start gap-2.5 rounded-lg border-l-4 border-mm-brand bg-mm-tint/40 p-3 text-[13.5px] text-mm-ink-soft">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-mm-brand" aria-hidden="true" />
                  <div>
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
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-mm-line bg-white px-4 text-sm font-bold text-mm-ink disabled:opacity-40 disabled:hover:border-mm-line hover:border-mm-brand hover:text-mm-brand focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Previous step</span>
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={() => setShowAllSteps(true)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Review all steps</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-5 text-sm font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
              >
                <span>Next step</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Final Answer Box (shown on last step or all steps) */}
        {(isLastStep || showAllSteps) && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-bold uppercase tracking-wide">Final Answer</h3>
            </div>
            <p className="mt-2 text-[15.5px] font-semibold text-emerald-950 whitespace-pre-line">
              {section.finalAnswer}
            </p>
          </div>
        )}

        {/* Common Error Warning Box */}
        {section.commonError && (isLastStep || showAllSteps) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h3 className="text-sm font-bold uppercase tracking-wide">Common Mistake to Watch Out For</h3>
            </div>
            <div className="mt-2 grid gap-1.5 text-sm text-amber-950">
              <p>
                <strong className="font-bold">The Mistake: </strong>
                {section.commonError.mistake}
              </p>
              <p>
                <strong className="font-bold">Why it happens: </strong>
                {section.commonError.whyItHappens}
              </p>
              <p>
                <strong className="font-bold">How to avoid it: </strong>
                {section.commonError.howToAvoid}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
