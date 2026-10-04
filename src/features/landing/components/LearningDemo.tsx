"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { AlertCircle, Check, Flag } from "lucide-react";
import { motion } from "framer-motion";

import { Reveal } from "./Reveal";
import { learningDemo } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
import { Eyebrow, Section } from "./primitives";

type TabId = (typeof learningDemo.tabs)[number]["id"];

const FRACTION_BAR_SEGMENTS = 4;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * "See how learning works": the Learn / Practise / Prepare model as three
 * connected step tabs, each opening a working sample of the real lesson,
 * practice and test-sitting components.
 *
 * WAI-ARIA tabs: arrow keys (and Home/End) move between stages with
 * automatic activation; only the selected tab is in the tab order. The
 * incoming panel fades in with a 10px rise over 280ms — the outgoing one
 * leaves at once, so content is never withheld — and nothing animates
 * under reduced motion.
 */
export function LearningDemo() {
  const [tab, setTabState] = useState<TabId>("learn");
  /** False until the first switch, so the initial panel never fades in. */
  const [switched, setSwitched] = useState(false);
  const setTab = (next: TabId) => {
    setSwitched(true);
    setTabState(next);
  };
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [pickMessage, setPickMessage] = useState("");
  const tablistId = useId();
  const reduced = useMotionLevel() === "off";

  const tabIndex = learningDemo.tabs.findIndex((t) => t.id === tab);
  const panel = learningDemo.tabs[tabIndex]!;

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const ids = learningDemo.tabs.map((t) => t.id);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (tabIndex + 1) % ids.length;
    if (event.key === "ArrowLeft") next = (tabIndex + ids.length - 1) % ids.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = ids.length - 1;
    if (next !== null) {
      event.preventDefault();
      setTab(ids[next]!);
      requestAnimationFrame(() => document.getElementById(`${tablistId}-${ids[next]}`)?.focus());
    }
  }

  return (
    <Section labelledBy="demo-heading" className="py-[clamp(64px,8vw,120px)]">
      <div className="flex flex-col gap-[clamp(28px,3.4vw,48px)]">
        <div className="grid items-end gap-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow rule className="mb-4">
              {learningDemo.eyebrow}
            </Eyebrow>
            <h2
              id="demo-heading"
              className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.034em] text-mm-ink"
            >
              {learningDemo.heading}
            </h2>
          </div>
          <p className="m-0 max-w-[52ch] text-pretty text-[17px] leading-[1.6] text-mm-ink-soft lg:col-span-5">
            {learningDemo.intro}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Learning stages"
          onKeyDown={onTabKeyDown}
          className="relative grid grid-cols-3 gap-2 sm:gap-3"
        >
          <span
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-[30px] hidden h-px bg-mm-tint-line-strong sm:block"
          />
          {learningDemo.tabs.map((t) => {
            const isSelected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`${tablistId}-${t.id}`}
                aria-controls={`${tablistId}-panel`}
                aria-label={t.label}
                aria-describedby={`${tablistId}-${t.id}-summary`}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`group relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page sm:min-h-[136px] sm:justify-start sm:gap-2 sm:px-4 sm:pt-[13px] ${
                  isSelected
                    ? "border-mm-brand bg-white shadow-[0_1px_2px_rgba(24,21,31,.06),0_12px_28px_-18px_rgba(89,37,168,.45)]"
                    : "border-mm-line bg-white/50 hover:border-mm-tint-line-strong hover:bg-white sm:border-transparent sm:bg-transparent"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`relative z-[1] hidden h-[34px] w-[34px] place-items-center rounded-[9px] text-[13px] font-semibold tabular-nums transition-colors duration-200 sm:grid ${
                    isSelected
                      ? "bg-mm-brand text-white"
                      : "border border-mm-tint-line-strong bg-mm-page text-mm-muted group-hover:text-mm-brand"
                  }`}
                >
                  {t.step}
                </span>
                <span
                  className={`text-[17px] font-semibold tracking-[-0.01em] sm:text-[20px] ${
                    isSelected ? "text-mm-brand" : "text-mm-ink"
                  }`}
                >
                  {t.label}
                </span>
                <span id={`${tablistId}-${t.id}-summary`} className="hidden text-[14px] leading-[1.4] text-mm-muted sm:block">
                  {t.summary}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id={`${tablistId}-panel`}
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`${tablistId}-${tab}`}
          className="rounded-[28px] border border-mm-line bg-white p-[clamp(18px,3vw,40px)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
        >
          <motion.div
            key={tab}
            initial={reduced || !switched ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: EASE_OUT }}
            className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-[clamp(32px,4vw,64px)]"
          >
            <div className="flex flex-col gap-4 lg:pt-3">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">
                <span className="mr-2 tabular-nums text-mm-coral-text">{panel.step}</span>
                {panel.kicker}
              </p>
              <h3 className="m-0 text-pretty text-[clamp(24px,2.3vw,34px)] font-medium leading-[1.12] tracking-[-0.03em] text-mm-ink">
                {panel.title}
              </h3>
              <p className="m-0 max-w-[46ch] text-pretty text-[16.5px] leading-[1.6] text-mm-ink-soft">{panel.body}</p>
              <ul className="m-0 mt-1 grid list-none gap-2.5 p-0">
                {panel.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-[15.5px] leading-[1.5] text-mm-ink-soft">
                    <Check aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-mm-brand" strokeWidth={2.25} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0">
              {tab === "learn" && <LearnPanel />}
              {tab === "practise" && (
                <PractisePanel
                  selected={selected}
                  checked={checked}
                  pickMessage={pickMessage}
                  onSelect={(label) => {
                    if (!checked) {
                      setSelected(label);
                      setPickMessage("");
                    }
                  }}
                  onCheck={() => (selected ? setChecked(true) : setPickMessage("Choose an answer first."))}
                  onReset={() => {
                    setSelected(null);
                    setChecked(false);
                  }}
                />
              )}
              {tab === "prepare" && <PreparePanel />}
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Only the shaded segments carry the "fill" reveal (MOTION_SPEC.md:
 * "scaleX 0→1 from the left"), matching the design exactly — an unshaded
 * segment is a static divider, and scaling a bordered element to 0 width
 * would collapse its border along with it.
 */
function FractionBar({ segments, shaded }: { segments: number; shaded: number }) {
  return (
    <div
      role="img"
      aria-label={`A bar split into ${segments} equal parts with ${shaded} part${shaded === 1 ? "" : "s"} shaded`}
      className="grid overflow-hidden rounded-lg border-2 border-mm-brand"
      style={{ gridTemplateColumns: `repeat(${segments}, 1fr)`, height: segments > 4 ? 44 : 48 }}
    >
      {Array.from({ length: segments }, (_, i) =>
        i < shaded ? (
          <Reveal key={i} kind="fill" delayMs={i * 70} className={i > 0 ? "border-l-2 border-mm-brand" : ""}>
            <span className="block h-full w-full bg-mm-brand" />
          </Reveal>
        ) : (
          <span key={i} className={i > 0 ? "border-l-2 border-mm-brand" : ""} />
        ),
      )}
    </div>
  );
}

function LearnPanel() {
  const { learnDemo } = learningDemo;
  return (
    <article
      aria-label="Sample lesson"
      className="overflow-hidden rounded-[20px] border border-mm-line bg-mm-page"
    >
      <div className="flex flex-wrap justify-between gap-3 border-b border-mm-line-soft px-5 py-3.5 text-[13.5px] text-mm-muted">
        <span>Year 3 · Mathematics · Number</span>
        <span>Lesson · about 15 min</span>
      </div>
      <div className="grid gap-5 p-[clamp(18px,2.4vw,28px)]">
        <div className="rounded-xl bg-mm-tint p-4">
          <p className="m-0 mb-1 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Learning intention</p>
          <p className="m-0 text-[15.5px] leading-[1.5] text-mm-ink">{learnDemo.intention}</p>
        </div>
        <div className="grid gap-2.5">
          <p className="m-0 text-[15.5px] leading-[1.6] text-mm-ink-soft">
            <strong className="text-mm-ink">Unit fraction:</strong> {learnDemo.explanation}
          </p>
          <FractionBar segments={FRACTION_BAR_SEGMENTS} shaded={1} />
          <div className="grid grid-cols-4 text-center text-sm text-mm-muted">
            <span className="font-bold text-mm-brand">¼</span>
            <span>¼</span>
            <span>¼</span>
            <span>¼</span>
          </div>
        </div>
        <div className="grid gap-1.5 border-t border-mm-line-soft pt-4">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-muted">Worked example</p>
          <p className="m-0 text-[15.5px] leading-[1.6] text-mm-ink-soft">{learnDemo.workedExample}</p>
        </div>
        <div className="flex gap-3 rounded-xl border border-[#FFD2D3] bg-[#FFF6F6] p-4">
          <AlertCircle aria-hidden="true" className="mt-px h-5 w-5 shrink-0 text-[#C4252B]" strokeWidth={1.8} />
          <p className="m-0 text-[15px] leading-[1.5] text-mm-ink-soft">{learnDemo.mixUp}</p>
        </div>
      </div>
    </article>
  );
}

function PractisePanel({
  selected,
  checked,
  pickMessage,
  onSelect,
  onCheck,
  onReset,
}: {
  selected: string | null;
  checked: boolean;
  pickMessage: string;
  onSelect: (label: string) => void;
  onCheck: () => void;
  onReset: () => void;
}) {
  const { practiseDemo } = learningDemo;
  const correct = practiseDemo.options.find((o) => o.correct)!;
  const isCorrect = selected === correct.label;

  return (
    <article aria-label="Sample practice question" className="overflow-hidden rounded-[20px] border border-mm-line bg-mm-page">
      <div className="flex flex-wrap justify-between gap-3 border-b border-mm-line-soft px-5 py-3.5 text-[13.5px] text-mm-muted">
        <span>{practiseDemo.meta}</span>
        <span>{practiseDemo.progress}</span>
      </div>
      <div className="grid gap-4.5 p-[clamp(18px,2.4vw,28px)]">
        <p className="m-0 text-lg font-bold leading-[1.4] text-mm-ink">{practiseDemo.question}</p>
        <FractionBar segments={practiseDemo.shadedOf} shaded={practiseDemo.shaded} />
        <div role="radiogroup" aria-label={practiseDemo.question} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-2.5">
          {practiseDemo.options.map((option) => {
            const isSelected = selected === option.label;
            const showResult = checked && isSelected;
            const showCorrect = checked && option.correct;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={checked}
                onClick={() => onSelect(option.label)}
                className={`flex min-h-[52px] items-center gap-3 rounded-xl border px-3.5 text-left text-[17px] font-medium text-mm-ink transition-colors ${
                  showCorrect
                    ? "border-2 border-[#0B6B63] bg-[#D9EFEC]"
                    : showResult
                      ? "border-2 border-[#C4252B] bg-[#FFF1F1]"
                      : isSelected
                        ? "border-2 border-mm-brand bg-mm-tint"
                        : "border border-mm-line bg-white"
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-mm-line bg-white text-[13px] font-bold text-mm-muted">
                  {option.key}
                </span>
                <span className="flex-1">{option.label}</span>
                {showCorrect && <span className="text-[13px] font-bold text-[#0B6B63]">Correct answer</span>}
                {showResult && !option.correct && <span className="text-[13px] font-bold text-[#9E1C22]">Your answer</span>}
              </button>
            );
          })}
        </div>

        {!checked && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCheck}
              className="inline-flex min-h-12 items-center rounded-xl bg-mm-brand px-5.5 text-[15.5px] font-semibold text-white transition-colors hover:bg-mm-brand-deep"
            >
              Check answer
            </button>
            {pickMessage && (
              <span role="alert" className="text-[14.5px] text-[#9E1C22]">
                {pickMessage}
              </span>
            )}
          </div>
        )}

        {checked && (
          <div
            role="status"
            className={`grid gap-2.5 rounded-2xl border p-4 ${
              isCorrect ? "border-[#A9D6D0] bg-[#D9EFEC]" : "border-[#FFD2D3] bg-[#FFF6F6]"
            }`}
          >
            <p className={`m-0 flex items-center gap-2 text-base font-semibold ${isCorrect ? "text-[#0B6B63]" : "text-[#9E1C22]"}`}>
              {isCorrect ? practiseDemo.correctFeedback : practiseDemo.incorrectFeedback}
            </p>
            <ol className="m-0 grid gap-1 pl-5 text-[15px] leading-[1.55] text-mm-ink-soft">
              {practiseDemo.explanationSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <button
              type="button"
              onClick={onReset}
              className="justify-self-start border-0 bg-none text-[15px] font-semibold text-mm-brand underline underline-offset-[3px]"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function PreparePanel() {
  const { prepareDemo } = learningDemo;
  return (
    <article aria-label="Sample test sitting" className="overflow-hidden rounded-[20px] border border-[#2E2540] bg-[#18151F] text-white">
      <div className="flex flex-wrap justify-between gap-3 border-b border-[#2E2540] px-5 py-3.5 text-[13.5px] text-[#C9C2D3]">
        <span>{prepareDemo.meta}</span>
        <span className="tabular-nums">{prepareDemo.progress}</span>
      </div>
      <div className="grid gap-4.5 p-[clamp(18px,2.4vw,28px)]">
        <p className="m-0 text-lg font-semibold leading-[1.45]">{prepareDemo.question}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-2.5">
          {prepareDemo.options.map((option, i) => (
            <span
              key={option}
              className={`flex min-h-[50px] items-center justify-between rounded-xl px-4 text-[17px] ${
                i === prepareDemo.selectedIndex ? "border-2 border-[#C9B6E4] bg-[#2A2138]" : "border border-[#3A3248]"
              }`}
            >
              {option}
              {i === prepareDemo.selectedIndex && <span className="text-[12.5px] text-[#C9B6E4]">Selected</span>}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#2E2540] pt-3.5">
          <span className="inline-flex items-center gap-2 text-[14.5px] text-[#DCD5E5]">
            <Flag aria-hidden="true" className="h-4 w-4 text-[#FF8A8D]" strokeWidth={1.8} />
            {prepareDemo.flaggedCount} flagged to revisit
          </span>
          <span className="flex gap-2">
            <span className="inline-flex min-h-11 items-center rounded-xl border border-[#3A3248] px-4 text-[14.5px] font-semibold">
              Back
            </span>
            <span className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-[14.5px] font-semibold text-mm-ink">
              Next
            </span>
          </span>
        </div>
        <div
          role="img"
          aria-label={`Question map: ${prepareDemo.currentQuestion - 1} answered, question ${prepareDemo.currentQuestion} current, ${prepareDemo.flaggedCount} flagged`}
          className="grid grid-cols-10 gap-1.5"
        >
          {Array.from({ length: prepareDemo.questionCount }, (_, i) => {
            const n = i + 1;
            const current = n === prepareDemo.currentQuestion;
            const done = n < prepareDemo.currentQuestion;
            const flagged = (prepareDemo.flaggedQuestions as readonly number[]).includes(n);
            return (
              <Reveal key={n} kind="pop" delayMs={i * 20}>
                <span
                  className="grid aspect-square place-items-center rounded-md text-[11.5px] font-semibold"
                  style={{
                    background: current ? "#fff" : done ? "#3A3248" : "transparent",
                    color: current ? "#18151F" : "#DCD5E5",
                    border: flagged ? "2px solid #FF8A8D" : current ? "2px solid #fff" : "1px solid #3A3248",
                  }}
                >
                  {n}
                </span>
              </Reveal>
            );
          })}
        </div>
      </div>
    </article>
  );
}
