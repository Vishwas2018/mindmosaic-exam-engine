import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { clsx } from "clsx";

import { EmptySlot } from "@/features/landing/components/primitives";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
} from "@/features/curriculum/lessons";
import { CurriculumPathwaysPanel } from "@/features/curriculum/lessons/components";
import { LearnSidebar } from "@/features/student/components/LearnSidebar";
import { StudentMobileNav } from "@/features/student/components/StudentMobileNav";
import { fetchStudentOverview } from "@/features/student/data";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Learn" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Learn — design handoff screen 8.
 *
 * The layout is the design's: a 264px sticky sidebar, a 72px sticky header
 * with a truncating programme title and a `flex:none` action group, then
 * the continue-lesson card, the pathway-progress panel, the
 * worth-revisiting pair, the lesson list and three next-step cards.
 *
 * **The lesson list is deliberately an empty state.** There is no lesson
 * content model in this codebase — no lessons table, no lesson type, no
 * lesson view (DESIGN_AUDIT.md §9). Every other panel on this screen is
 * driven by data that genuinely exists:
 *
 *   Pathway progress    -> real subject mastery + the real weekly count
 *   Worth revisiting    -> the two weakest subjects by objective marks
 *   Next steps          -> real routes (/resources, /practice, a timed sitting)
 *
 * so the shell is honest end to end rather than one real screen wrapped
 * around invented lessons. When lessons exist, they drop into the marked
 * section and nothing else on the page has to change.
 */

/** The design's four labelled bars, filled from what is actually measured. */
interface PathwayBar {
  readonly label: string;
  readonly value: string;
  readonly percent: number;
  readonly tone: "brand" | "lilac" | "coral";
}

const WEEKLY_GOAL = 5;

/** Sessions submitted in the last seven days, from the engagement timeline. */
function sessionsThisWeek(
  attempts: readonly { submittedAt: string }[],
  now: Date,
): number {
  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return attempts.filter((attempt) => {
    const at = Date.parse(attempt.submittedAt);
    return Number.isFinite(at) && at >= cutoff;
  }).length;
}

