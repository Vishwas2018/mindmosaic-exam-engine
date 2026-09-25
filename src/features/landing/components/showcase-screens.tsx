import type { ReactNode } from "react";

import type { ShowcaseScreen } from "../content";

/**
 * The four real in-app views behind the "Inside the platform" tabs.
 * Every one is static semantic markup matching real product routes:
 * 1. Student Home (/student)
 * 2. Concept Lesson (/student/learn/lessons/VC2M5N03)
 * 3. Practice & Feedback (/practice/session)
 * 4. Parent Insights (/parent)
 *
 * All names, scores, dates and progress states shown are illustrative.
 */

const kicker = "text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-muted";
const kickerBrand = "text-[11.5px] font-bold uppercase tracking-[0.08em] text-mm-brand";
const screenTitle = "text-[clamp(21px,2vw,28px)] font-extrabold tracking-[-0.03em] text-mm-ink";
const pseudoButton =
  "inline-flex min-h-11 items-center rounded-xl border border-mm-line bg-white px-4 text-sm font-bold text-mm-ink hover:border-mm-brand";

function Screen({ children }: { children: ReactNode }) {
  return <div className="grid gap-5">{children}</div>;
}

/** View 1: Student Home (/student) */
function StudentHomeScreen() {
  return (
    <Screen>
      <div>
        <h4 className={screenTitle}>Good afternoon, Mia.</h4>
        <p className="mt-2 text-[15.5px] text-mm-muted">Pick up where you left off, or start something new.</p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-mm-brand p-5 text-white shadow-sm">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/75">Start here</p>
          <p className="mt-2.5 font-display text-[19px] font-extrabold tracking-[-0.02em]">
            Fractions on a number line
          </p>
          <p className="mt-1.5 text-[13.5px] text-white/80">Skill lesson · VC2M5N03</p>
          <span className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white/15 px-4 text-sm font-bold text-white hover:bg-white/25">
            Resume lesson
          </span>
        </div>

        <div className="rounded-2xl border border-mm-line bg-mm-page p-5 shadow-sm">
          <p className={kicker}>Practice</p>
          <p className="mt-2.5 text-[17px] font-bold tracking-[-0.02em] text-mm-ink">Start NAPLAN-style Practice</p>
          <p className="mt-1.5 text-[13.5px] text-mm-muted">Grade 5 Numeracy · 32 original questions with feedback.</p>
          <span className={`mt-4 ${pseudoButton}`}>Choose practice</span>
        </div>

        <div className="rounded-2xl border border-mm-line bg-mm-page p-5 shadow-sm">
          <p className={kicker}>Exam simulation</p>
          <p className="mt-2.5 text-[17px] font-bold tracking-[-0.02em] text-mm-ink">ICAS-style Mathematics</p>
          <p className="mt-1.5 text-[13.5px] text-mm-muted">Full-length timed assessment with review screen.</p>
          <span className={`mt-4 ${pseudoButton}`}>View simulations</span>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className={kicker}>Recent activity — illustrative</p>
          <span className="text-xs text-mm-muted">Route: /student</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-mm-line">
          {[
            ["Fractions on a number line (VC2M5N03)", "Learning Hub", "5 / 5"],
            ["Reading: Inference & evidence", "Practice", "9 / 10"],
            ["NAPLAN-style numeracy set", "Exam simulation", "18 / 32"],
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

/** View 2: Concept Lesson (/student/learn/lessons/VC2M5N03) */
function ConceptLessonScreen() {
  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mm-line pb-4">
        <div>
          <span className="inline-block rounded-md bg-mm-tint px-2.5 py-1 text-xs font-bold text-mm-brand">
            VC2M5N03 · Level 5 Mathematics
          </span>
          <h4 className={`mt-2 ${screenTitle}`}>Fractions on a Number Line</h4>
        </div>
        <span className="text-xs font-semibold text-mm-muted">Route: /student/learn/lessons/VC2M5N03</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-mm-line/80 bg-white p-5 shadow-sm">
          <p className={kickerBrand}>1. Concept Explanation</p>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-mm-ink-soft">
            A fraction represents a specific position on a number line. When dividing the whole unit between 0 and 1 into
            8 equal intervals, each step represents <strong className="text-mm-ink">1/8</strong>.
          </p>

          <div className="mt-4 rounded-xl border border-mm-line bg-mm-page p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-mm-muted">Number line representation</p>
            <div className="mt-3 flex flex-col items-center">
              <svg viewBox="0 0 360 60" className="w-full max-w-[340px] text-mm-ink" aria-label="Number line from 0 to 1 with eighths marked">
                <line x1="20" y1="30" x2="340" y2="30" stroke="currentColor" strokeWidth="2.5" />
                <line x1="20" y1="20" x2="20" y2="40" stroke="currentColor" strokeWidth="2" />
                <line x1="60" y1="24" x2="60" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="100" y1="24" x2="100" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="140" y1="24" x2="140" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="180" y1="22" x2="180" y2="38" stroke="currentColor" strokeWidth="2" />
                <line x1="220" y1="20" x2="220" y2="40" stroke="#CC2429" strokeWidth="3" />
                <line x1="260" y1="24" x2="260" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="300" y1="24" x2="300" y2="36" stroke="currentColor" strokeWidth="1.5" />
                <line x1="340" y1="20" x2="340" y2="40" stroke="currentColor" strokeWidth="2" />
                <circle cx="220" cy="30" r="5" fill="#CC2429" />
                <text x="20" y="55" fontSize="11" textAnchor="middle" fill="#5c5765" fontWeight="bold">0</text>
                <text x="180" y="55" fontSize="11" textAnchor="middle" fill="#5c5765" fontWeight="bold">1/2</text>
                <text x="220" y="55" fontSize="11" textAnchor="middle" fill="#CC2429" fontWeight="bold">5/8</text>
                <text x="340" y="55" fontSize="11" textAnchor="middle" fill="#5c5765" fontWeight="bold">1</text>
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-mm-line/80 bg-white p-5 shadow-sm">
          <p className={kicker}>2. Step-by-Step Worked Example</p>
          <p className="mt-2 text-[14.5px] font-bold text-mm-ink">
            Example: Locate 5/8 on the number line.
          </p>
          <ol className="mt-3 grid gap-2.5 text-[13.5px] text-mm-muted">
            <li className="flex items-start gap-2">
              <span className="font-bold text-mm-brand">Step 1:</span>
              <span>Confirm the unit is divided into 8 equal parts (eighths).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-mm-brand">Step 2:</span>
              <span>Start at zero and count 5 equal increments to the right.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-mm-brand">Step 3:</span>
              <span>The point is past 1/2 (4/8) and before 3/4 (6/8).</span>
            </li>
          </ol>
          <div className="mt-4 rounded-xl border border-coral-border bg-coral-light p-3 text-xs font-semibold text-mm-coral-text">
            Key Rule: The denominator (8) tells how many equal parts make the whole; the numerator (5) tells how many steps to take.
          </div>
        </div>
      </div>
    </Screen>
  );
}

/** View 3: Practice & Feedback (/practice/session) */
function PracticeFeedbackScreen() {
  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mm-line pb-3">
        <div>
          <span className="inline-block rounded-md bg-mm-tint px-2.5 py-1 text-xs font-bold text-mm-brand">
            Practice Mode · Grade 5 Numeracy
          </span>
          <h4 className="mt-1 text-base font-bold text-mm-ink">Question 3 of 10</h4>
        </div>
        <span className="text-xs font-semibold text-mm-muted">Route: /practice/session</span>
      </div>

      <div className="rounded-2xl border border-mm-line bg-mm-page p-5 shadow-sm">
        <p className="text-[16px] font-bold text-mm-ink">
          Which fraction is equivalent to 3/4?
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { option: "A", text: "4/5", selected: false, correct: false },
            { option: "B", text: "6/8", selected: true, correct: true },
            { option: "C", text: "5/8", selected: false, false: true },
            { option: "D", text: "9/10", selected: false, correct: false },
          ].map((item) => (
            <div
              key={item.option}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                item.selected
                  ? "border-mm-brand bg-white text-mm-brand shadow-sm ring-2 ring-mm-brand/20"
                  : "border-mm-line bg-white text-mm-ink-soft"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                  item.selected ? "bg-mm-brand text-white" : "bg-mm-tint text-mm-ink"
                }`}
              >
                {item.option}
              </span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Immediate explanation panel */}
        <div className="mt-5 rounded-xl border border-mm-brand/30 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-mm-brand">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-mm-brand text-white text-[10px]">✓</span>
            <span>Correct — Let&apos;s look at the reasoning</span>
          </div>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-mm-muted">
            Multiplying both the numerator and denominator of <strong>3/4</strong> by 2 yields <strong>(3 × 2) / (4 × 2) = 6/8</strong>.
            Both fractions represent exactly 75% of a whole unit.
          </p>
        </div>
      </div>
    </Screen>
  );
}

/** View 4: Parent View (/parent) */
function ParentViewScreen() {
  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mm-line pb-3">
        <div>
          <h4 className={screenTitle}>How Mia is doing</h4>
          <p className="mt-1 text-sm text-mm-muted">Grade 5 · Read-only view — results scored and stored on our servers</p>
        </div>
        <span className="text-xs font-semibold text-mm-muted">Route: /parent</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-mm-line bg-white p-5 shadow-sm">
          <p className={kicker}>Recent Practice Sessions</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-mm-line">
            {[
              ["Grade 5 Numeracy Practice", "Yesterday", "9 / 10"],
              ["Fractions on a Number Line", "2 days ago", "5 / 5"],
              ["NAPLAN-style Numeracy Simulation", "4 days ago", "28 / 32"],
            ].map(([title, date, score], index) => (
              <div
                key={title}
                className={`grid grid-cols-[1.5fr_1fr_auto] items-center gap-2 px-3.5 py-3 text-[13px] ${
                  index < 2 ? "border-b border-mm-line-soft" : ""
                }`}
              >
                <span className="font-semibold text-mm-ink">{title}</span>
                <span className="text-mm-muted">{date}</span>
                <span className="font-bold text-mm-brand">{score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-mm-line bg-white p-5 shadow-sm">
          <p className={kicker}>Curriculum Skills & Topics</p>
          <div className="mt-3 grid gap-2.5">
            {[
              { name: "Equivalent fractions (VC2M5N03)", status: "Developing well", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              { name: "Decimal place value (VC2M5N04)", status: "Needs revision", tone: "border-coral-border bg-coral-light text-mm-coral-text" },
              { name: "Multi-step word problems (VC2M5N06)", status: "Consistent practice", tone: "bg-mm-tint text-mm-brand border-mm-tint-line" },
            ].map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-mm-line bg-mm-page p-3"
              >
                <span className="text-[13px] font-semibold text-mm-ink">{skill.name}</span>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${skill.tone}`}>
                  {skill.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-mm-line/80 bg-mm-tint/40 p-4 text-[13px] text-mm-muted">
        <strong className="text-mm-ink">Learning Insight:</strong> Mia is demonstrating strong understanding with fraction operations.
        Reviewing decimal place value before next week&apos;s practice session is recommended.
      </div>
    </Screen>
  );
}

export function ShowcaseScreenBody({ screen }: { screen: ShowcaseScreen }) {
  switch (screen) {
    case "home":
      return <StudentHomeScreen />;
    case "lesson":
      return <ConceptLessonScreen />;
    case "practice":
      return <PracticeFeedbackScreen />;
    case "parent":
      return <ParentViewScreen />;
  }
}
