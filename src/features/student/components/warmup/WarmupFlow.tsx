"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { OnboardingDiagnosticRunner } from "@/features/student/components/onboarding/OnboardingDiagnosticRunner";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";
import type { WarmupRecommendation } from "@/features/student/onboarding/recommendations";

const card = "rounded-3xl border border-mm-brand/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.09)]";
const linkButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-mm-brand px-5 text-[15px] font-semibold text-white transition-colors hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand";
const linkQuiet =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-mm-line bg-white px-5 text-[15px] font-semibold text-mm-ink transition-colors hover:border-mm-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand";

/**
 * The optional five-question warm-up, as a page rather than a pop-up. Intro (explicitly optional) → five
 * untimed questions → results with practice suggestions that come from the child's own answers.
 */
export function WarmupFlow({ yearLevel, previouslyCompleted }: { yearLevel: 3 | 5; previouslyCompleted: boolean }) {
  const [started, setStarted] = useState(false);
  const { step, setYearLevel, reset, diagnosticResult, baselineRecord, recommendations } = useOnboardingStore();

  /* A clean store for this visit, and the child's own year level. Nothing else carries over from earlier flows. */
  useEffect(() => {
    reset();
    setYearLevel(yearLevel);
    return () => reset();
  }, [yearLevel, reset, setYearLevel]);

  const finished = step === "warmup_summary" && diagnosticResult && baselineRecord;

  if (finished) {
    const total = diagnosticResult.totalQuestions;
    const correct = diagnosticResult.correctCount;
    const items = recommendations?.items ?? [];
    return (
      <div className="grid gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mm-brand">Warm-up finished</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl">
            You got {correct} of {total}
          </h1>
          <p className="mt-2 max-w-[640px] text-[17px] leading-[1.6] text-mm-ink-soft">
            Five questions are only a small sample, so this is a place to start, not a level. The suggestions below
            come from the questions you answered.
          </p>
        </div>

        {recommendations && recommendations.strengths.length > 0 && (
          <section aria-labelledby="warmup-went-well" className={`${card} px-6 py-6`}>
            <h2 id="warmup-went-well" className="font-[family-name:var(--font-display)] text-xl font-semibold text-mm-ink">
              What went well
            </h2>
            <ul className="mt-3 grid gap-1.5 text-[15px] text-mm-ink-soft">
              {recommendations.strengths.map((skill) => (
                <li key={skill} className="flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#0b6b63]" />
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="warmup-next" className={`${card} px-6 py-6`}>
          <h2 id="warmup-next" className="font-[family-name:var(--font-display)] text-xl font-semibold text-mm-ink">
            Suggested practice
          </h2>
          {items.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <RecommendationCard key={`${item.title}-${item.href}`} item={item} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[15px] leading-[1.6] text-mm-ink-soft">
              {recommendations?.note ?? "Practice Studio has everything that is open for your year."}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/student/practice" className={linkQuiet}>
              Browse Practice Studio
            </Link>
            <Link href="/student" className={linkQuiet}>
              Back to My Space
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="grid gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mm-brand">Optional</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl">
            Five-question warm-up
          </h1>
          <p className="mt-2 max-w-[640px] text-[17px] leading-[1.6] text-mm-ink-soft">
            Five questions from different parts of Year {yearLevel}, with no timer. When you finish, we suggest what to
            practise next based on the answers you gave.
          </p>
        </div>
        <section className={`${card} px-6 py-6`}>
          <ul className="grid gap-2 text-[15px] text-mm-ink-soft">
            <li>It takes about five minutes. You can leave at any time and nothing is lost.</li>
            <li>It is not a test. It only helps pick what to practise first.</li>
            <li>It is a starting point: five questions cannot show everything you know.</li>
            {previouslyCompleted && <li>You have done this warm-up before. You can take it again.</li>}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => setStarted(true)} className="min-h-12 px-6">
              {previouslyCompleted ? "Take it again" : "Start the warm-up"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
            <Link href="/student" className={linkQuiet}>
              Not now
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <OnboardingDiagnosticRunner preferences={false} heading="Five-question warm-up" />
    </div>
  );
}

function RecommendationCard({ item }: { item: WarmupRecommendation }) {
  return (
    <li className="flex flex-col rounded-2xl border border-mm-line bg-white p-5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mm-muted">
        {item.kind === "focus_area" ? "Worth practising" : "Nearly there"}
      </span>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-mm-ink">{item.title}</h3>
      <p className="mt-1.5 flex-1 text-[15px] leading-[1.55] text-mm-ink-soft">{item.reason}</p>
      <Link href={item.href} className={`${linkButton} mt-4 self-start`}>
        {item.cta}
      </Link>
    </li>
  );
}
