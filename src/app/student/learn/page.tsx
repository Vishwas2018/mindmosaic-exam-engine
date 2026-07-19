import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Clock3,
  Pencil,
} from "lucide-react";

import { Badge, Card, buttonClasses } from "@/components/ui";
import { MasterySnapshot } from "@/features/student/components/MasterySnapshot";
import { RecentAttemptsCard } from "@/features/student/components/RecentAttemptsCard";
import { StudentShell } from "@/features/student/components/StudentShell";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Learning hub" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/*
 * Activity launch points (mockup 06). Practice and exam sims start from
 * the existing exam setup; results review lives on the existing results
 * route — both owned by other threads, linked rather than rebuilt.
 */
const ACTIVITIES = [
  {
    title: "Practice",
    meta: "Untimed · your pace",
    description: "Targeted drills by subject, style and length.",
    href: "/#exam-setup",
    icon: Pencil,
    iconClasses: "bg-royal/8 text-royal",
  },
  {
    title: "Exam sim",
    meta: "Timed · exam conditions",
    description: "Full NAPLAN- or ICAS-style timed assessment.",
    href: "/#exam-setup",
    icon: Clock3,
    iconClasses: "bg-royal-orange/10 text-warning",
  },
  {
    title: "Review results",
    meta: "Every finished session",
    description: "Revisit answers and explanations from past sessions.",
    href: "/results",
    icon: BarChart3,
    iconClasses: "bg-success/10 text-success",
  },
];

export default async function LearningHubPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const focus = overview.recommendedFocus;
  const hasAttempts = overview.attempts.length > 0;

  return (
    <StudentShell active="learn">
      <section className="flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.035em] text-ink">
            Learning hub
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {hasAttempts
              ? "Choose an activity or focus on the skills that need you most."
              : "Choose your first activity to get started."}
          </p>
        </div>
        {student.yearLevel !== null && (
          <Badge variant="purple">Year {student.yearLevel}</Badge>
        )}
      </section>

      {focus ? (
        <section aria-label="Recommended focus" className="pb-6">
          <div className="relative overflow-hidden rounded-3xl bg-royal p-7 text-white shadow-[0_18px_50px_rgba(49,32,86,0.25)] sm:p-9">
            <span
              aria-hidden="true"
              className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/5"
            />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/60">
                  Recommended focus
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">
                  {focus.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  This is your weakest subject so far at {focus.percent}% of
                  objective marks. A couple of focused practice sessions could
                  turn it into a strength.
                </p>
              </div>
              <Link
                href="/#exam-setup"
                className="inline-flex min-h-13 shrink-0 items-center gap-2 self-start rounded-xl bg-white px-6 py-3.5 text-base font-bold text-royal transition hover:-translate-y-0.5 hover:bg-soft-purple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 md:self-center"
              >
                Start practice
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section aria-label="Get started" className="pb-6">
          <Card variant="accent" className="mx-auto max-w-2xl p-8 text-center sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/8 text-royal">
              <BookOpenCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-ink">
              Begin with a practice session
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Finish your first session and MindMosaic will map your mastery by
              subject, highlight what needs attention and recommend what to
              practise next.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/#exam-setup"
                className={buttonClasses({ variant: "primary", size: "lg" })}
              >
                Set up your first session
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </Card>
        </section>
      )}

      <section aria-label="Start an activity" className="pb-8">
        <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          Start an activity
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            return (
              <Link
                key={activity.title}
                href={activity.href}
                className="group rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
              >
                <Card
                  variant="default"
                  className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-royal/25"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${activity.iconClasses}`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-ink">
                        {activity.title}
                      </h3>
                      <p className="text-xs font-semibold text-muted">
                        {activity.meta}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {activity.description}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Your progress" className="grid items-start gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentAttemptsCard attempts={overview.attempts} limit={6} />
        </div>
        <div className="lg:col-span-2">
          <MasterySnapshot mastery={overview.mastery} />
        </div>
      </section>
    </StudentShell>
  );
}
