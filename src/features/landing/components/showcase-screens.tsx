import type { ReactNode } from "react";

import type { ShowcaseScreen } from "../content";

/**
 * The nine illustrative in-app views behind the "Inside the platform"
 * tabs. Every one is static markup, never a screenshot: it stays legible
 * at any width, is readable by a screen reader, and cannot silently go
 * stale as a picture would.
 *
 * All names, scores, dates and progress states shown are illustrative —
 * the section intro says so, and each screen that shows figures repeats
 * it locally.
 */

const cardBase = "rounded-[13px] border border-mm-line p-[18px]";
const chipOn =
  "inline-flex min-h-11 items-center rounded-[9px] bg-mm-brand px-[15px] text-[13.5px] font-bold text-white";
const chipOff =
  "inline-flex min-h-11 items-center rounded-[9px] border border-mm-line bg-mm-page px-[15px] text-[13.5px] font-semibold text-mm-ink-soft";
const kicker = "text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted";
const kickerBrand = "text-[11.5px] font-bold uppercase tracking-[0.08em] text-mm-brand";
const screenTitle = "text-[clamp(21px,2vw,28px)] font-extrabold tracking-[-0.03em] text-mm-ink";
const pseudoButton =
  "inline-flex min-h-11 items-center rounded-[9px] border border-mm-line px-4 text-sm font-bold text-mm-ink";
const pseudoPrimary =
  "inline-flex min-h-11 items-center rounded-[10px] bg-mm-brand px-[22px] text-[15px] font-bold text-white";

function Screen({ children }: { children: ReactNode }) {
  return <div className="grid gap-5">{children}</div>;
}

