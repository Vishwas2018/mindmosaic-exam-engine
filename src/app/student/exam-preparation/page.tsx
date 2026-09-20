import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import { GraduationCap, Medal, School, Sigma } from "lucide-react";

import { JurisdictionPicker } from "@/features/student/components/JurisdictionPicker";
import { ExamCentreAdviceCard } from "@/features/student/components/exam-centre/ExamCentreAdviceCard";
import { ExamCentreBatterySpotlight } from "@/features/student/components/exam-centre/ExamCentreBatterySpotlight";
import { ExamCentreHero } from "@/features/student/components/exam-centre/ExamCentreHero";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Exam Centre" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Exam Centre — a port of the Stitch "Exam Centre" mockup onto the shared
 * StudentPortalShell, per this session's "pixel-match with placeholders"
 * decision.
 *
 * Real, unchanged from the previous build of this page: the readiness bars
 * (real subject mastery), the "Assessment formats" cards (confirmed/
 * unconfirmed coverage — inverting the mock's own labels, since AMC-style
 * and selective entry-style have no question bank yet), the jurisdiction
 * picker, and the recent-papers table (real attempt history).
 *
 * Placeholder, clearly marked in their own files: the hero's readiness tile
 * uses real average mastery instead of the mock's fabricated "Cohort
 * Preparedness"/"Stage 3 Ready" framing (no cohort/class-comparison data
 * exists), and the "NAPLAN Year 5 Simulation Battery" is a fixed
 * illustrative preview — this codebase has no multi-domain "battery"
 * concept, only single-paper attempts (see ExamCentreBatterySpotlight).
 */

interface FormatCard {
  readonly tag: string;
  readonly title: string;
  readonly body: string;
  readonly meta: string;
  readonly confirmed: boolean;
  readonly href: string;
  readonly icon: typeof GraduationCap;
}

