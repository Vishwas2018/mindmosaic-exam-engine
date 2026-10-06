"use client";

import type { ReactNode } from "react";
import { AlertCircle, Check, Lightbulb, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

import { chapterThree, correctSampleOption, journeySamples, selectedSampleOption } from "../chapter3-journey";
import { Build, type BuildProgress } from "./chapter-two-visuals";

/**
 * Chapter 3 product visuals: read-only, deterministic DOM renditions of the
 * learn / practise / review / results screens, built from the approved landing
 * samples (see chapter3-journey.ts). Nothing here is focusable or interactive:
 * the controls are plain styled elements, not buttons. Meaning is carried by
 * words ("Your answer", "Correct answer", "Secure") and never by colour alone.
 *
 * Each state takes `BuildProgress` values (0..1) while the pinned stage is
 * choreographed, or `null` to be complete, so every state is fully readable
 * without animation (phones, tablets, reduced motion).
 */

/** The persistent outer frame. In the pinned stage it stays put while the state inside it changes. */
export function ProductFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={twMerge(
        "overflow-hidden rounded-[clamp(18px,2vw,26px)] border border-mm-line bg-white shadow-2xl shadow-mm-ink/15",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft bg-mm-page px-4 py-3">
        <span className="flex items-center gap-2.5">
          <MindMosaicLogo layout="mark" size="sm" trademark="none" />
          <span className="text-[13px] font-semibold text-mm-ink-soft">{chapterThree.frameLabel}</span>
        </span>
        <span className="rounded-md border border-mm-line bg-white px-2 py-[3px] text-xs text-mm-muted">
          {chapterThree.sampleLabel}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

/** A bar of equal parts, filled left to right. `segments` is the whole, `shaded` how many are filled. */
function FractionBar({
  segments,
  shaded,
  label,
  build,
}: {
  segments: number;
  shaded: number;
  label: string;
  build: BuildProgress;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="grid h-11 overflow-hidden rounded-lg border-2 border-mm-brand"
      style={{ gridTemplateColumns: `repeat(${segments}, 1fr)` }}
    >
      {Array.from({ length: segments }, (_, index) => (
        <div
          key={index}
          // A divider between two filled parts is white so the parts read as parts; otherwise brand.
          className={index === 0 ? "" : index < shaded ? "border-l-2 border-white" : "border-l-2 border-mm-brand"}
        >
          {index < shaded && (
            <Build
              progress={build}
              from={0.05 + index * (0.7 / segments)}
              to={0.25 + index * (0.7 / segments)}
              grow
              className="h-full bg-mm-brand"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** Scene 1: the lesson. */
export function LessonState({ build }: { build: BuildProgress }) {
  const lesson = journeySamples.lesson;
  return (
    <section aria-label="Sample lesson: unit fractions" className="grid gap-4">
      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-mm-muted">
        <span>Year 3 · Mathematics · Number</span>
        <span>Lesson</span>
      </div>
      <Build progress={build} from={0} to={0.22} className="rounded-xl bg-mm-tint p-3.5">
        <p className="m-0 mb-1 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Learning intention</p>
        <p className="m-0 text-[15px] leading-[1.5] text-mm-ink">{lesson.intention}</p>
      </Build>
      <div className="grid gap-2">
        <Build progress={build} from={0.18} to={0.4}>
          <p className="m-0 text-[15px] leading-[1.55] text-mm-ink-soft">
            <strong className="text-mm-ink">Concept:</strong> {lesson.explanation}
          </p>
        </Build>
        <FractionBar segments={4} shaded={4} label="A bar split into 4 equal parts, filled one part at a time" build={build} />
        <div aria-hidden="true" className="grid grid-cols-4 text-center text-sm text-mm-muted">
          <span className="font-bold text-mm-brand">¼</span>
          <span>¼</span>
          <span>¼</span>
          <span>¼</span>
        </div>
      </div>
      <Build progress={build} from={0.62} to={0.82} className="grid gap-1 border-t border-mm-line-soft pt-3">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-muted">Worked example</p>
        <p className="m-0 text-[15px] leading-[1.55] text-mm-ink-soft">{lesson.workedExample}</p>
      </Build>
      <Build progress={build} from={0.8} to={1} className="flex gap-3 rounded-xl border border-mm-alert-line bg-mm-alert p-3.5">
        <AlertCircle aria-hidden="true" className="mt-px h-5 w-5 shrink-0 text-mm-coral-deep" strokeWidth={1.8} />
        <p className="m-0 text-[14.5px] leading-[1.5] text-mm-ink-soft">{lesson.mixUp}</p>
      </Build>
    </section>
  );
}

export type QuestionPhase = "select" | "review";

/**
 * Scenes 2 and 3: ONE question in two moments. `phase="select"` shows the
 * student's (wrong) choice with no verdict; `phase="review"` labels both the
 * student's answer and the correct answer and opens the worked explanation.
 * In the pinned stage this same element persists across both scenes.
 */
export function QuestionState({
  phase,
  appear,
  explain,
  reserveExplanation = false,
  label,
}: {
  phase: QuestionPhase;
  /** Question, bar and options appearing (scene 2). */
  appear: BuildProgress;
  /** Worked explanation steps appearing (scene 3). */
  explain: BuildProgress;
  /** Keep the explanation's space (hidden) while selecting, so the frame never changes height. */
  reserveExplanation?: boolean;
  label: string;
}) {
  const demo = journeySamples.practice;
  const picked = selectedSampleOption();
  const correct = correctSampleOption();
  const reviewing = phase === "review";
  return (
    <section aria-label={label} className="grid gap-4">
      <div className="flex flex-wrap justify-between gap-2 text-[13px] text-mm-muted">
        <span>{demo.meta}</span>
        <span className="tabular-nums">{demo.progress}</span>
      </div>
      <Build progress={appear} from={0} to={0.3}>
        <p className="m-0 text-[17px] font-semibold leading-[1.4] text-mm-ink">{demo.question}</p>
      </Build>
      <FractionBar
        segments={demo.shadedOf}
        shaded={demo.shaded}
        label={`A bar split into ${demo.shadedOf} equal parts with ${demo.shaded} parts shaded`}
        build={appear}
      />
      <Build progress={appear} from={0.4} to={0.8}>
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
          {demo.options.map((option) => {
            const isPicked = option.key === picked.key;
            const isCorrect = option.key === correct.key;
            const wrong = reviewing && isPicked;
            const right = reviewing && isCorrect;
            return (
              <li
                key={option.key}
                className={`grid min-h-[58px] content-center gap-0.5 rounded-xl border px-3 py-2 transition-colors duration-200 ${
                  right
                    ? "border-2 border-mm-positive bg-mm-positive-soft"
                    : wrong
                      ? "border-2 border-mm-coral bg-mm-alert"
                      : isPicked
                        ? "border-2 border-mm-brand bg-mm-tint"
                        : "border-mm-line bg-white"
                } ${reviewing && !isPicked && !isCorrect ? "text-mm-muted" : "text-mm-ink"}`}
              >
                <span className="flex items-center gap-2.5 text-[15.5px] font-semibold tabular-nums">
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                      right ? "bg-mm-positive text-white" : wrong ? "bg-mm-coral-deep text-white" : isPicked ? "bg-mm-brand text-white" : "border border-mm-line text-mm-muted"
                    }`}
                  >
                    {option.key}
                  </span>
                  <span>
                    <span className="sr-only">Option {option.key}: </span>
                    {option.label}
                  </span>
                </span>
                {right && (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mm-positive">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.6} />
                    Correct answer
                  </span>
                )}
                {wrong && (
                  <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mm-coral-deep">
                    <X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.6} />
                    Your answer · not correct
                  </span>
                )}
                {!reviewing && isPicked && (
                  <span className="text-[12.5px] font-semibold text-mm-brand">Selected</span>
                )}
              </li>
            );
          })}
        </ul>
      </Build>
      <div className="grid">
        {!reviewing && (
          // A read-only picture of the "Check answer" control: not a button, not in the tab order.
          <div aria-hidden="true" style={{ gridArea: "1 / 1" }} className="flex items-start">
            <span className="inline-flex select-none items-center rounded-lg bg-mm-brand px-4 py-2 text-[14px] font-semibold text-white">
              Check answer
            </span>
          </div>
        )}
        {(reviewing || reserveExplanation) && (
          <div
            style={{ gridArea: "1 / 1" }}
            className={reviewing ? undefined : "invisible"}
            aria-hidden={reviewing ? undefined : true}
          >
            <div className="rounded-xl bg-mm-wash p-3.5">
            <Build progress={explain} from={0} to={0.25}>
              <p className="m-0 flex items-center gap-2.5 text-[15px] font-semibold text-mm-ink">
                <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-lg bg-mm-ember-tint text-mm-ember-ink">
                  <Lightbulb className="h-4 w-4" strokeWidth={1.9} />
                </span>
                {demo.incorrectFeedback}
              </p>
            </Build>
            <ol className="m-0 mt-2.5 grid list-none gap-1.5 p-0 text-[14.5px] leading-[1.5] text-mm-ink-soft">
              {demo.explanationSteps.map((step, index) => (
                <li key={step}>
                  <Build progress={explain} from={0.25 + index * 0.25} to={0.5 + index * 0.25} className="flex gap-2.5">
                    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mm-tint text-[11px] font-bold text-mm-brand">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </Build>
                </li>
              ))}
            </ol>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

/** Scene 4: the skill breakdown and the (conditional) focused next step. */
export function ResultsState({ build }: { build: BuildProgress }) {
  const sample = journeySamples.results;
  const chip = {
    Secure: { bar: "bg-mm-positive", chip: "bg-mm-positive-soft text-mm-positive" },
    "Getting there": { bar: "bg-mm-brand-mid", chip: "bg-mm-tint text-mm-brand" },
    "Practise next": { bar: "bg-mm-coral", chip: "bg-mm-alert text-mm-coral-deep" },
  } as const;
  return (
    <section aria-label="Sample skill breakdown after a test" className="grid gap-4">
      <div>
        <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Skill breakdown</p>
        <p className="m-0 mt-1 text-[16px] font-semibold text-mm-ink">{sample.label}</p>
      </div>
      <ul className="m-0 grid list-none gap-4 p-0">
        {sample.skills.map((skill, index) => (
          <li key={skill.name} className="grid gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[15px] font-medium text-mm-ink">{skill.name}</span>
              <span className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${chip[skill.state].chip}`}>
                  {skill.state}
                </span>
                <span className="text-[13.5px] font-semibold tabular-nums text-mm-ink-soft">{skill.value}%</span>
              </span>
            </div>
            <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-mm-track">
              <Build progress={build} from={0.05 + index * 0.15} to={0.35 + index * 0.15} grow className="h-full">
                <span className={`block h-full rounded-full ${chip[skill.state].bar}`} style={{ width: `${skill.value}%` }} />
              </Build>
            </div>
          </li>
        ))}
      </ul>
      <Build progress={build} from={0.6} to={0.95} className="grid gap-2 rounded-xl bg-mm-tint p-3.5">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Focused next step</p>
        <p className="m-0 text-[15px] leading-[1.5] text-mm-ink">{sample.nextSet}</p>
        <span
          aria-hidden="true"
          className="mt-1 inline-flex w-fit select-none items-center rounded-lg bg-mm-brand px-3.5 py-1.5 text-[13.5px] font-semibold text-white"
        >
          Start 5-question set
        </span>
      </Build>
    </section>
  );
}