export default async function StudentLearnPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const now = new Date();

  const engagementResult = await fetchEngagementAttempts(student.userId);
  const engagement = engagementResult.ok
    ? buildEngagementSummary(engagementResult.attempts, now)
    : null;

  const weeklyCompleted = sessionsThisWeek(overview.attempts, now);
  const developingWell = overview.mastery.filter((subject) => subject.percent >= 70);
  const needingSupport = overview.mastery.filter((subject) => subject.percent < 55);
  /* The two weakest scored subjects — the design's "worth revisiting" pair. */
  const revisit = [...overview.mastery].sort((a, b) => a.percent - b.percent).slice(0, 2);
  const hasHistory = overview.attempts.length > 0;
  const yearPathways = getCurriculumPathwaysForYearLevel(student.yearLevel);
  const learningAreas = groupPathwaysByLearningArea(yearPathways);
  const totalPathwayLessons = yearPathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);

  const bars: PathwayBar[] = [
    {
      label: "Sessions finished",
      value: `${engagement?.totalSessions ?? overview.attempts.length} in total`,
      /* Capped rather than scaled to an invented target: 25 is the last
         milestone in engagement/achievements.ts, so the bar means
         "progress towards the furthest badge" and not a made-up quota. */
      percent: Math.min(100, ((engagement?.totalSessions ?? 0) / 25) * 100),
      tone: "brand",
    },
    {
      label: "Skills developing well",
      value: `${developingWell.length} of ${overview.mastery.length || 0} subjects`,
      percent: overview.mastery.length
        ? (developingWell.length / overview.mastery.length) * 100
        : 0,
      tone: "lilac",
    },
    {
      label: "Skills needing support",
      value: `${needingSupport.length} of ${overview.mastery.length || 0} subjects`,
      percent: overview.mastery.length
        ? (needingSupport.length / overview.mastery.length) * 100
        : 0,
      tone: "coral",
    },
    {
      label: "Weekly goal",
      value: `${weeklyCompleted} of ${WEEKLY_GOAL} sessions`,
      percent: Math.min(100, (weeklyCompleted / WEEKLY_GOAL) * 100),
      tone: "brand",
    },
  ];

  const nextSteps = [
    {
      tag: "Learning Hub",
      title: "Read the explanation again",
      body: "Every skill has a written explanation in the hub, with a second worked example.",
      href: "/resources",
      slot: "Screenshot — Learning Hub article",
    },
    {
      tag: "Practice",
      title: overview.recommendedFocus
        ? `Practise ${overview.recommendedFocus.label.toLowerCase()}`
        : "Practise a skill",
      body: overview.recommendedFocus
        ? `Your lowest subject so far, at ${overview.recommendedFocus.percent}% of objective marks. A worked explanation follows every answer.`
        : "Choose a subject, year level and length, then start. A worked explanation follows every answer.",
      href: "/practice",
      slot: "Screenshot — practice set summary",
    },
    {
      tag: "Exam preparation",
      title: "Sit a short simulation",
      body: "A timed NAPLAN-style section under exam conditions, with results and explanations after submission.",
      href: "/practice?timing=timed",
      slot: "Screenshot — exam simulation start screen",
    },
  ];

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <LearnSidebar
        displayName={student.displayName}
        yearLevel={student.yearLevel}
        weekly={hasHistory ? { completed: weeklyCompleted, goal: WEEKLY_GOAL } : undefined}
      />

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-5 border-b border-mm-line bg-mm-page/96 px-[clamp(20px,3vw,40px)] backdrop-blur-[6px]">
          <div className="grid min-w-0 flex-auto gap-0.5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Learn</p>
            <h1 className="truncate text-[19px] font-bold text-mm-ink">
              {student.yearLevel === null
                ? "Your learning"
                : `Australian Curriculum · Year ${student.yearLevel}`}
            </h1>
          </div>
          <div className="ml-auto flex flex-none items-center gap-2.5">
            <Link
              href="/student"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-[10px] border border-mm-line bg-white px-3.5 text-sm font-semibold text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/practice"
              className="inline-flex min-h-[42px] items-center rounded-[10px] bg-mm-brand px-4 text-[14.5px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
            >
              Practise a skill
            </Link>
          </div>
        </header>

        <div className="lg:hidden">
          <StudentMobileNav active="learn" />
        </div>

        <div className="grid gap-[clamp(16px,1.8vw,24px)] px-[clamp(20px,3vw,40px)] pb-14 pt-[clamp(20px,2.4vw,32px)]">
          {/* ---------- Continue + pathway progress ---------- */}
          <section className="grid items-start gap-[clamp(16px,1.8vw,24px)] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <article className="overflow-hidden rounded-[18px] border border-mm-line bg-white">
              <div className="grid gap-3 border-b border-mm-line-soft p-[clamp(20px,2vw,28px)]">
                <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-brand">
                  {hasHistory ? "Pick up where you left off" : "Start here"}
                </p>
                <h2 className="text-[clamp(22px,2.2vw,30px)] font-bold leading-[1.15] text-mm-ink">
                  {hasHistory && overview.recommendedFocus
                    ? `More practice on ${overview.recommendedFocus.label.toLowerCase()}`
                    : "Your first practice session"}
                </h2>
                <p className="text-[15.5px] leading-[1.6] text-mm-muted">
                  {hasHistory && overview.recommendedFocus ? (
                    <>
                      Weakest subject so far:{" "}
                      <strong className="font-semibold text-mm-ink">
                        {overview.recommendedFocus.label}
                      </strong>{" "}
                      · {overview.recommendedFocus.percent}% of objective marks · a worked
                      explanation after every answer
                    </>
                  ) : (
                    <>
                      Choose a subject, year level and length. Every answer is followed by a
                      worked explanation, and nothing is timed unless you ask for it.
                    </>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-2.5">
                  <Link
                    href="/practice"
                    className="inline-flex min-h-12 items-center rounded-[11px] bg-mm-brand px-[22px] text-[15px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                  >
                    {hasHistory ? "Continue practising" : "Set up your first session"}
                  </Link>
                  <Link
                    href="/practice/session?subject=mixed&count=15"
                    className="inline-flex min-h-12 items-center rounded-[11px] border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                  >
                    Take a diagnostic check
                  </Link>
                </div>
              </div>
              <div className="relative aspect-video bg-mm-tint">
                <EmptySlot label="Screenshot — lesson view with worked example and number line" />
              </div>
            </article>

            <div className="grid gap-[clamp(16px,1.8vw,24px)]">
              <div className="grid gap-4 rounded-[18px] border border-mm-line bg-white p-[clamp(20px,2vw,26px)]">
                <h3 className="text-[17.5px] font-bold text-mm-ink">Pathway progress</h3>
                <div className="grid gap-3">
                  {bars.map((bar) => (
                    <div key={bar.label} className="grid gap-[7px]">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-mm-ink">{bar.label}</span>
                        <span className="text-mm-muted">{bar.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-sm bg-mm-line-soft">
                        <div
                          className={clsx(
                            "h-full rounded-sm",
                            bar.tone === "brand" && "bg-mm-brand",
                            bar.tone === "lilac" && "bg-mm-lilac",
                            bar.tone === "coral" && "bg-mm-coral",
                          )}
                          style={{ width: `${Math.round(bar.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {!hasHistory && (
                  <p className="text-[13.5px] leading-[1.55] text-mm-muted">
                    These fill in from your first finished session. Honest zeros until then.
                  </p>
                )}
              </div>

              <div className="grid gap-3 rounded-[18px] border border-mm-line bg-white p-[clamp(20px,2vw,26px)]">
                <h3 className="text-[17.5px] font-bold text-mm-ink">Worth revisiting</h3>
                {revisit.length === 0 ? (
                  <p className="text-[14.5px] leading-[1.55] text-mm-muted">
                    Nothing to revisit yet — this names the subjects where recent answers were
                    weakest, once there are some.
                  </p>
                ) : (
                  <>
                    <p className="text-[14.5px] leading-[1.55] text-mm-muted">
                      {revisit.length === 1 ? "The subject" : "The two subjects"} where the fewest
                      objective marks have been earned so far.
                    </p>
                    <div className="grid gap-2.5">
                      {revisit.map((subject) => (
                        <Link
                          key={subject.subject}
                          href={`/practice/session?subject=${encodeURIComponent(subject.subject)}`}
                          className="flex items-center justify-between gap-3.5 rounded-xl border border-mm-line p-3.5 text-mm-ink hover:border-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                        >
                          <span className="grid gap-0.5">
                            <span className="text-[15px] font-bold">{subject.label}</span>
                            <span className="text-[13px] text-mm-muted">
                              {subject.marksEarned} of {subject.marksAvailable} objective marks
                            </span>
                          </span>
                          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-mm-brand" />
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ---------- Lesson list: Structured Pathways ---------- */}
          <section aria-labelledby="lesson-list-heading" className="grid gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2
                  id="lesson-list-heading"
                  className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink"
                >
                  Lessons & Pathways
                </h2>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-mm-muted">
                  {totalPathwayLessons > 0
                    ? `${totalPathwayLessons} sequenced Victorian Curriculum lessons for Year ${student.yearLevel} with concepts, step-by-step worked examples, and practice checks.`
                    : "Sequenced Victorian Curriculum lessons with concepts, step-by-step worked examples, and practice checks."}
                </p>
              </div>
            </div>

            <CurriculumPathwaysPanel yearLevel={student.yearLevel} learningAreas={learningAreas} />
          </section>

          {/* ---------- Next steps ---------- */}
          <section aria-label="Next steps" className="grid gap-[clamp(16px,1.8vw,24px)] lg:grid-cols-3">
            {nextSteps.map((card) => (
              <Link
                key={card.tag}
                href={card.href}
                className="grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-mm-line bg-white transition-colors hover:border-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
              >
                <div className="relative aspect-video border-b border-mm-line bg-mm-tint">
                  <EmptySlot label={card.slot} />
                </div>
                <div className="grid content-start gap-2 p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-mm-brand">
                    {card.tag}
                  </p>
                  <h3 className="text-[17px] font-bold text-mm-ink">{card.title}</h3>
                  <p className="text-[14.5px] leading-[1.55] text-mm-muted">{card.body}</p>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
