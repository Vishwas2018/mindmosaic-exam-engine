import Link from "next/link";
import { BarChart3, BookOpen, Check, Clock, SlidersHorizontal, TrendingUp } from "lucide-react";

import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import { PLANNED_PATHWAYS } from "@/features/landing/programme-status";
import type { StudioAvailability } from "@/features/practice-studio/availability";
import { formatSubmittedAt, type AttemptSummary, type SubjectMastery } from "@/features/student/attempt-summary";
import {
  MIN_ATTEMPTS_FOR_FINDING,
  MIN_MARKS_FOR_FINDING,
  meetsFindingThreshold,
} from "@/features/student/progress-threshold";

/**
 * My Space — Claude Design student artboards 01–09. Everything shown comes from the child's own finished timed
 * papers and from what the gated bank can actually serve; nothing is predicted, and a finding is shown only above
 * the shared 2-paper / 8-mark floor. The design's "Why this set? — from your warm-up" panel is not drawn: there is
 * no warm-up record behind it here, and a reason we cannot point to would be invented.
 */

const card = "rounded-3xl border border-mm-brand/10 bg-white shadow-[0_18px_50px_rgba(49,32,86,0.09)]";
const h2 = "font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] text-mm-ink";
const btnPrimary =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-mm-brand px-6 text-base font-semibold tracking-[-0.01em] text-white shadow-[0_2px_8px_rgba(89,37,168,0.22)] transition-colors hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand";
const btnSecondary =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-mm-line bg-white px-5 text-[15px] font-semibold tracking-[-0.01em] text-mm-ink transition-colors hover:border-mm-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand";
const chip = "inline-flex min-h-[26px] items-center rounded-lg bg-mm-tint-soft px-2.5 text-[13px] text-mm-ink-soft";

/* Pathways that are planned as exam programmes. "Learning Hub" is in the marketing list but is already open here. */
const COMING_LATER = PLANNED_PATHWAYS.filter((p) => !/learning hub/i.test(p.name));

