import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Pencil } from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { RecentAttemptsCard } from "@/features/student/components/RecentAttemptsCard";
import { StudentShell } from "@/features/student/components/StudentShell";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Student home" };

/*
 * Per-user page: everything on it is scoped to the signed-in student, so it
 * must render at request time. Without this, a build without Supabase env
 * would bake the unconfigured redirect into a static page.
 */
export const dynamic = "force-dynamic";

/*
 * Session-type launch cards (mockup 05). Both lead to the existing exam
 * setup — building the practice configurator itself is another thread's
 * scope; this screen only frames the choice.
 */
const MODES = [
  {
    key: "practice",
    subtitle: "Practice mode",
    title: "Build your skills",
    description:
      "Work through questions at your own pace with no timer. See your full review and explanations when you finish.",
    features: [
      "Untimed — take the time you need",
      "Choose subject, style and length",
      "Full review with explanations after submitting",
    ],
    cta: "Start practising",
    icon: Pencil,
    accent: "royal" as const,
  },
  {
    key: "exam",
    subtitle: "Exam simulation",
    title: "Test under pressure",
    description:
      "Sit a timed session mirroring NAPLAN or ICAS conditions. Results and full review when you finish.",
    features: [
      "Timed — mirrors real exam conditions",
      "No feedback during the session",
      "Server-scored results you can trust",
    ],
    cta: "Start an exam sim",
    icon: Clock3,
    accent: "orange" as const,
  },
];

export default async function StudentHomePage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();

  const firstName = student.displayName?.split(" ")[0] ?? null;

  return (
    <StudentShell active="home">
      <section className="pb-8 text-center sm:pb-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          Choose your session type
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-ink sm:text-4xl">
          {firstName ? `${firstName}, how` : "How"} do you want to study today?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          Pick a mode to begin. You can switch any time from here.
        </p>
      </section>

      <section aria-label="Session types" className="grid gap-5 pb-12 md:grid-cols-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isOrange = mode.accent === "orange";
          return (
            <Card key={mode.key} variant="default" className="flex flex-col p-7 sm:p-8">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isOrange
                    ? "bg-royal-orange/10 text-warning"
                    : "bg-royal/8 text-royal"
                }`}
              >
                <Icon aria-hidden="true" className="h-7 w-7" />
              </span>
              <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                {mode.subtitle}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-ink">
                {mode.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{mode.description}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {mode.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2.5 text-sm font-semibold text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        isOrange ? "bg-royal-orange" : "bg-royal"
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/#exam-setup"
                className={`mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
                  isOrange
                    ? "bg-royal-orange text-ink shadow-[0_10px_24px_rgba(255,138,0,0.2)]"
                    : "bg-royal shadow-[0_10px_24px_rgba(75,46,131,0.2)]"
                }`}
              >
                {mode.cta}
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </Card>
          );
        })}
      </section>

      <section aria-label="Recent sessions" className="space-y-4">
        {overview.attempts.length > 0 && (
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black tracking-[-0.02em] text-ink">
              Pick up where you left off
            </h2>
            <Badge variant="purple">{overview.attempts.length} finished</Badge>
          </div>
        )}
        <RecentAttemptsCard attempts={overview.attempts} />
      </section>
    </StudentShell>
  );
}