function StudentHome() {
  return (
    <Screen>
      <div>
        <h4 className={screenTitle}>Good afternoon, Mia.</h4>
        <p className="mt-2 text-[15.5px] text-mm-muted">Pick up where you left off, or start something new.</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[14px] bg-mm-brand p-5 text-white">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/70">Continue learning</p>
          <p className="mt-2.5 font-display text-[19px] font-extrabold tracking-[-0.02em]">
            Fractions on a number line
          </p>
          <p className="mt-1.5 text-[13.5px] text-white/80">Skill lesson, part 2 of 3</p>
          <span className="mt-4 inline-flex min-h-11 items-center rounded-[9px] bg-white/15 px-4 text-sm font-bold">
            Resume lesson
          </span>
        </div>

        <div className="rounded-[14px] border border-mm-line bg-mm-page p-5">
          <p className={kicker}>Practice</p>
          <p className="mt-2.5 text-[17px] font-bold tracking-[-0.02em] text-mm-ink">Choose a skill or mix it up</p>
          <p className="mt-1.5 text-[13.5px] text-mm-muted">By year, subject, single skill or mixed practice.</p>
          <span className={`mt-4 ${pseudoButton}`}>Choose practice</span>
        </div>

        <div className="rounded-[14px] border border-mm-line bg-mm-page p-5">
          <p className={kicker}>Exam preparation</p>
          <p className="mt-2.5 text-[17px] font-bold tracking-[-0.02em] text-mm-ink">NAPLAN-style simulation</p>
          <p className="mt-1.5 text-[13.5px] text-mm-muted">Full length, timed, with review before submit.</p>
          <span className={`mt-4 ${pseudoButton}`}>View simulations</span>
        </div>
      </div>

      <div>
        <p className={`${kicker} mb-2.5`}>Recent activity — illustrative</p>
        <div className="overflow-hidden rounded-xl border border-mm-line">
          {[
            ["Skill lesson — equivalent fractions", "Learning", "Completed"],
            ["Reading — inference & evidence", "Practice", "9 / 10"],
            ["NAPLAN-style numeracy set", "Exam-style", "18 / 32"],
          ].map(([title, mode, result], index) => (
            <div
              key={title}
              className={`grid grid-cols-[1.7fr_1fr_auto] items-center gap-3 px-4 py-3.5 ${
                index < 2 ? "border-b border-mm-line-soft" : ""
              }`}
            >
              <span className="text-[14.5px] font-semibold text-mm-ink">{title}</span>
              <span className="text-[13px] text-mm-muted">{mode}</span>
              <span className="text-[13px] font-bold text-mm-brand">{result}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function LearningHubScreen() {
  return (
    <Screen>
      <div>
        <h4 className={screenTitle}>Learning Hub</h4>
        <p className="mt-2 text-[15.5px] text-mm-muted">
          Browse by year, subject or skill. Every entry has an explanation, worked examples and related practice.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={chipOn}>Year 5</span>
        <span className={chipOff}>Mathematics</span>
        <span className={chipOff}>Fractions</span>
        <span className={chipOff}>Needs more support</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Explanation", "What a fraction of a whole means", "Read · then two worked examples", false],
          ["Worked example", "Placing eighths on a number line", "Step by step, with the reasoning shown", false],
          ["Related practice", "Fractions on a number line", "Practice this skill straight after the lesson", true],
          ["Singapore Maths", "Model drawing for part–whole", "A second way to see the same idea", false],
        ].map(([label, title, body, highlight]) => (
          <div
            key={title as string}
            className={
              highlight
                ? "grid gap-2 rounded-[13px] border-2 border-mm-brand bg-mm-tint-soft p-[18px]"
                : `grid gap-2 ${cardBase}`
            }
          >
            <p className={highlight ? kickerBrand : kicker}>{label as string}</p>
            <p className="text-base font-bold tracking-[-0.02em] text-mm-ink">{title as string}</p>
            <p className="text-[13.5px] leading-[1.5] text-mm-muted">{body as string}</p>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function ChoosePractice() {
  return (
    <Screen>
      <div>
        <h4 className={screenTitle}>Choose practice</h4>
        <p className="mt-2 text-[15.5px] text-mm-muted">
          Start from a year, a subject, a single skill, or mix skills together.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={chipOn}>By skill</span>
        <span className={chipOff}>By year</span>
        <span className={chipOff}>By subject</span>
        <span className={chipOff}>Mixed practice</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Selected", "Fractions on a number line", "Mathematics · Year 5", true, true],
          ["Practised before", "Place value to millions", "Mathematics · Year 5", false, false],
          ["Needs more support", "Area & perimeter", "Mathematics · Year 5", false, true],
          ["Not started", "Angles & turns", "Mathematics · Year 5", false, false],
        ].map(([label, title, meta, selected, brandLabel]) => (
          <div
            key={title as string}
            className={
              selected
                ? "rounded-[13px] border-2 border-mm-brand bg-mm-tint-soft p-[18px]"
                : cardBase
            }
          >
            <p className={brandLabel ? kickerBrand : kicker}>{label as string}</p>
            <p className="mt-2.5 text-base font-bold tracking-[-0.02em] text-mm-ink">{title as string}</p>
            <p className="mt-1.5 text-[13px] text-mm-muted">{meta as string}</p>
          </div>
        ))}
      </div>

      <fieldset className="m-0 grid min-w-0 gap-3 rounded-xl border border-mm-line px-[18px] py-4">
        <legend className={`${kicker} px-1.5`}>Session settings</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className={chipOn}>Untimed</span>
          <span className={chipOff}>Timed</span>
          <span className="text-[13.5px] text-mm-muted">
            Session length is flexible — stop and resume at any point.
          </span>
        </div>
      </fieldset>

      <span className={`justify-self-start ${pseudoPrimary}`}>Start practice</span>
    </Screen>
  );
}

function NumberLine() {
  return (
    <figure className="m-0 rounded-xl border border-mm-line bg-mm-page px-5 py-6">
      <div
        role="img"
        aria-label="A number line from 0 to 1 divided into eight equal parts. An arrow points to the fifth mark after zero."
        className="relative h-[52px]"
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-[30px] h-0.5 bg-mm-ink" />
        <span aria-hidden="true" className="absolute left-0 top-[22px] h-[18px] w-0.5 bg-mm-ink" />
        {[12.5, 25, 37.5, 50, 62.5, 75, 87.5].map((left) => (
          <span
            key={left}
            aria-hidden="true"
            className="absolute top-[26px] h-2.5 w-0.5 bg-mm-quiet"
            style={{ left: `${left}%` }}
          />
        ))}
        <span aria-hidden="true" className="absolute right-0 top-[22px] h-[18px] w-0.5 bg-mm-ink" />
        <span
          aria-hidden="true"
          className="absolute top-0 -ml-1.5 h-0 w-0 border-x-[7px] border-t-[11px] border-x-transparent border-t-mm-coral"
          style={{ left: "62.5%" }}
        />
        <span aria-hidden="true" className="absolute -left-1 top-9 text-[13px] font-bold text-mm-ink">
          0
        </span>
        <span aria-hidden="true" className="absolute -right-1 top-9 text-[13px] font-bold text-mm-ink">
          1
        </span>
      </div>
      <figcaption className="mt-2.5 text-[13px] text-mm-muted">
        Number line from 0 to 1 in eighths; the arrow sits on the fifth mark.
      </figcaption>
    </figure>
  );
}

function PracticeMode() {
  return (
    <div className="grid max-w-[760px] gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className={kicker}>Practice mode · untimed · feedback after submit</p>
        <p className="text-[13px] font-bold text-mm-brand">Question 5 of 12</p>
      </div>

      <div
        role="img"
        aria-label="Progress: 4 questions answered, question 5 in progress, 7 remaining"
        className="grid h-1.5 grid-cols-12 gap-[3px]"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className={`rounded-sm ${index < 4 ? "bg-mm-brand" : index === 4 ? "bg-mm-coral" : "bg-mm-track"}`}
          />
        ))}
      </div>

      <h4 className="text-[clamp(19px,1.7vw,24px)] font-bold leading-[1.35] tracking-[-0.02em] text-mm-ink">
        Which fraction does the arrow point to on the number line?
      </h4>

      <NumberLine />

      <div className="grid gap-2.5 sm:grid-cols-2">
        {[
          ["A", "3/4", false],
          ["B", "5/8", true],
          ["C", "2/3", false],
          ["D", "5/6", false],
        ].map(([letter, value, selected]) => (
          <span
            key={letter as string}
            className={`flex min-h-14 items-center gap-[11px] rounded-[11px] px-4 text-base ${
              selected
                ? "border-2 border-mm-brand bg-mm-tint-soft font-bold text-mm-ink"
                : "border border-mm-line font-semibold text-mm-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-[26px] w-[26px] place-items-center rounded-md text-xs font-extrabold ${
                selected ? "bg-mm-brand text-white" : "border-2 border-mm-lilac text-mm-muted"
              }`}
            >
              {letter as string}
            </span>
            {value as string}
            {selected && <span className="ml-auto text-xs font-bold text-mm-brand">Selected</span>}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className={pseudoPrimary}>Submit answer</span>
        <span className="inline-flex min-h-11 items-center rounded-[10px] border border-mm-line px-4 text-[15px] font-semibold text-mm-ink-soft">
          Skip for now
        </span>
      </div>
    </div>
  );
}

function ExamSimulation() {
  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mm-ink px-4 py-3.5 text-white">
        <p className="text-[13px] font-bold uppercase tracking-[0.06em]">
          Exam simulation · NAPLAN-style numeracy
        </p>
        <p className="text-sm font-bold">
          Section 2 of 3 · <span className="text-[#ffc9ae]">18:24 remaining</span>
        </p>
      </div>

      <p className="max-w-[760px] text-sm leading-[1.6] text-mm-muted">
        Realistic instructions are shown before the session begins. Answers save automatically, questions can be
        flagged, and a review screen appears before final submission.
      </p>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="grid gap-3.5 rounded-[14px] border border-mm-line p-5">
          <p className={kicker}>Section navigation</p>
          <div className="grid gap-2">
            <span className="flex min-h-11 items-center justify-between rounded-[9px] border border-mm-tint-line bg-mm-tint-soft px-3.5 text-sm font-bold text-mm-ink">
              Section 1 · Reading <span className="text-[12.5px] text-mm-brand">Submitted</span>
            </span>
            <span className="flex min-h-11 items-center justify-between rounded-[9px] border-2 border-mm-brand bg-white px-3.5 text-sm font-bold text-mm-ink">
              Section 2 · Numeracy <span className="text-[12.5px] text-mm-brand">In progress</span>
            </span>
            <span className="flex min-h-11 items-center justify-between rounded-[9px] border border-mm-line-quiet bg-mm-surface-quiet px-3.5 text-sm font-semibold text-mm-quiet">
              Section 3 · Language <span className="text-[12.5px] font-bold">Locked until section 2 ends</span>
            </span>
          </div>
        </div>

        <div className="grid gap-3.5 rounded-[14px] border border-mm-line p-5">
          <p className={kicker}>Question progress</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["1", "done"],
              ["2", "done"],
              ["3⚑", "flagged"],
              ["4", "done"],
              ["5", "current"],
              ["6", "todo"],
              ["7", "todo"],
              ["8", "todo"],
            ].map(([label, state]) => (
              <span
                key={label as string}
                className={`grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold ${
                  state === "done"
                    ? "bg-mm-brand text-white"
                    : state === "flagged"
                      ? "border-2 border-mm-coral bg-white text-mm-ink"
                      : state === "current"
                        ? "border-2 border-mm-brand bg-white text-mm-ink"
                        : "border border-mm-line-quiet bg-mm-surface-quiet text-mm-quiet"
                }`}
              >
                {label as string}
              </span>
            ))}
          </div>
          <p className="text-[13px] leading-[1.55] text-mm-muted">
            Filled = answered, outlined = current, flag icon = flagged for review, pale = not yet answered. Each
            state is announced in text, not colour alone.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-mm-line bg-mm-page p-[18px]">
        <span className={`bg-white ${pseudoButton}`}>Flag for review</span>
        <span className={`bg-white ${pseudoButton}`}>Review all answers</span>
        <span className="inline-flex min-h-11 items-center rounded-[10px] bg-mm-ink px-5 text-[14.5px] font-bold text-white">
          Submit section
        </span>
        <span className="text-[13px] text-mm-muted">Progress saved automatically at 4:12 pm</span>
      </div>

      <p className="max-w-[760px] text-[13px] leading-[1.6] text-mm-muted">
        Simulations use original questions written by MindMosaic. They are not official examinations or past
        papers.
      </p>
    </Screen>
  );
}

function AnswerFeedback() {
  return (
    <div className="grid max-w-[760px] gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-mm-alert-line bg-mm-alert px-[18px] py-4">
        <span aria-hidden="true" className="mt-0.5 h-[26px] w-[26px] shrink-0 rounded-[7px] bg-mm-coral" />
        <div>
          <p className="text-[15.5px] font-bold text-mm-ink">Not correct — let’s look at it together</p>
          <p className="mt-1 text-[13.5px] text-mm-ink">
            You answered <strong>3/4</strong>. The correct answer is <strong>5/8</strong>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[14px] border border-mm-line p-[22px]">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Worked explanation</p>
        <ol className="m-0 grid list-decimal gap-2.5 pl-5 text-[15.5px] leading-[1.6] text-mm-ink-soft">
          <li>
            Count the equal spaces between 0 and 1. There are eight, so each step is <strong>1/8</strong>.
          </li>
          <li>Count the steps from 0 to the arrow. The arrow sits on the fifth mark.</li>
          <li>
            Five steps of 1/8 gives <strong>5/8</strong>.
          </li>
        </ol>
        <div
          role="img"
          aria-label="Five of eight equal parts shaded, showing five eighths"
          className="grid h-[22px] grid-cols-8 gap-[3px]"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={`rounded-[3px] ${index < 5 ? "bg-mm-brand" : "bg-mm-track"}`} />
          ))}
        </div>
        <p className="text-sm text-mm-muted">A common slip is counting the marks instead of the spaces.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className={pseudoPrimary}>Next question</span>
        <span className="inline-flex min-h-11 items-center rounded-[10px] border border-mm-line px-4 text-[15px] font-semibold text-mm-ink-soft">
          Retry this question
        </span>
        <span className="inline-flex min-h-11 items-center rounded-[10px] border border-mm-line px-4 text-[15px] font-semibold text-mm-ink-soft">
          Open the skill lesson
        </span>
      </div>

      <p className="text-[13px] text-mm-muted">
        In exam simulation mode, feedback and explanations are held back until the whole session is submitted.
      </p>
    </div>
  );
}

