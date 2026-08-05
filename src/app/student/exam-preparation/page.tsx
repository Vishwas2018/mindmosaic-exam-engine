import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import { clsx } from "clsx";

import { EmptySlot } from "@/features/landing/components/primitives";
import { JurisdictionPicker } from "@/features/student/components/JurisdictionPicker";
import { LearnSidebar } from "@/features/student/components/LearnSidebar";
import { StudentMobileNav } from "@/features/student/components/StudentMobileNav";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Exam preparation" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Exam preparation — design handoff screen 10, views 1 and 2.
 *
 * The design puts four views behind a switcher and says explicitly that the
 * switcher is prototype scaffolding: "in product these are separate
 * routes". They are, and they already existed for two of the four:
 *
 *   Programme overview       -> this page
 *   Jurisdiction picker      -> this page (a section, not a route of its
 *                               own: it is a filter on the overview, and
 *                               it currently unlocks nothing)
 *   Simulation in progress   -> /exam
 *   Results and explanations -> /results
 *
 * Everything measurable on this page is measured. The readiness bars are
 * real subject mastery, the recent-papers table is the real attempt
 * history, and the format cards say which formats have a question bank
 * behind them — which inverts the design's own labels, because AMC-style
 * and selective entry-style have none (DESIGN_AUDIT.md §14).
 */

interface FormatCard {
  readonly tag: string;
  readonly title: string;
  readonly body: string;
  readonly meta: string;
  readonly confirmed: boolean;
  readonly href: string;
  readonly slot: string;
}

