"use client";

import { ClipboardList, Clock, ShieldCheck } from "lucide-react";

import type { MockExamSectionKey } from "../lib/practice";

const OFFICIAL_MOCK_SECTIONS: readonly {
  readonly key: Exclude<MockExamSectionKey, "full_mock">;
  readonly title: string;
  readonly questions: number;
  readonly minutes: number;
}[] = [
  { key: "verbal_reasoning", title: "Mock Section 1 — Verbal Reasoning", questions: 45, minutes: 30 },
  { key: "numerical_reasoning", title: "Mock Section 2 — Numerical Reasoning", questions: 40, minutes: 30 },
  { key: "reading", title: "Mock Section 3 — Reading Comprehension", questions: 35, minutes: 30 },
  { key: "numeracy", title: "Mock Section 4 — Mathematics", questions: 40, minutes: 30 },
  { key: "writing", title: "Mock Section 5 — Written Expression", questions: 1, minutes: 15 },
];

const TIMED_SECTIONAL_TESTS = [
  { key: "numeracy", title: "Mathematics Timed Drill", questions: 15, minutes: 15 },
  { key: "numerical_reasoning", title: "Numerical Reasoning Timed Drill", questions: 15, minutes: 15 },
  { key: "verbal_reasoning", title: "Verbal Reasoning Timed Drill", questions: 20, minutes: 15 },
  { key: "reading", title: "Reading Comprehension Timed Drill", questions: 10, minutes: 15 },
] as const;

export function VihaanMockExams({
  reservedCount = 166,
  practiceAvailableCounts = {},
  onStartSectional,
  onStartMockSection,
}: {
  reservedCount?: number;
  practiceAvailableCounts?: Readonly<Record<string, number>>;
  onStartSectional?: (subject: string, questionCount: number, minutes: number) => void;
  onStartMockSection?: (section: MockExamSectionKey, minutes: number, label: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section
        data-testid="vihaan-sectional-tests"
        className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Timed sectional tests</h2>
          </div>
          <span className="rounded border border-mm-line bg-mm-tint/40 px-2.5 py-0.5 text-[11px] font-semibold text-mm-muted">
            15-minute pacing drills (practice pool)
          </span>
        </div>
        <p className="text-sm text-mm-muted">
          Build examination speed using timed practice drills drawn strictly from your
          practice pool.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TIMED_SECTIONAL_TESTS.map((test) => {
            const available = practiceAvailableCounts[test.key] ?? 0;
            const actualCount = Math.min(test.questions, available);
            return (
              <div
                key={test.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mm-line bg-mm-page/50 p-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-ink">{test.title}</h3>
                  <p className="mt-1 text-xs text-mm-muted">
                    {actualCount} questions · {test.minutes}-minute countdown
                  </p>
                </div>
                <button
                  type="button"
                  data-testid={`sectional-start-${test.key}`}
                  disabled={!onStartSectional || actualCount === 0}
                  onClick={() => onStartSectional?.(test.key, actualCount, test.minutes)}
                  className="rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:opacity-50"
                >
                  Start timed test
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section
        data-testid="vihaan-mock-exams"
        className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Official-style Mock Examinations</h2>
          </div>
          <span
            data-testid="mock-reserved-pool-badge"
            className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {reservedCount === 0 ? "Unseen mock papers: not available yet" : `${reservedCount} unseen questions reserved exclusively for Mock Exams`}
          </span>
        </div>

        {reservedCount === 0 && (
          <p
            data-testid="mock-unseen-unavailable"
            role="note"
            className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            New unseen mock papers are being prepared and are not ready yet. The earlier mock-style questions are now
            part of your normal practice, so use Practice and the timed sectional tests above in the meantime.
          </p>
        )}

        <p className="text-sm text-mm-muted">
          Four 30-minute objective sections plus a 15-minute written expression task drawn only
          from the {reservedCount}-question quarantined mock bank. Practise individual timed sections
          or sit the full 161-question timed paper.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-mm-tint/30 p-4">
          <div>
            <p className="text-sm font-bold text-ink">
              Full 5-Section Timed Mock Paper (161 questions · 135 minutes)
            </p>
            <p className="mt-0.5 text-xs text-mm-muted">
              45 Verbal · 40 Numerical · 35 Reading (7 unseen passages) · 40 Mathematics · 1 Writing
            </p>
          </div>
          <button
            type="button"
            data-testid="mock-start-full"
            disabled={!onStartMockSection || reservedCount === 0}
            onClick={() =>
              onStartMockSection?.("full_mock", 135, "Full 5-Section Mock Examination")
            }
            className="rounded-btn border border-primary bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
          >
            Start full mock exam
          </button>
        </div>

        <div className="space-y-3">
          {OFFICIAL_MOCK_SECTIONS.map((section) => (
            <div
              key={section.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mm-line bg-mm-page/50 p-4"
            >
              <div>
                <h3 className="text-sm font-bold text-ink">{section.title}</h3>
                <p className="mt-1 text-xs text-mm-muted">
                  {section.questions} reserved unseen {section.questions === 1 ? "task" : "questions"} ·{" "}
                  {section.minutes}-minute timer
                </p>
              </div>
              <button
                type="button"
                data-testid={`mock-start-${section.key}`}
                disabled={!onStartMockSection || reservedCount === 0}
                onClick={() => onStartMockSection?.(section.key, section.minutes, section.title)}
                className="rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:opacity-50"
              >
                Start timed section
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