export function MySpaceView({
  firstName,
  yearLevel,
  attempts,
  mastery,
  availability,
  hasActiveSession,
}: {
  firstName: string | null;
  yearLevel: 3 | 5;
  attempts: readonly AttemptSummary[];
  mastery: readonly SubjectMastery[];
  availability: StudioAvailability;
  hasActiveSession: boolean;
}) {
  const firstVisit = attempts.length === 0;
  const forYear = availability.subjects.filter((s) => s.yearLevel === yearLevel && s.state === "ready");
  const naplan = forYear.filter((s) => s.examStyle === "naplan_style");
  const icas = forYear.filter((s) => s.examStyle === "icas_style");

  return (
    <div className="grid gap-7">
      <div>
        {firstVisit && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mm-brand">First visit</p>
        )}
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl">
          {firstVisit ? `Welcome${firstName ? `, ${firstName}` : ""}` : `Welcome back${firstName ? `, ${firstName}` : ""}`}
        </h1>
        <p className="mt-2 max-w-[952px] text-[17px] leading-[1.6] text-mm-ink-soft">
          {firstVisit
            ? `Your Year ${yearLevel} space is ready. Nothing here is marked or scored yet — this page fills in as you practise.`
            : `Your Year ${yearLevel} space. Marks here come from finished timed papers only.`}
        </p>
      </div>

      {hasActiveSession && <ActiveSessionBanner />}

      <section aria-labelledby="start-here" className={`${card} grid overflow-hidden md:grid-cols-[minmax(0,1fr)_240px]`}>
        <div className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mm-brand">Start here</p>
          <h2 id="start-here" className="mt-3 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-mm-ink sm:text-[28px]">
            {firstVisit ? "Your first practice set" : "Ready for more practice?"}
          </h2>
          <p className="mt-2.5 max-w-[460px] text-base leading-[1.6] text-mm-ink-soft">
            Pick a subject and how many questions. After each answer you see exactly how it was worked out — right or
            wrong.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={chip}>10 or 20 questions</span>
            <span className={chip}>No timer</span>
            <span className={chip}>Stop any time</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/student/practice" className={btnPrimary}>
              Start practice
            </Link>
            <Link href="/student/learn" className={btnSecondary}>
              Read a lesson first
            </Link>
          </div>
          <p className="mt-3.5 text-[13px] leading-[1.45] text-mm-muted">
            Practice sets are not recorded, so nothing you try here counts against you.
          </p>
        </div>
        <ExerciseBookSketch />
      </section>

      {firstVisit && (
        <section aria-labelledby="three-places" className={`${card} px-6 py-6`}>
          <h2 id="three-places" className={h2}>
            Three places to know
          </h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-3 md:divide-x md:divide-mm-line">
            {[
              ["Learning Hub", "Lessons with a worked example and a common trap, for Maths and English."],
              ["Practice Studio", "Short sets you can stop any time. Every question explains itself after you answer."],
              ["Exam Centre", "Timed papers when you want to practise under exam conditions. Nothing here is compulsory."],
            ].map(([t, d], i) => (
              <div key={t} className={i > 0 ? "md:pl-5" : ""}>
                <dt className="text-sm font-semibold text-mm-ink">{t}</dt>
                <dd className="mt-0.5 text-sm leading-[1.5] text-mm-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="grid items-start gap-6 md:grid-cols-2">
        <section aria-labelledby="recent-results" className={`${card} px-6 py-6`}>
          <h2 id="recent-results" className={h2}>
            Recent results
          </h2>
          {attempts.length === 0 ? (
            <EmptyBlock icon={<TrendingUp className="h-5 w-5" />} title="No results yet">
              Your marks and answer review appear here as soon as you finish a timed paper.
            </EmptyBlock>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-mm-line">
                {attempts.slice(0, 3).map((a) => (
                  <li key={a.id} className="py-3 first:pt-0">
                    <p className="text-[15px] font-semibold text-mm-ink">{a.title}</p>
                    <p className="text-sm text-mm-ink-soft">
                      {a.scorePercent !== null ? `${a.scorePercent}% of the marks that could be marked` : "No marks to show yet"}
                      {a.pendingManualReview ? " · some answers not yet marked" : ""} · {formatSubmittedAt(a.submittedAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/results" className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold text-mm-brand hover:underline">
                All my results
              </Link>
            </>
          )}
        </section>

        <section aria-labelledby="my-progress" className={`${card} px-6 py-6`}>
          <h2 id="my-progress" className={h2}>
            My progress
          </h2>
          {attempts.length === 0 ? (
            <>
              <EmptyBlock icon={<BarChart3 className="h-5 w-5" />} title="Nothing to show yet">
                Strengths and things to practise come from finished timed papers. Practice sets and lessons aren&rsquo;t
                counted here.
              </EmptyBlock>
              <Link href="/student/practice" className={`${btnSecondary} mt-4 min-h-11`}>
                Start a practice set
              </Link>
            </>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-mm-line">
                {mastery.map((subject) => {
                  const count = attempts.filter((a) => a.subjectLabel === subject.label).length;
                  const enough = meetsFindingThreshold(count, subject.marksAvailable);
                  return (
                    <li key={subject.subject} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0">
                      <span className="font-semibold text-mm-ink">{subject.label}</span>
                      <span className="text-sm text-mm-ink-soft">
                        {enough
                          ? `${subject.marksEarned} of ${subject.marksAvailable} marks · ${count} papers`
                          : `Not enough yet: needs ${MIN_ATTEMPTS_FOR_FINDING} papers and ${MIN_MARKS_FOR_FINDING} marks`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link href="/student/engagement" className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold text-mm-brand hover:underline">
                Open My Progress
              </Link>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="open-for-year" className="grid gap-4">
        <div>
          <h2 id="open-for-year" className="flex items-center gap-3 font-[family-name:var(--font-display)] text-[26px] font-semibold tracking-[-0.03em] text-mm-ink">
            Open for Year {yearLevel}
          </h2>
          <p className="mt-1 text-sm text-mm-ink-soft">Only what has questions you can answer today is listed as available.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <PathwayTile
            href="/student/exam-preparation"
            title="NAPLAN-style practice & papers"
            body={naplan.length ? naplan.map((s) => SUBJECT_LABELS[s.subject]).join(", ") + "." : "Nothing open for this year yet."}
            available={naplan.length > 0}
            chips={[`Year ${yearLevel}`, `${naplan.length} subject${naplan.length === 1 ? "" : "s"}`]}
            icon={<span className="font-[family-name:var(--font-display)] text-lg font-semibold text-mm-brand">3+4</span>}
          />
          <PathwayTile
            href="/student/exam-preparation"
            title="ICAS-style papers"
            body={icas.length ? icas.map((s) => SUBJECT_LABELS[s.subject]).join(", ") + "." : "Nothing open for this year yet."}
            available={icas.length > 0}
            chips={[`Year ${yearLevel}`, `${icas.length} subject${icas.length === 1 ? "" : "s"}`]}
            icon={<BarChart3 className="h-7 w-7 text-mm-brand" />}
          />
          <PathwayTile
            href="/student/learn"
            title="Curriculum lessons"
            body="Maths and English. Each lesson has a worked example, a common trap and a few questions."
            available
            chips={[`Year ${yearLevel}`]}
            icon={<BookOpen className="h-7 w-7 text-mm-brand" />}
          />
          <PathwayTile
            href="/student/practice"
            title="Build your own practice"
            body="Pick the subject, how many questions and whether it's timed."
            available={forYear.length > 0}
            chips={[`Year ${yearLevel}`]}
            icon={<SlidersHorizontal className="h-7 w-7 text-mm-brand" />}
          />
        </div>
      </section>

      {COMING_LATER.length > 0 && (
        <section aria-labelledby="coming-later" className="rounded-3xl border border-dashed border-mm-line bg-transparent px-6 py-6">
          <h2 id="coming-later" className={h2}>
            Coming later
          </h2>
          <p className="mt-2 text-[15px] leading-[1.6] text-mm-ink-soft">
            {COMING_LATER.map((p) => p.name).join(", ")} are being built. There are no questions in them yet, so they
            don&rsquo;t appear in Practice Studio or the Exam Centre.
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-mm-ink-soft">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mm-line bg-white px-2.5 py-1 font-semibold">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" /> Planned
            </span>
            {COMING_LATER.length} pathways
          </p>
        </section>
      )}
    </div>
  );
}

function EmptyBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-xl bg-mm-tint-soft text-mm-brand">
        {icon}
      </span>
      <p className="mt-4 text-[17px] font-semibold text-mm-ink">{title}</p>
      <p className="mt-2 text-sm leading-[1.55] text-mm-ink-soft">{children}</p>
    </div>
  );
}

function PathwayTile({
  href,
  title,
  body,
  available,
  chips,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  available: boolean;
  chips: string[];
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex gap-5 rounded-3xl border border-mm-line bg-white p-5 transition-colors hover:border-mm-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
    >
      <span aria-hidden="true" className="grid h-[88px] w-[88px] shrink-0 place-items-center rounded-2xl bg-[#fcfbf8] shadow-[inset_0_0_0_1px_var(--mm-line)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em] text-mm-ink">{title}</span>
        <span className="mt-1.5 block text-[15px] leading-[1.5] text-mm-ink-soft">{body}</span>
        <span className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex min-h-[26px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold ${
              available ? "bg-[#d9efec] text-[#0b6b63]" : "bg-mm-tint-soft text-mm-ink-soft"
            }`}
          >
            {available ? <Check aria-hidden="true" className="h-3.5 w-3.5" /> : null}
            {available ? "Available" : "Not open yet"}
          </span>
          {chips.map((c) => (
            <span key={c} className={chip}>
              {c}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}

/** The exercise-book ten-frame from the "Start here" artboard (decorative). */
function ExerciseBookSketch() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden border-l border-mm-line bg-[#fcfbf8] md:block"
      style={{
        backgroundImage:
          "linear-gradient(rgba(89,37,168,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(89,37,168,0.06) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <span className="absolute inset-y-0 left-0 w-px bg-mm-coral/70" />
      <div className="absolute left-7 top-[78px] font-[family-name:var(--font-display)] text-xl text-mm-ink">3 + ?</div>
      <div className="absolute left-7 top-[112px] grid grid-cols-5 border-2 border-mm-brand">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="grid h-9 w-9 place-items-center border border-mm-brand/70">
            {i < 5 && (
              <span className={`h-[18px] w-[18px] rounded-full border-2 border-mm-brand ${i < 3 ? "bg-mm-brand/70" : ""}`} />
            )}
          </span>
        ))}
      </div>
      <div className="absolute left-7 top-[256px] flex items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex items-center">
            <span className="h-4 w-4 rounded-full border-2 border-mm-brand/50" />
            {i < 2 && <span className="h-0.5 w-9 bg-mm-brand/40" />}
          </span>
        ))}
      </div>
    </div>
  );
}
