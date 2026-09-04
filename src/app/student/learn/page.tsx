import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Target } from "lucide-react";
import { clsx } from "clsx";

import { EmptySlot } from "@/features/landing/components/primitives";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  learningAreaHref,
} from "@/features/curriculum/lessons";
import { EmptyPathwaysNotice, SubjectCard } from "@/features/curriculum/lessons/components";
import { StudentShell } from "@/features/student/components/StudentShell";
import { fetchStudentOverview } from "@/features/student/data";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Learn" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

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

  const learningAreaCounts = learningAreas.map((area) => ({
    learningArea: area.learningArea,
    lessonCount: area.pathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0),
  }));

  return (
    <StudentShell active="learn">
      <div className="grid gap-[clamp(20px,2.5vw,32px)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">Learn</p>
            <h1 className="mt-0.5 text-3xl font-black tracking-[-0.03em] text-mm-ink">
              {student.yearLevel === null
                ? "Your learning"
                : `Australian Curriculum · Year ${student.yearLevel}`}
            </h1>
          </div>
          <Link
            href="/practice"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-4 text-[14.5px] font-bold text-white shadow-xs transition-all duration-180 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Practise a skill</span>
          </Link>
        </div>

        {/* ---------- Continue + pathway progress ---------- */}
          <section className="grid items-start gap-[clamp(16px,1.8vw,24px)] xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <article className="overflow-hidden rounded-3xl border border-mm-line bg-white shadow-xs transition-shadow duration-200 hover:shadow-sm">
              <div className="grid gap-3.5 border-b border-mm-line-soft p-[clamp(20px,2.2vw,32px)]">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-mm-brand/10 text-mm-brand text-xs">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <p className="font-mono text-[11.5px] font-bold uppercase tracking-[0.08em] text-mm-brand">
                    {hasHistory ? "Pick up where you left off" : "Start here"}
                  </p>
                </div>
                <h2 className="text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.15] text-mm-ink">
                  {hasHistory && overview.recommendedFocus
                    ? `More practice on ${overview.recommendedFocus.label.toLowerCase()}`
                    : "Your first practice session"}
                </h2>
                <p className="text-[15.5px] leading-[1.65] text-mm-muted">
                  {hasHistory && overview.recommendedFocus ? (
                    <>
                      Weakest subject so far:{" "}
                      <strong className="font-bold text-mm-ink">
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
                <div className="mt-2 flex flex-wrap gap-3">
                  <Link
                    href="/practice"
                    className="group inline-flex min-h-12 items-center gap-2 rounded-xl bg-mm-brand px-6 text-[15px] font-bold text-white shadow-xs transition-all duration-200 hover:bg-mm-brand-deep hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
                  >
                    <span>{hasHistory ? "Continue practising" : "Set up your first session"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/practice/session?subject=mixed&count=15"
                    className="inline-flex min-h-12 items-center rounded-xl border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink shadow-2xs transition-all duration-180 hover:border-mm-brand hover:text-mm-brand hover:bg-mm-tint/30 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
                  >
                    Take a diagnostic check
                  </Link>
                </div>
              </div>
              <div className="relative aspect-video bg-gradient-to-br from-mm-tint/80 to-mm-tint-soft/40">
                <EmptySlot label="Screenshot — lesson view with worked example and number line" />
              </div>
            </article>

            <div className="grid gap-[clamp(16px,1.8vw,24px)]">
              <div className="grid gap-4.5 rounded-3xl border border-mm-line bg-white p-[clamp(20px,2vw,28px)] shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-[18px] font-bold text-mm-ink flex items-center gap-2">
                    <Target className="h-4.5 w-4.5 text-mm-brand" aria-hidden="true" />
                    Pathway progress
                  </h3>
                </div>
                <div className="grid gap-3.5">
                  {bars.map((bar) => (
                    <div key={bar.label} className="grid gap-2">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-mm-ink">{bar.label}</span>
                        <span className="text-mm-muted font-medium text-xs">{bar.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/50">
                        <div
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            bar.tone === "brand" && "bg-gradient-to-r from-mm-brand-mid to-mm-brand",
                            bar.tone === "lilac" && "bg-gradient-to-r from-indigo-400 to-indigo-600",
                            bar.tone === "coral" && "bg-gradient-to-r from-rose-400 to-rose-600",
                          )}
                          style={{ width: `${Math.round(bar.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {!hasHistory && (
                  <p className="text-[13.5px] leading-[1.55] text-mm-muted bg-slate-50 p-3 rounded-xl border border-mm-line-soft">
                    These fill in from your first finished session. Honest zeros until then.
                  </p>
                )}
              </div>

              <div className="grid gap-3.5 rounded-3xl border border-mm-line bg-white p-[clamp(20px,2vw,28px)] shadow-xs">
                <h3 className="text-[18px] font-bold text-mm-ink flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-amber-500" aria-hidden="true" />
                  Worth revisiting
                </h3>
                {revisit.length === 0 ? (
                  <p className="text-[14.5px] leading-[1.55] text-mm-muted">
                    Nothing to revisit yet — this names the subjects where recent answers were
                    weakest, once there are some.
                  </p>
                ) : (
                  <>
                    <p className="text-[14px] leading-[1.55] text-mm-muted">
                      {revisit.length === 1 ? "The subject" : "The two subjects"} where the fewest
                      objective marks have been earned so far.
                    </p>
                    <div className="grid gap-2.5">
                      {revisit.map((subject) => (
                        <Link
                          key={subject.subject}
                          href={`/practice/session?subject=${encodeURIComponent(subject.subject)}`}
                          className="group flex items-center justify-between gap-3.5 rounded-2xl border border-mm-line p-3.5 text-mm-ink shadow-2xs transition-all duration-180 hover:border-mm-brand hover:bg-mm-tint/20 hover:shadow-xs focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand cursor-pointer"
                        >
                          <span className="grid gap-0.5">
                            <span className="text-[15px] font-bold group-hover:text-mm-brand transition-colors">
                              {subject.label}
                            </span>
                            <span className="text-[13px] text-mm-muted">
                              {subject.marksEarned} of {subject.marksAvailable} objective marks
                            </span>
                          </span>
                          <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-50 group-hover:bg-mm-tint group-hover:text-mm-brand text-mm-muted transition-colors">
                            <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ---------- Lesson list: Structured Pathways ---------- */}
          <section aria-labelledby="lesson-list-heading" className="grid gap-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-brand text-white shadow-2xs">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2
                    id="lesson-list-heading"
                    className="text-[clamp(22px,2.2vw,28px)] font-extrabold text-mm-ink tracking-tight"
                  >
                    Lessons & Pathways
                  </h2>
                </div>
                <p className="mt-2 text-[15px] leading-[1.6] text-mm-muted max-w-3xl">
                  {totalPathwayLessons > 0
                    ? `${totalPathwayLessons} sequenced Victorian Curriculum lessons for Year ${student.yearLevel} with concepts, step-by-step worked examples, and practice checks.`
                    : "Sequenced Victorian Curriculum lessons with concepts, step-by-step worked examples, and practice checks."}
                </p>
              </div>
            </div>

            {student.yearLevel === null ? (
              <EmptyPathwaysNotice message="We don't have a year level on file for your account yet, so we can't show your curriculum pathway. Ask a parent or teacher to add it in settings." />
            ) : learningAreaCounts.length === 0 ? (
              <EmptyPathwaysNotice
                message={`Year ${student.yearLevel} lessons haven't been published yet. Your pathway will appear here as soon as they are.`}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {learningAreaCounts.map(({ learningArea, lessonCount }) => (
                  <SubjectCard
                    key={learningArea}
                    learningArea={learningArea}
                    lessonCount={lessonCount}
                    href={learningAreaHref(learningArea)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ---------- Next steps ---------- */}
          <section aria-label="Next steps" className="grid gap-[clamp(16px,1.8vw,24px)] lg:grid-cols-3">
            {nextSteps.map((card) => (
              <Link
                key={card.tag}
                href={card.href}
                className="group grid grid-rows-[auto_1fr] overflow-hidden rounded-3xl border border-mm-line bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-mm-brand hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand cursor-pointer"
              >
                <div className="relative aspect-video border-b border-mm-line bg-gradient-to-br from-mm-tint to-slate-100">
                  <EmptySlot label={card.slot} />
                </div>
                <div className="grid content-start gap-2 p-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-mm-brand">
                    {card.tag}
                  </span>
                  <h3 className="text-[17.5px] font-bold text-mm-ink group-hover:text-mm-brand transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[14.5px] leading-[1.6] text-mm-muted">{card.body}</p>
                </div>
              </Link>
            ))}
          </section>
      </div>
    </StudentShell>
  );
}
