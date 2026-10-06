"use client";

import type { ReactNode } from "react";
import { BookOpen, Calculator, Flag, PenLine, Puzzle, Lightbulb, type LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

import { chapter2Demos, type SceneVisualType } from "../chapter2-scenes";
import { Build, type BuildProgress } from "../cinematic/Build";
import { learningDemo, programmes } from "../content";

/**
 * Chapter 2 product visuals: read-only, deterministic DOM renditions of the
 * product screens each programme scene talks about. Real text, no images, no
 * canvas, no baked-in UI. Nothing is focusable and nothing is interactive.
 *
 * `build` is the scene's progressive-build value (0..1) while the pinned
 * stage is choreographed, or `null` when the visual should simply be
 * complete (phones, tablets, reduced motion). Every visual is fully readable
 * at `null`; animation only reveals it in order.
 */
const CARD = "rounded-2xl border border-mm-line bg-white shadow-[0_24px_56px_-28px_rgba(24,21,31,0.5)]";

function CardHeader({ meta, trailing }: { meta: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft px-4 py-3 text-[13px] text-mm-muted">
      <span className="flex min-w-0 items-center gap-2.5">
        <MindMosaicLogo layout="mark" size="sm" trademark="none" />
        <span className="truncate">{meta}</span>
      </span>
      {trailing && <span className="shrink-0 tabular-nums">{trailing}</span>}
    </div>
  );
}

function OptionRow({ label, letter, selected }: { label: string; letter: string; selected?: boolean }) {
  return (
    <li
      className={`flex min-h-10 items-center gap-3 rounded-xl border px-3 text-[15px] ${
        selected ? "border-2 border-mm-brand bg-mm-tint font-semibold text-mm-ink" : "border-mm-line bg-white text-mm-ink-soft"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
          selected ? "bg-mm-brand text-white" : "border border-mm-line text-mm-muted"
        }`}
      >
        {letter}
      </span>
      <span className="tabular-nums">
        <span className="sr-only">Option {letter}: </span>
        {label}
      </span>
      {selected && <span className="sr-only">(selected)</span>}
    </li>
  );
}

/** NAPLAN-style: the real practice-paper sitting, from the learning-demo contract. */
function ExamPaper({ build }: { build: BuildProgress }) {
  const demo = learningDemo.prepareDemo;
  return (
    <article aria-label="Sample NAPLAN-style practice paper" className={twMerge(CARD, "overflow-hidden")}>
      <CardHeader meta={demo.meta} trailing={demo.progress} />
      <div className="grid gap-4 p-4 sm:p-5">
        <Build progress={build} from={0} to={0.3}>
          <p className="m-0 text-pretty text-[16px] font-semibold leading-[1.45] text-mm-ink">{demo.question}</p>
        </Build>
        <Build progress={build} from={0.2} to={0.55}>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {demo.options.map((option, index) => (
              <OptionRow key={option} letter={String.fromCharCode(65 + index)} label={option} selected={index === demo.selectedIndex} />
            ))}
          </ul>
        </Build>
        <Build progress={build} from={0.5} to={0.9} className="flex items-center justify-between gap-3 border-t border-mm-line-soft pt-3">
          <span className="inline-flex items-center gap-2 text-[13.5px] text-mm-ink-soft">
            <Flag aria-hidden="true" className="h-4 w-4 text-mm-coral" strokeWidth={1.8} />
            {demo.flaggedCount} flagged to revisit
          </span>
          <span
            role="img"
            aria-label={`Question map: ${demo.currentQuestion - 1} answered, question ${demo.currentQuestion} current, ${demo.flaggedCount} flagged`}
            className="grid grid-cols-10 gap-1"
          >
            {Array.from({ length: demo.questionCount }, (_, index) => {
              const n = index + 1;
              return (
                <span
                  key={n}
                  className={`h-2 w-2 rounded-[2px] ${
                    n === demo.currentQuestion ? "bg-mm-brand" : n < demo.currentQuestion ? "bg-mm-brand-mid" : "bg-mm-track"
                  }`}
                />
              );
            })}
          </span>
        </Build>
      </div>
    </article>
  );
}

/** ICAS-style: an extension question with a thinking prompt, no answer marked. */
function ExtensionQuestion({ build }: { build: BuildProgress }) {
  const demo = chapter2Demos.extension;
  return (
    <article aria-label={demo.label} className={twMerge(CARD, "overflow-hidden")}>
      <CardHeader meta={demo.meta} />
      <div className="grid gap-4 p-4 sm:p-5">
        <Build progress={build} from={0} to={0.3}>
          <span className="inline-block rounded-md bg-mm-tint px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-mm-brand">
            {demo.tag}
          </span>
          <p className="m-0 mt-3 text-pretty text-[16px] font-semibold leading-[1.45] text-mm-ink">{demo.question}</p>
        </Build>
        <Build progress={build} from={0.25} to={0.6}>
          <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
            {demo.options.map((option, index) => (
              <OptionRow key={option} letter={String.fromCharCode(65 + index)} label={option} />
            ))}
          </ul>
        </Build>
        <Build progress={build} from={0.55} to={0.95} className="flex items-start gap-3 rounded-xl bg-mm-ember-tint p-3.5">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-mm-ember-ink" strokeWidth={1.9} />
          <p className="m-0 text-[14.5px] leading-[1.5] text-mm-ink-soft">
            <strong className="text-mm-ink">{demo.hintLabel}: </strong>
            {demo.hint}
          </p>
        </Build>
      </div>
    </article>
  );
}

/** Curriculum learning: the real lesson language, built block by block. */
function LessonCard({ build }: { build: BuildProgress }) {
  const lesson = learningDemo.learnDemo;
  const segments = 4;
  return (
    <article aria-label="Sample curriculum lesson" className={twMerge(CARD, "overflow-hidden")}>
      <div className="flex flex-wrap justify-between gap-2 border-b border-mm-line-soft px-4 py-3 text-[13px] text-mm-muted">
        <span>Year 3 · Mathematics · Number</span>
        <span>Lesson</span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <Build progress={build} from={0} to={0.2} className="rounded-xl bg-mm-tint p-3.5">
          <p className="m-0 mb-1 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Learning intention</p>
          <p className="m-0 text-[15px] leading-[1.5] text-mm-ink">{lesson.intention}</p>
        </Build>
        <div className="grid gap-2">
          <Build progress={build} from={0.15} to={0.4}>
            <p className="m-0 text-[15px] leading-[1.55] text-mm-ink-soft">
              <strong className="text-mm-ink">Concept:</strong> {lesson.explanation}
            </p>
          </Build>
          <div
            role="img"
            aria-label={`A bar split into ${segments} equal parts, filled one part at a time`}
            className="grid h-11 grid-cols-4 overflow-hidden rounded-lg border-2 border-mm-brand"
          >
            {Array.from({ length: segments }, (_, index) => (
              <div key={index} className={index > 0 ? "border-l-2 border-white" : ""}>
                <Build progress={build} from={0.35 + index * 0.07} to={0.5 + index * 0.07} grow className="h-full bg-mm-brand" />
              </div>
            ))}
          </div>
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
        <Build progress={build} from={0.8} to={1} className="flex items-center justify-between gap-3 rounded-xl border border-mm-tint-line bg-mm-wash px-3.5 py-2.5">
          <span className="text-[14px] font-semibold text-mm-ink">Next: practice questions</span>
          <span className="rounded-lg bg-mm-brand px-3 py-1.5 text-[13.5px] font-semibold text-white">Start practice</span>
        </Build>
      </div>
    </article>
  );
}

/** AMC-style: an original pattern problem with a deterministic dot-figure SVG. */
function ProblemCard({ build }: { build: BuildProgress }) {
  const demo = chapter2Demos.problem;
  const cell = 14;
  const maxRows = demo.figures[demo.figures.length - 1]!;
  return (
    <article aria-label={demo.label} className={twMerge(CARD, "overflow-hidden")}>
      <CardHeader meta={demo.meta} />
      <div className="grid gap-4 p-4 sm:p-5">
        <Build progress={build} from={0} to={0.25}>
          <p className="m-0 text-pretty text-[16px] font-semibold leading-[1.45] text-mm-ink">{demo.question}</p>
        </Build>
        <div
          role="img"
          aria-label="Four dot figures. Each figure has one more row of dots than the figure before it."
          className="grid grid-cols-4 gap-2 rounded-xl bg-mm-wash p-3"
        >
          {demo.figures.map((rows, figureIndex) => (
            <Build key={rows} progress={build} from={0.2 + figureIndex * 0.13} to={0.4 + figureIndex * 0.13} className="grid justify-items-center gap-1.5">
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${maxRows * cell} ${maxRows * cell}`}
                className="h-16 w-16 sm:h-[72px] sm:w-[72px]"
              >
                {Array.from({ length: rows }, (_, row) =>
                  Array.from({ length: row + 1 }, (_, col) => (
                    <circle
                      key={`${row}-${col}`}
                      cx={(maxRows * cell) / 2 + (col - row / 2) * cell}
                      cy={cell / 2 + row * cell}
                      r={4.2}
                      className="fill-mm-brand"
                    />
                  )),
                )}
              </svg>
              <span className="text-[12px] font-semibold text-mm-muted">Figure {rows}</span>
            </Build>
          ))}
        </div>
        <Build progress={build} from={0.7} to={1}>
          <ul className="m-0 grid list-none grid-cols-5 gap-1.5 p-0">
            {demo.options.map((option, index) => (
              <li
                key={option}
                className="grid h-10 place-items-center rounded-lg border border-mm-line text-[15px] font-semibold tabular-nums text-mm-ink-soft"
              >
                <span aria-hidden="true">{option}</span>
                <span className="sr-only">
                  Option {String.fromCharCode(65 + index)}: {option}
                </span>
              </li>
            ))}
          </ul>
        </Build>
      </div>
    </article>
  );
}

/** Singapore Maths: a bar model constructed bar by bar, then bracketed. */
function BarModel({ build }: { build: BuildProgress }) {
  const demo = chapter2Demos.barModel;
  const tones = ["bg-mm-brand", "bg-mm-coral"] as const;
  return (
    <article aria-label={demo.label} className={twMerge(CARD, "overflow-hidden")}>
      <CardHeader meta={demo.meta} />
      <div className="grid gap-5 p-4 sm:p-6">
        <Build progress={build} from={0} to={0.2}>
          <p className="m-0 text-pretty text-[16px] font-semibold leading-[1.45] text-mm-ink">{demo.question}</p>
        </Build>
        <div
          role="img"
          aria-label={`Bar model. ${demo.rows.map((row) => `${row.name} has ${row.units} units`).join(", ")}. Together that is ${demo.totalUnits} units, which is ${demo.total} stickers.`}
          className="grid gap-3"
        >
          {demo.rows.map((row, rowIndex) => (
            <div key={row.name} className="grid grid-cols-[3rem_1fr] items-center gap-3">
              <span aria-hidden="true" className="text-[14px] font-semibold text-mm-ink">
                {row.name}
              </span>
              <div
                aria-hidden="true"
                className="grid h-11 overflow-hidden rounded-md border-2 border-mm-ink/70"
                style={{ gridTemplateColumns: `repeat(${demo.totalUnits}, 1fr)` }}
              >
                <div style={{ gridColumn: `span ${row.units}` }} className="overflow-hidden">
                  <Build progress={build} from={0.15 + rowIndex * 0.2} to={0.4 + rowIndex * 0.2} grow className="h-full">
                    <div
                      className={`grid h-full ${tones[rowIndex]}`}
                      style={{ gridTemplateColumns: `repeat(${row.units}, 1fr)` }}
                    >
                      {Array.from({ length: row.units }, (_, unit) => (
                        <span key={unit} className={`h-full ${unit > 0 ? "border-l-2 border-white/60" : ""}`} />
                      ))}
                    </div>
                  </Build>
                </div>
              </div>
            </div>
          ))}
          <Build progress={build} from={0.55} to={0.75} className="grid grid-cols-[3rem_1fr] items-center gap-3">
            <span aria-hidden="true" />
            <div aria-hidden="true" className="relative pt-1 text-center">
              <span className="block h-2.5 rounded-b-md border-x-2 border-b-2 border-mm-ink/70" />
              <span className="mt-1 inline-block text-[14px] font-semibold tabular-nums text-mm-ink">
                {demo.total} stickers · {demo.totalUnits} units
              </span>
            </div>
          </Build>
        </div>
        <Build progress={build} from={0.75} to={1}>
          <ol className="m-0 grid list-none gap-1 p-0 text-[14px] leading-[1.45] text-mm-ink-soft">
            {demo.steps.map((step, index) => (
              <li key={step} className="flex gap-2.5">
                <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mm-tint text-[11px] font-bold text-mm-brand">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Build>
      </div>
    </article>
  );
}

const SKILL_ICONS: Record<string, LucideIcon> = {
  "Mathematical reasoning": Calculator,
  Reading: BookOpen,
  "Thinking skills": Puzzle,
  Writing: PenLine,
};

/** Selective-style: the skill categories of a preparation paper, from the canonical subject list. */
function SkillCategories({ build }: { build: BuildProgress }) {
  const demo = chapter2Demos.skills;
  const subjects = programmes.items.find((item) => item.id === "selective-entry-style")!.subjects;
  return (
    <article aria-label={demo.label} className={twMerge(CARD, "overflow-hidden")}>
      <CardHeader meta={demo.meta} trailing={demo.tag} />
      <div className="grid gap-4 p-4 sm:p-5">
        <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
          {subjects.map((subject, index) => {
            const Icon = SKILL_ICONS[subject] ?? Puzzle;
            return (
              <li key={subject}>
                <Build progress={build} from={index * 0.14} to={0.28 + index * 0.14} className="flex h-full items-center gap-3 rounded-xl border border-mm-line bg-mm-wash p-3">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-mm-brand">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="text-[14.5px] font-semibold leading-tight text-mm-ink">{subject}</span>
                </Build>
              </li>
            );
          })}
        </ul>
        <Build progress={build} from={0.7} to={1}>
          <p className="m-0 border-t border-mm-line-soft pt-3 text-[13.5px] leading-[1.5] text-mm-muted">{demo.note}</p>
        </Build>
      </div>
    </article>
  );
}

export function SceneVisual({ type, build }: { type: SceneVisualType; build: BuildProgress }) {
  switch (type) {
    case "exam-paper":
      return <ExamPaper build={build} />;
    case "extension-question":
      return <ExtensionQuestion build={build} />;
    case "lesson":
      return <LessonCard build={build} />;
    case "problem-card":
      return <ProblemCard build={build} />;
    case "bar-model":
      return <BarModel build={build} />;
    case "skill-categories":
      return <SkillCategories build={build} />;
  }
}