const FORMATS: readonly FormatCard[] = [
  {
    tag: "NAPLAN-style",
    title: "Numeracy and literacy",
    body: "Sections in the NAPLAN test areas, sat either as a short set or a full-length simulation.",
    meta: "Years 3 and 5 · Coverage confirmed",
    confirmed: true,
    href: "/practice?style=naplan_style",
    icon: GraduationCap,
  },
  {
    tag: "ICAS-style",
    title: "Reasoning and problem solving",
    body: "Extension-style questions rewarding close reading and unfamiliar problems, in ICAS response formats.",
    meta: "Years 3 and 5 · Coverage confirmed",
    confirmed: true,
    href: "/practice?style=icas_style",
    icon: Medal,
  },
  {
    tag: "AMC-style",
    title: "Mathematics competition style",
    body: "Multi-step reasoning and pattern problems designed to be worked rather than recalled.",
    meta: "Coverage being confirmed",
    confirmed: false,
    href: "/exam-preparation",
    icon: Sigma,
  },
  {
    tag: "Selective entry-style",
    title: "Selective and high-ability entry",
    body: "Formats vary by state and territory. Choose a jurisdiction below to see what is being written.",
    meta: "Coverage being confirmed",
    confirmed: false,
    href: "#jurisdiction",
    icon: School,
  },
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default async function StudentExamPreparationPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);

  const recent = overview.attempts.slice(0, 6);
  const blankSessions = overview.attempts.filter(
    (attempt) => attempt.attemptedQuestions === 0,
  ).length;
  const answeredAttempts = overview.attempts.length - blankSessions;

  const averageReadiness =
    overview.mastery.length === 0
      ? null
      : Math.round(overview.mastery.reduce((sum, m) => sum + m.percent, 0) / overview.mastery.length);

  return (
    <StudentPortalShell active="examCentre" breadcrumbLabel="Exam Centre" student={student} shellData={shellData}>
      <ExamCentreHero averageReadiness={averageReadiness} />

      {/* ---------- Readiness by subject ---------- */}
      <section className="grid gap-4 rounded-2xl border border-mm-line bg-white p-6">
        <h2 className="text-lg font-bold text-mm-ink">Readiness by subject</h2>
        {/*
          A paper submitted without a single answer contributes its
          marks to `available` and nothing to `earned`, so readiness
          reads a real but meaningless 0%. Naming the blank sittings
          is the difference between "you are weak at numeracy" and
          "nothing has been answered yet".
        */}
        {blankSessions > 0 && answeredAttempts === 0 && overview.mastery.length > 0 && (
          <p className="rounded-xl border border-mm-line bg-mm-tint p-3.5 text-sm leading-relaxed text-mm-ink-soft">
            These read 0% because {blankSessions === 1 ? "the paper" : "all"}{" "}
            {blankSessions === 1 ? "" : `${blankSessions} papers `}sat so far{" "}
            {blankSessions === 1 ? "was" : "were"} submitted without any answers — not
            because the questions were wrong.
          </p>
        )}
        {overview.mastery.length === 0 ? (
          <p className="text-sm leading-relaxed text-mm-muted">
            Nothing measured yet. These bars fill in from objective marks across every finished
            session — including untimed practice, so they are useful before a first simulation.
          </p>
        ) : (
          <div className="grid gap-3">
            {overview.mastery.map((subject) => (
              <div key={subject.subject} className="grid gap-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-mm-ink">{subject.label}</span>
                  <span className="text-mm-muted">{subject.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mm-line-soft">
                  <div
                    className={clsx(
                      "h-full rounded-full",
                      subject.percent >= 70
                        ? "bg-primary"
                        : subject.percent >= 55
                          ? "bg-mm-lilac"
                          : "bg-mm-coral",
                    )}
                    style={{ width: `${subject.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ExamCentreBatterySpotlight />

      {/* ---------- Format cards ---------- */}
      <section aria-labelledby="formats-heading" className="grid gap-3.5">
        <h2 id="formats-heading" className="text-xl font-bold text-mm-ink">
          Assessment formats
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FORMATS.map((format) => {
            const Icon = format.icon;
            return (
              <Link
                key={format.tag}
                href={format.href}
                className="flex flex-col gap-3 rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm transition-colors hover:border-primary/40"
              >
                <div
                  className={clsx(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    format.confirmed ? "bg-mm-tint text-primary" : "bg-mm-page text-mm-muted",
                  )}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p
                    className={clsx(
                      "font-mono text-[11px] uppercase tracking-wider",
                      format.confirmed ? "text-primary" : "text-mm-coral-text",
                    )}
                  >
                    {format.tag}
                  </p>
                  <h3 className="text-[15px] font-bold text-mm-ink">{format.title}</h3>
                  <p className="text-[13px] leading-relaxed text-mm-muted">{format.body}</p>
                  <p
                    className={clsx(
                      "mt-1 text-xs font-semibold",
                      format.confirmed ? "text-mm-muted" : "text-mm-coral-text",
                    )}
                  >
                    {format.meta}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Jurisdiction picker ---------- */}
      <section id="jurisdiction" aria-labelledby="jurisdiction-heading" className="grid gap-3.5">
        <div>
          <h2 id="jurisdiction-heading" className="text-xl font-bold text-mm-ink">
            Selective entry, by state and territory
          </h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-mm-muted">
            Selective and high-ability entry testing differs in format, eligible year levels and
            arrangements between jurisdictions. Each tile says whether its coverage is confirmed.
          </p>
        </div>
        <JurisdictionPicker />
      </section>

      {/* ---------- Recent papers ---------- */}
      <section aria-labelledby="recent-papers-heading" className="grid gap-3.5">
        <h2 id="recent-papers-heading" className="text-xl font-bold text-mm-ink">
          Recent papers
        </h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mm-line bg-white px-6 py-10 text-center">
            <p className="text-sm leading-relaxed text-mm-muted">
              Nothing sat yet. Finished papers appear here with their date and score, and each one
              keeps its worked explanations.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-mm-line bg-white">
            <ol>
              {recent.map((attempt, index) => (
                <li
                  key={attempt.id}
                  className={clsx(
                    "grid items-center gap-4 px-6 py-4 sm:grid-cols-[minmax(0,1fr)_90px_110px]",
                    index < recent.length - 1 && "border-b border-mm-line-soft",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-mm-ink">{attempt.title}</p>
                    <p className="mt-0.5 text-[13px] text-mm-muted">
                      {attempt.timing === "timed" ? "Timed" : "Untimed"}
                      {attempt.totalQuestions !== null ? ` · ${attempt.totalQuestions} questions` : ""}
                      {attempt.pendingManualReview ? " · some marks pending" : ""}
                    </p>
                  </div>
                  <p className="text-[13px] text-mm-muted">{formatDate(attempt.submittedAt)}</p>
                  <p
                    className={clsx(
                      "font-mono text-[15px] font-bold",
                      attempt.scorePercent === null
                        ? "text-mm-muted"
                        : attempt.scorePercent >= 55
                          ? "text-primary"
                          : "text-mm-coral-text",
                    )}
                  >
                    {attempt.scorePercent === null ? "Pending" : `${attempt.scorePercent}%`}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <ExamCentreAdviceCard />
    </StudentPortalShell>
  );
}