const FORMATS: readonly FormatCard[] = [
  {
    tag: "NAPLAN-style",
    title: "Numeracy and literacy",
    body: "Sections in the NAPLAN test areas, sat either as a short set or a full-length simulation.",
    meta: "Years 3 and 5 · Coverage confirmed",
    confirmed: true,
    href: "/practice?style=naplan_style",
    slot: "Screenshot — NAPLAN-style paper start screen",
  },
  {
    tag: "ICAS-style",
    title: "Reasoning and problem solving",
    body: "Extension-style questions rewarding close reading and unfamiliar problems, in ICAS response formats.",
    meta: "Years 3 and 5 · Coverage confirmed",
    confirmed: true,
    href: "/practice?style=icas_style",
    slot: "Screenshot — ICAS-style paper",
  },
  {
    tag: "AMC-style",
    title: "Mathematics competition style",
    body: "Multi-step reasoning and pattern problems designed to be worked rather than recalled.",
    meta: "Coverage being confirmed",
    confirmed: false,
    href: "/exam-preparation",
    slot: "Screenshot — AMC-style paper",
  },
  {
    tag: "Selective entry-style",
    title: "Selective and high-ability entry",
    body: "Formats vary by state and territory. Choose a jurisdiction below to see what is being written.",
    meta: "Coverage being confirmed",
    confirmed: false,
    href: "#jurisdiction",
    slot: "Screenshot — selective entry paper",
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
  const recent = overview.attempts.slice(0, 6);

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <LearnSidebar
        active="exam"
        displayName={student.displayName}
        yearLevel={student.yearLevel}
      />

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-5 border-b border-mm-line bg-mm-page/96 px-[clamp(20px,3vw,40px)] backdrop-blur-[6px]">
          <div className="grid min-w-0 flex-auto gap-0.5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
              Exam preparation
            </p>
            <h1 className="truncate text-[19px] font-bold text-mm-ink">
              Assessment-style papers under exam conditions
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
              href="/practice?timing=timed"
              className="inline-flex min-h-[42px] items-center rounded-[10px] bg-mm-brand px-4 text-[14.5px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
            >
              Start a simulation
            </Link>
          </div>
        </header>

        <div className="lg:hidden">
          <StudentMobileNav active="learn" />
        </div>

        <div className="grid gap-[clamp(16px,1.8vw,24px)] px-[clamp(20px,3vw,40px)] pb-14 pt-[clamp(20px,2.4vw,32px)]">
          {/* ---------- Next sitting + readiness ---------- */}
          <section className="grid items-start gap-[clamp(16px,1.8vw,24px)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <article className="grid gap-3 rounded-[18px] border border-mm-tint-line-strong bg-mm-wash p-[clamp(20px,2vw,28px)]">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-brand">
                Next sitting
              </p>
              {/*
                The design shows a scheduled simulation with a date. There
                is no scheduling in this product — a sitting is configured
                and started on the spot — so this says what actually
                happens rather than inventing a calendar.
              */}
              <h2 className="text-[clamp(22px,2.2vw,30px)] font-bold leading-[1.15] text-mm-ink">
                Nothing is scheduled — a simulation starts when you do
              </h2>
              <p className="text-[15.5px] leading-[1.6] text-mm-muted">
                Choose a format, year level and length, and the paper starts immediately under
                exam conditions: a countdown, flag for review, autosave and a review screen before
                submitting. Results and explanations are released once it is submitted.
              </p>
              <div className="mt-1 flex flex-wrap gap-2.5">
                <Link
                  href="/practice?timing=timed"
                  className="inline-flex min-h-12 items-center rounded-[11px] bg-mm-brand px-[22px] text-[15px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  Set up a simulation
                </Link>
                <Link
                  href="/results"
                  className="inline-flex min-h-12 items-center rounded-[11px] border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  Review your last paper
                </Link>
              </div>
            </article>

            <div className="grid gap-4 rounded-[18px] border border-mm-line bg-white p-[clamp(20px,2vw,26px)]">
              <h2 className="text-[17.5px] font-bold text-mm-ink">Readiness by subject</h2>
              {overview.mastery.length === 0 ? (
                <p className="text-[14.5px] leading-[1.55] text-mm-muted">
                  Nothing measured yet. These bars fill in from objective marks across every
                  finished session — including untimed practice, so they are useful before a first
                  simulation.
                </p>
              ) : (
                <div className="grid gap-3">
                  {overview.mastery.map((subject) => (
                    <div key={subject.subject} className="grid gap-[7px]">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="font-semibold text-mm-ink">{subject.label}</span>
                        <span className="text-mm-muted">{subject.percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-sm bg-mm-line-soft">
                        <div
                          className={clsx(
                            "h-full rounded-sm",
                            subject.percent >= 70
                              ? "bg-mm-brand"
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
            </div>
          </section>

          {/* ---------- Format cards ---------- */}
          <section aria-labelledby="formats-heading" className="grid gap-3.5">
            <h2 id="formats-heading" className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink">
              Assessment formats
            </h2>
            <div className="grid gap-[clamp(16px,1.8vw,24px)] sm:grid-cols-2 xl:grid-cols-4">
              {FORMATS.map((format) => (
                <Link
                  key={format.tag}
                  href={format.href}
                  className="grid grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-mm-line bg-white transition-colors hover:border-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  <div className="relative aspect-video border-b border-mm-line bg-mm-tint">
                    <EmptySlot label={format.slot} />
                  </div>
                  <div className="grid content-start gap-2 p-5">
                    <p
                      className={clsx(
                        "font-mono text-[11px] uppercase tracking-[0.06em]",
                        format.confirmed ? "text-mm-brand" : "text-mm-coral-text",
                      )}
                    >
                      {format.tag}
                    </p>
                    <h3 className="text-[17px] font-bold text-mm-ink">{format.title}</h3>
                    <p className="text-[14.5px] leading-[1.55] text-mm-muted">{format.body}</p>
                    <p
                      className={clsx(
                        "mt-1 text-[13px] font-semibold",
                        format.confirmed ? "text-mm-muted" : "text-mm-coral-text",
                      )}
                    >
                      {format.meta}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ---------- Jurisdiction picker ---------- */}
          <section id="jurisdiction" aria-labelledby="jurisdiction-heading" className="grid gap-3.5">
            <div>
              <h2
                id="jurisdiction-heading"
                className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink"
              >
                Selective entry, by state and territory
              </h2>
              <p className="mt-2 max-w-[70ch] text-[15px] leading-[1.55] text-mm-muted">
                Selective and high-ability entry testing differs in format, eligible year levels and
                arrangements between jurisdictions. Each tile says whether its coverage is confirmed.
              </p>
            </div>
            <JurisdictionPicker />
          </section>

          {/* ---------- Recent papers ---------- */}
          <section aria-labelledby="recent-papers-heading" className="grid gap-3.5">
            <h2
              id="recent-papers-heading"
              className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink"
            >
              Recent papers
            </h2>
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-mm-tint-line-strong bg-white px-6 py-10 text-center">
                <p className="text-[15px] leading-[1.6] text-mm-muted">
                  Nothing sat yet. Finished papers appear here with their date and score, and each
                  one keeps its worked explanations.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-mm-line bg-white">
                <ol>
                  {recent.map((attempt, index) => (
                    <li
                      key={attempt.id}
                      className={clsx(
                        "grid items-center gap-4 px-[clamp(20px,2vw,26px)] py-4 sm:grid-cols-[minmax(0,1fr)_90px_110px]",
                        index < recent.length - 1 && "border-b border-mm-line-soft",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-mm-ink">
                          {attempt.title}
                        </p>
                        <p className="mt-0.5 text-[13px] text-mm-muted">
                          {attempt.timing === "timed" ? "Timed" : "Untimed"}
                          {attempt.totalQuestions !== null
                            ? ` · ${attempt.totalQuestions} questions`
                            : ""}
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
                              ? "text-mm-brand"
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
        </div>
      </div>
    </div>
  );
}