function SessionResults() {
  const outcomes = [
    ["1", true],
    ["2", true],
    ["3", true],
    ["4", false],
    ["5", false],
    ["6", true],
    ["7", true],
    ["8", true],
    ["9", false],
    ["10", true],
  ] as const;

  return (
    <Screen>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
          Session results · illustrative
        </p>
        <h4 className={`mt-2.5 ${screenTitle}`}>Nine of twelve, and two skills moved forward.</h4>
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-mm-line bg-mm-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["9/12", "Correct"],
          ["3", "To revisit"],
          ["2", "Skills improved"],
          ["Practice", "Session type"],
        ].map(([value, label]) => (
          <div key={label} className="bg-white p-[18px]">
            <p className="font-display text-2xl font-extrabold text-mm-ink">{value}</p>
            <p className="mt-1 text-[13px] text-mm-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-[14px] border border-mm-line bg-mm-page p-5">
          <p className={`${kicker} mb-3`}>Question by question</p>
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map(([label, correct]) => (
              <span
                key={label}
                aria-label={`Question ${label}: ${correct ? "correct" : "incorrect"}`}
                className={`grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold ${
                  correct ? "bg-mm-brand text-white" : "border-2 border-mm-coral bg-white text-mm-ink"
                }`}
              >
                {label}
                {correct ? "✓" : "×"}
              </span>
            ))}
          </div>
          <p className="mt-3.5 text-[13px] text-mm-muted">
            Each square carries a tick or cross as well as a colour, and a label for screen readers.
          </p>
        </div>

        <div className="rounded-[14px] border border-mm-tint-line bg-mm-tint-soft p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">What you can do next</p>
          <div className="grid gap-2.5">
            {[
              "Review the three explanations",
              "Open the skill lesson for eighths",
              "Practise this skill again",
            ].map((item) => (
              <div key={item} className="rounded-[10px] border border-mm-tint-line bg-white px-3.5 py-3">
                <p className="text-[14.5px] font-bold text-mm-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

function ProgressInsights({ yearLabel }: { yearLabel: string }) {
  const skills = [
    ["Number & place value", "Developing well", 82, "bg-mm-brand", "text-mm-brand"],
    ["Reading — inference", "Developing well", 74, "bg-mm-brand", "text-mm-brand"],
    ["Fractions", "Getting there", 56, "bg-mm-brand-mid", "text-mm-muted"],
    ["Measurement", "Needs support", 34, "bg-mm-coral", "text-mm-brand"],
  ] as const;

  return (
    <Screen>
      <div>
        <h4 className={screenTitle}>Progress insights</h4>
        <p className="mt-2 text-[15.5px] text-mm-muted">
          {yearLabel} · learning, practice and exam-style sessions together · illustrative data
        </p>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-[14px] border border-mm-line p-5">
          <p className={`${kicker} mb-4`}>Skills by status</p>
          <div className="grid gap-3.5">
            {skills.map(([name, status, value, fill, statusColor]) => (
              <div key={name} className="grid gap-1.5">
                <div className="flex justify-between text-[13.5px] font-semibold text-mm-ink">
                  <span>{name}</span>
                  <span className={statusColor}>{status}</span>
                </div>
                <div
                  role="img"
                  aria-label={`${name}: ${status.toLowerCase()}`}
                  className="h-2 overflow-hidden rounded bg-mm-track"
                >
                  <span className={`block h-full ${fill}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-mm-line p-5">
          <p className={`${kicker} mb-4`}>Practice history — four weeks</p>
          <table className="w-full border-collapse text-[13.5px]">
            <caption className="pb-2.5 text-left text-[13px] text-mm-muted">
              Sessions completed by week and type
            </caption>
            <thead>
              <tr>
                {["Week", "Learning", "Practice", "Exam-style"].map((heading, index) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`border-b border-mm-line py-2 text-[12.5px] text-mm-muted ${
                      index === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Week 1", 2, 3, 0],
                ["Week 2", 1, 4, 1],
                ["Week 3", 3, 2, 0],
                ["Week 4", 1, 3, 1],
              ].map(([week, learning, practice, exam]) => (
                <tr key={week as string}>
                  <th scope="row" className="py-2.5 text-left font-semibold text-mm-ink">
                    {week}
                  </th>
                  <td className="py-2.5 text-right text-mm-ink">{learning}</td>
                  <td className="py-2.5 text-right text-mm-ink">{practice}</td>
                  <td className="py-2.5 text-right text-mm-ink">{exam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Screen>
  );
}

function ParentView() {
  return (
    <Screen>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Parent view · illustrative</p>
          <h4 className={`mt-2.5 ${screenTitle}`}>Your family this fortnight</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-lg bg-mm-brand px-3.5 text-[13.5px] font-bold text-white">
            Mia · Year 5
          </span>
          <span className="inline-flex min-h-11 items-center rounded-lg border border-mm-line bg-mm-page px-3.5 text-[13.5px] font-semibold text-mm-ink-soft">
            Ari · Year 3
          </span>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        <div className="rounded-[14px] border border-mm-tint-line bg-mm-tint-soft p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Developing well</p>
          <ul className="mt-3 grid gap-2 text-[14.5px] font-semibold text-mm-ink">
            <li>Number &amp; place value</li>
            <li>Reading — inference</li>
            <li>Spelling patterns</li>
          </ul>
        </div>

        <div className="rounded-[14px] border border-mm-alert-line bg-mm-alert p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Needs support</p>
          <ul className="mt-3 grid gap-2 text-[14.5px] font-semibold text-mm-ink">
            <li>Measurement — area</li>
            <li>Fractions on a number line</li>
          </ul>
        </div>

        <div className="rounded-[14px] border border-mm-line p-5">
          <p className={kicker}>Activity</p>
          <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-mm-ink">14 sessions</p>
          <p className="mt-1 text-[13.5px] text-mm-muted">
            Learning, practice and one exam-style session
          </p>
        </div>
      </div>

      <div className="rounded-[14px] border border-mm-line p-5">
        <p className={`${kicker} mb-3`}>Skills to revisit</p>
        <div className="grid gap-2.5">
          {[
            ["Area & perimeter — skill lesson available", "Needs support", "bg-mm-coral"],
            ["Fractions on a number line — practice again", "Getting there", "bg-mm-brand-mid"],
          ].map(([title, status, dot]) => (
            <div
              key={title}
              className="flex flex-wrap items-center gap-3 rounded-[10px] border border-mm-line bg-mm-page px-4 py-3.5"
            >
              <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 ${dot}`} />
              <span className="min-w-[200px] flex-1 text-[14.5px] font-semibold text-mm-ink">{title}</span>
              <span className="text-[13px] text-mm-muted">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function ShowcaseScreenBody({ screen }: { screen: ShowcaseScreen }) {
  switch (screen) {
    case "home":
      return <StudentHome />;
    case "hub":
      return <LearningHubScreen />;
    case "choose":
      return <ChoosePractice />;
    case "practice":
      return <PracticeMode />;
    case "exam":
      return <ExamSimulation />;
    case "feedback":
      return <AnswerFeedback />;
    case "results":
      return <SessionResults />;
    case "progress":
      return <ProgressInsights yearLabel="Year 5" />;
    case "parent":
      return <ParentView />;
  }
}
