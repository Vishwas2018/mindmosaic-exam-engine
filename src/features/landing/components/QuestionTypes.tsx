"use client";

import { useState } from "react";

import { questionTypes } from "../content";
import { SectionHeading } from "./primitives";

const dotTones: Record<string, string> = {
  brand: "bg-mm-brand",
  coral: "bg-mm-coral",
  mid: "bg-mm-brand-mid",
  ink: "bg-mm-ink",
};

const miniCard = "grid gap-2.5 rounded-[14px] border border-mm-line p-[18px]";
const miniKicker = "text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted";
const exampleShell =
  "grid gap-4 rounded-[18px] border border-mm-line p-[clamp(20px,2.4vw,30px)]";

/**
 * The 14 response formats, grouped into four families. The left column is
 * the full list — every type is always visible, so the "14" in the
 * heading can be counted — and the right column shows worked examples for
 * whichever family is selected, including their unanswered / selected /
 * keyboard-focus / submitted states.
 */
export function QuestionTypes() {
  const [active, setActive] = useState<string>(questionTypes.families[0]!.id);
  const activeIndex = questionTypes.families.findIndex((family) => family.id === active);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const count = questionTypes.families.length;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % count;
    if (event.key === "ArrowLeft") next = (index - 1 + count) % count;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = count - 1;
    const target = questionTypes.families[next]!;
    setActive(target.id);
    document.getElementById(`mm-qt-tab-${target.id}`)?.focus();
  }

  return (
    <section
      id="question-types"
      aria-labelledby="question-types-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width">
        <SectionHeading
          id="question-types-heading"
          eyebrow={questionTypes.eyebrow}
          title={questionTypes.heading}
          intro={questionTypes.intro}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <div role="tablist" aria-label="Question type families" className="mb-[clamp(18px,2vw,24px)] flex flex-wrap gap-2">
          {questionTypes.families.map((family, index) => {
            const selected = family.id === active;
            return (
              <button
                key={family.id}
                type="button"
                role="tab"
                id={`mm-qt-tab-${family.id}`}
                aria-selected={selected}
                aria-controls="mm-qt-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(family.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`inline-flex min-h-11 items-center rounded-[10px] border px-5 text-[15px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  selected
                    ? "border-mm-brand bg-mm-brand text-white"
                    : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand"
                }`}
              >
                {family.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="mm-qt-panel"
          aria-labelledby={`mm-qt-tab-${active}`}
          tabIndex={-1}
          className="grid items-start gap-[clamp(18px,2vw,28px)] lg:grid-cols-2"
        >
          <div className="grid min-w-0 gap-[18px]">
            <div className="grid gap-4 rounded-[18px] border border-mm-line bg-mm-page p-[clamp(20px,2.2vw,28px)]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">
                All 14 question types
              </p>
              {questionTypes.families.map((family) => {
                const on = family.id === active;
                return (
                  <div key={family.id} className="grid gap-2">
                    <p
                      className={`text-[13px] font-extrabold tracking-[-0.01em] ${
                        on ? "text-mm-brand" : "text-mm-muted"
                      }`}
                    >
                      {family.label} · {family.types.length}
                    </p>
                    <ul className="grid gap-1.5">
                      {family.types.map((type) => (
                        <li
                          key={type}
                          className={`flex min-h-11 items-center gap-[11px] rounded-[10px] border px-3.5 text-[14.5px] text-mm-ink ${
                            on
                              ? "border-mm-tint-line-strong bg-white font-bold"
                              : "border-mm-line bg-mm-page font-medium"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-2 w-2 shrink-0 rounded-sm ${dotTones[family.dot] ?? dotTones.brand}`}
                          />
                          {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              <p className="text-[13.5px] leading-[1.55] text-mm-muted">{questionTypes.visualNote}</p>
            </div>

            <div className={miniCard}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-mm-muted">
                {questionTypes.statesHeading}
              </p>
              <p className="text-sm leading-[1.55] text-mm-ink-soft">{questionTypes.statesNote}</p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3.5">
            {activeIndex === 0 && <SelectExamples />}
            {activeIndex === 1 && <EnterExamples />}
            {activeIndex === 2 && <ArrangeExamples />}
            {activeIndex === 3 && <ExploreExamples />}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleHeader({ label, note }: { label: string; note: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">{label}</p>
      <p className="text-[12.5px] font-bold text-mm-muted">{note}</p>
    </div>
  );
}

function SelectExamples() {
  return (
    <>
      <div className={exampleShell}>
        <ExampleHeader label="Multiple select · Year 5 numeracy" note="Practice mode" />
        <p className="text-[clamp(17px,1.5vw,20px)] font-bold leading-[1.4] text-mm-ink">
          Select <strong>all</strong> the numbers that are multiples of 6.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            ["18", "selected"],
            ["21", "rest"],
            ["42", "selected"],
            ["52", "focus"],
          ].map(([value, state]) => (
            <span
              key={value}
              className={`flex min-h-14 items-center gap-[11px] rounded-[11px] px-4 text-base ${
                state === "selected"
                  ? "border-2 border-mm-brand bg-mm-tint-soft font-bold text-mm-ink"
                  : state === "focus"
                    ? "border border-mm-line font-semibold text-mm-ink outline outline-[3px] outline-offset-2 outline-mm-brand"
                    : "border border-mm-line font-semibold text-mm-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-6 w-6 place-items-center rounded-md text-[13px] font-extrabold ${
                  state === "selected" ? "bg-mm-brand text-white" : "border-2 border-mm-lilac"
                }`}
              >
                {state === "selected" ? "✓" : ""}
              </span>
              {value}
              {state === "selected" && <span className="ml-auto text-xs font-bold text-mm-brand">Selected</span>}
              {state === "focus" && (
                <span className="ml-auto text-xs font-bold text-mm-brand">Keyboard focus</span>
              )}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex min-h-11 items-center rounded-[10px] bg-mm-brand px-[22px] text-[15px] font-bold text-white">
            Submit answer
          </span>
          <span className="text-[13.5px] text-mm-muted">Two of four selected</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={miniCard}>
          <p className={miniKicker}>Multiple choice</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">Which number is closest to 1,000?</p>
          <div className="grid gap-1.5">
            <span className="flex min-h-11 items-center gap-2.5 rounded-[9px] border-2 border-mm-brand bg-mm-tint-soft px-3 text-sm font-bold text-mm-ink">
              <span
                aria-hidden="true"
                className="grid h-5 w-5 place-items-center rounded-full bg-mm-brand text-[11px] font-extrabold text-white"
              >
                A
              </span>
              987
              <span className="ml-auto text-[11.5px] font-bold text-mm-brand">Selected</span>
            </span>
            <span className="flex min-h-11 items-center gap-2.5 rounded-[9px] border border-mm-line px-3 text-sm font-semibold text-mm-ink">
              <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-mm-lilac" />
              1,150
            </span>
          </div>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>True or false</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            A rhombus always has four equal sides.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex min-h-11 items-center rounded-[9px] border-2 border-mm-brand bg-mm-tint-soft px-4 text-sm font-bold text-mm-ink">
              True
            </span>
            <span className="inline-flex min-h-11 items-center rounded-[9px] border border-mm-line px-4 text-sm font-semibold text-mm-ink">
              False
            </span>
          </div>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>Dropdown</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            The poem’s tone is best described as …
          </p>
          <span className="flex min-h-11 items-center justify-between rounded-[9px] border border-mm-line bg-mm-page px-3.5 text-[14.5px] font-semibold text-mm-ink">
            Choose one <span aria-hidden="true" className="font-extrabold text-mm-brand">▾</span>
          </span>
        </div>
      </div>
    </>
  );
}

function EnterExamples() {
  return (
    <>
      <div className={exampleShell}>
        <ExampleHeader label="Number entry · Year 5 numeracy" note="Submitted · feedback shown" />
        <p className="text-[clamp(17px,1.5vw,20px)] font-bold leading-[1.4] text-mm-ink">
          A netball club sells 148 tickets at $6 each. How much do they take?
        </p>
        <div className="flex max-w-[280px] items-center gap-2.5">
          <span className="text-[17px] font-bold text-mm-ink">$</span>
          <span className="flex min-h-[52px] flex-1 items-center rounded-[10px] border-2 border-mm-brand px-3.5 text-[17px] font-bold text-mm-ink">
            888
          </span>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-mm-alert-line bg-mm-alert px-[18px] py-4">
          <span aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-mm-coral" />
          <p className="text-[14.5px] leading-[1.55] text-mm-ink">
            <strong>Not correct.</strong> 148 × 6 = 888 is right for the multiplication, but the question asks for
            the total in dollars — check the decimal place before submitting.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={miniCard}>
          <p className={miniKicker}>Fill in the blank</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            The dog wagged{" "}
            <span className="inline-flex min-h-9 items-center border-b-2 border-mm-brand bg-mm-tint-soft px-3 font-bold">
              its
            </span>{" "}
            tail.
          </p>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>Short answer</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            Explain your reasoning in one or two sentences.
          </p>
          <span className="flex min-h-16 items-start rounded-[9px] border border-mm-line bg-mm-page p-3 text-[13.5px] text-mm-quiet">
            Type your answer…
          </span>
          <p className="text-[12.5px] text-mm-muted">Marked against a model answer, with the reasoning shown.</p>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>Essay</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            Write a persuasive paragraph arguing for or against school uniforms.
          </p>
          <span className="flex min-h-[88px] items-start rounded-[9px] border border-mm-line bg-mm-page p-3 text-[13.5px] text-mm-quiet">
            Plan, then write…
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-8 items-center rounded-[7px] border border-mm-tint-line bg-mm-tint-soft px-2.5 text-xs font-bold text-mm-brand">
              Checklist
            </span>
            <span className="text-[12.5px] text-mm-muted">Autosaves as they write</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ArrangeExamples() {
  return (
    <>
      <div className={exampleShell}>
        <ExampleHeader label="Matching · Year 5 language conventions" note="Two of four matched" />
        <p className="text-[clamp(17px,1.5vw,20px)] font-bold leading-[1.4] text-mm-ink">
          Match each word to its part of speech.
        </p>
        <div className="grid gap-2.5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span className="flex min-h-[52px] items-center rounded-[10px] border-2 border-mm-brand bg-mm-tint-soft px-4 text-[15.5px] font-bold text-mm-ink">
              quickly
            </span>
            <span aria-hidden="true" className="h-0.5 w-7 bg-mm-brand" />
            <span className="flex min-h-[52px] items-center rounded-[10px] border-2 border-mm-brand bg-mm-tint-soft px-4 text-[15.5px] font-bold text-mm-ink">
              adverb <span className="ml-auto text-xs font-bold text-mm-brand">Matched</span>
            </span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <span className="flex min-h-[52px] items-center rounded-[10px] border border-mm-line px-4 text-[15.5px] font-semibold text-mm-ink">
              harbour
            </span>
            <span aria-hidden="true" className="h-0.5 w-7 bg-mm-line-quiet" />
            <span className="flex min-h-[52px] items-center rounded-[10px] border border-dashed border-mm-lilac px-4 text-[15px] font-semibold text-mm-quiet">
              Unanswered
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={miniCard}>
          <p className={miniKicker}>Ordering</p>
          <span className="flex min-h-11 items-center rounded-lg border border-mm-tint-line bg-mm-tint-soft px-3 text-sm font-bold text-mm-ink">
            1. 0.09
          </span>
          <span className="flex min-h-11 items-center rounded-lg border border-mm-tint-line bg-mm-tint-soft px-3 text-sm font-bold text-mm-ink">
            2. 0.4
          </span>
          <span className="flex min-h-11 items-center rounded-lg border border-dashed border-mm-lilac bg-mm-page px-3 text-sm font-semibold text-mm-quiet">
            3. Empty
          </span>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>Drag and drop</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            Drop each shape into the matching column. Keyboard users can pick up and place with Space and the
            arrow keys.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="grid min-h-14 place-items-center rounded-[9px] border border-dashed border-mm-lilac bg-mm-page text-[13px] font-semibold text-mm-quiet">
              Symmetrical
            </span>
            <span className="grid min-h-14 place-items-center rounded-[9px] border-2 border-mm-brand bg-mm-tint-soft text-[13px] font-bold text-mm-brand">
              Drop target
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function ExploreExamples() {
  return (
    <>
      <div className={exampleShell}>
        <ExampleHeader label="Reading comprehension · Year 5" note="Passage and question shown together" />
        <div className="rounded-xl border border-mm-line bg-mm-page p-[18px]">
          <p className="text-[15px] leading-[1.7] text-mm-ink-soft">
            The tide had gone out further than Nita had ever seen. Where the water usually reached the seawall,
            there was now a wide plain of ribbed sand, and the fishing boats sat tilted like sleeping animals. She
            waited for someone else to notice.
          </p>
        </div>
        <p className="text-[clamp(16px,1.4vw,19px)] font-bold leading-[1.4] text-mm-ink">
          What does the description of the boats suggest about the scene?
        </p>
        <div className="grid gap-2.5">
          <span className="flex min-h-[52px] items-center gap-[11px] rounded-[11px] border border-mm-line px-4 text-[15.5px] font-semibold text-mm-ink">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-md border-2 border-mm-lilac text-xs font-extrabold text-mm-quiet"
            >
              A
            </span>
            It is dangerous
          </span>
          <span className="flex min-h-[52px] items-center gap-[11px] rounded-[11px] border-2 border-mm-brand bg-mm-tint-soft px-4 text-[15.5px] font-bold text-mm-ink">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-md bg-mm-brand text-xs font-extrabold text-white"
            >
              B
            </span>
            It is unusually still
            <span className="ml-auto text-xs font-bold text-mm-brand">Selected</span>
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={miniCard}>
          <p className={miniKicker}>Label a diagram</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            Drag each label to the correct part of the diagram.
          </p>
          <div
            role="img"
            aria-label="Diagram of a triangle with three unlabelled vertices"
            className="grid grid-cols-3 gap-2"
          >
            <span className="aspect-square rounded bg-mm-track" />
            <span
              className="aspect-square bg-mm-brand"
              style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
            />
            <span className="aspect-square rounded bg-mm-track" />
          </div>
        </div>

        <div className={miniCard}>
          <p className={miniKicker}>Hotspot</p>
          <p className="text-[14.5px] font-semibold leading-[1.5] text-mm-ink">
            Select the part of the chart where sales fell.
          </p>
          <div
            role="img"
            aria-label="Bar chart: Monday 40, Tuesday 30, Wednesday 60, Thursday 85, Friday 50. Wednesday is the selected hotspot."
            className="flex h-[70px] items-end gap-[7px]"
          >
            {[
              [40, false],
              [30, false],
              [60, true],
              [85, false],
              [50, false],
            ].map(([height, selected], index) => (
              <span
                key={index}
                className={`flex-1 rounded-[3px] ${
                  selected ? "bg-mm-coral outline outline-2 outline-offset-2 outline-mm-brand" : "bg-mm-lilac"
                }`}
                style={{ height: `${height as number}%` }}
              />
            ))}
          </div>
          <p className="text-[12.5px] text-mm-muted">Mon 40 · Tue 30 · Wed 60 (selected) · Thu 85 · Fri 50</p>
        </div>
      </div>
    </>
  );
}
