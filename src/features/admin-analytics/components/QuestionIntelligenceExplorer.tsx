"use client";

import { useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import { clsx } from "clsx";

import { Badge, Select } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import {
  LOW_DISCRIMINATION,
  TOO_EASY_ACCURACY_PCT,
  TOO_HARD_ACCURACY_PCT,
} from "../item-statistics";
import type { QuestionHealth, QuestionIntelligenceRow } from "../types";

const HEALTH_LABELS: Record<QuestionHealth, string> = {
  healthy: "Healthy",
  too_easy: "Too easy",
  too_hard: "Too hard",
  low_discrimination: "Low discrimination",
  insufficient_data: "Needs more attempts",
};

const HEALTH_BADGES: Record<QuestionHealth, BadgeVariant> = {
  healthy: "success",
  too_easy: "warning",
  too_hard: "error",
  low_discrimination: "warning",
  insufficient_data: "neutral",
};

export function HealthBadge({ health }: { health: QuestionHealth }) {
  return <Badge variant={HEALTH_BADGES[health]}>{HEALTH_LABELS[health]}</Badge>;
}

type SortKey = "questionId" | "accuracy" | "attempts" | "discrimination";

function interpretation(row: QuestionIntelligenceRow): string[] {
  const notes: string[] = [];
  if (row.health === "insufficient_data") {
    notes.push(
      "Too few attempts to judge this item yet — statistics accrue as it is delivered.",
    );
    return notes;
  }
  if (row.accuracyPct !== null && row.accuracyPct >= TOO_EASY_ACCURACY_PCT) {
    notes.push(
      "Very high accuracy: this item may be too easy for its target cohort and adds little assessment signal.",
    );
  } else if (row.accuracyPct !== null && row.accuracyPct < TOO_HARD_ACCURACY_PCT) {
    notes.push(
      "Low accuracy: the item may be too difficult — or ambiguous or miskeyed, which is worth ruling out first.",
    );
  } else {
    notes.push("Accuracy sits inside the healthy range for a live item.");
  }
  if (row.discrimination !== null) {
    if (row.discrimination < LOW_DISCRIMINATION) {
      notes.push(
        "Low discrimination: attempts that get this right do not otherwise score much higher than attempts that miss it, so the item separates ability poorly.",
      );
    } else {
      notes.push(
        "Discrimination is acceptable: correct answers on this item track with stronger overall attempts.",
      );
    }
  }
  return notes;
}

/**
 * Question performance table with a slide-over detail panel (mockup 16).
 * Every figure shown is an aggregate item statistic joined to bank
 * metadata — no answer keys, no per-student rows.
 */
export function QuestionIntelligenceExplorer({
  questions,
}: {
  questions: QuestionIntelligenceRow[];
}) {
  const [healthFilter, setHealthFilter] = useState<QuestionHealth | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("questionId");
  const [openId, setOpenId] = useState<string | null>(null);

  const subjects = useMemo(
    () => [...new Set(questions.map((row) => row.subject))].sort(),
    [questions],
  );

  const visible = useMemo(() => {
    const filtered = questions.filter(
      (row) =>
        (healthFilter === "all" || row.health === healthFilter) &&
        (subjectFilter === "all" || row.subject === subjectFilter),
    );
    const sorted = [...filtered];
    switch (sortKey) {
      case "accuracy":
        sorted.sort((a, b) => (a.accuracyPct ?? -1) - (b.accuracyPct ?? -1));
        break;
      case "attempts":
        sorted.sort((a, b) => b.attempts - a.attempts);
        break;
      case "discrimination":
        sorted.sort(
          (a, b) => (a.discrimination ?? -1) - (b.discrimination ?? -1),
        );
        break;
      default:
        sorted.sort((a, b) => a.questionId.localeCompare(b.questionId));
    }
    return sorted;
  }, [questions, healthFilter, subjectFilter, sortKey]);

  const open = openId
    ? (questions.find((row) => row.questionId === openId) ?? null)
    : null;

  const headCell =
    "px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted";
  const bodyCell = "border-t border-royal/8 px-4 py-3 text-sm";

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Select
          id="qi-health"
          label="Status"
          value={healthFilter}
          onChange={(event) =>
            setHealthFilter(event.currentTarget.value as QuestionHealth | "all")
          }
        >
          <option value="all">All statuses</option>
          {Object.entries(HEALTH_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          id="qi-subject"
          label="Subject"
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.currentTarget.value)}
        >
          <option value="all">All subjects</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </Select>
        <Select
          id="qi-sort"
          label="Sort by"
          value={sortKey}
          onChange={(event) => setSortKey(event.currentTarget.value as SortKey)}
        >
          <option value="questionId">Question id</option>
          <option value="accuracy">Accuracy (lowest first)</option>
          <option value="discrimination">Discrimination (lowest first)</option>
          <option value="attempts">Attempts (highest first)</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-royal/15 bg-white">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Per-question aggregate item statistics
          </caption>
          <thead>
            <tr>
              <th scope="col" className={headCell}>
                Question
              </th>
              <th scope="col" className={headCell}>
                Subject
              </th>
              <th scope="col" className={headCell}>
                Accuracy
              </th>
              <th scope="col" className={headCell}>
                Discrimination
              </th>
              <th scope="col" className={headCell}>
                Attempts
              </th>
              <th scope="col" className={headCell}>
                Status
              </th>
              <th scope="col" className={headCell}>
                <span className="sr-only">Detail</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.questionId} className="hover:bg-royal/3">
                <td className={bodyCell}>
                  <p className="font-mono text-xs text-muted">{row.questionId}</p>
                  <p className="mt-0.5 max-w-[320px] truncate font-semibold text-ink">
                    {row.promptExcerpt}
                  </p>
                </td>
                <td className={clsx(bodyCell, "text-muted")}>{row.subject}</td>
                <td className={clsx(bodyCell, "font-bold tabular-nums text-ink")}>
                  {row.accuracyPct === null ? "—" : `${row.accuracyPct}%`}
                </td>
                <td className={clsx(bodyCell, "tabular-nums text-muted")}>
                  {row.discrimination === null
                    ? "—"
                    : row.discrimination.toFixed(2)}
                </td>
                <td className={clsx(bodyCell, "tabular-nums text-muted")}>
                  {row.attempts}
                </td>
                <td className={bodyCell}>
                  <HealthBadge health={row.health} />
                </td>
                <td className={bodyCell}>
                  <button
                    type="button"
                    onClick={() => setOpenId(row.questionId)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-royal transition hover:bg-royal/8"
                  >
                    <Eye aria-hidden="true" className="h-3.5 w-3.5" />
                    Detail
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td className={clsx(bodyCell, "text-muted")} colSpan={7}>
                  No questions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={`${open.questionId} detail`}
        >
          <button
            type="button"
            aria-label="Close detail panel"
            onClick={() => setOpenId(null)}
            className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-royal/10 bg-white px-5 py-4">
              <h3 className="font-mono text-sm font-bold text-ink">
                {open.questionId}
              </h3>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted transition hover:bg-royal/8 hover:text-ink"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                  Question
                </p>
                <p className="mt-1 text-sm leading-6 text-ink">
                  {open.promptExcerpt}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ["Subject", open.subject],
                  ["Strand", open.strand],
                  ["Topic", open.topic],
                  ["Skill", open.skill ?? "—"],
                  ["Authored difficulty", open.difficulty],
                  ["Year level", `Year ${open.yearLevel}`],
                  ["Exam style", open.examStyle],
                  ["Attempts", String(open.attempts)],
                  [
                    "Accuracy",
                    open.accuracyPct === null ? "—" : `${open.accuracyPct}%`,
                  ],
                  [
                    "Discrimination",
                    open.discrimination === null
                      ? "—"
                      : open.discrimination.toFixed(2),
                  ],
                  ["Correct", String(open.correct)],
                  ["Missed", String(open.incorrect + open.unanswered)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-royal/10 bg-page px-3 py-2.5"
                  >
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                  Status
                </p>
                <div className="mt-2">
                  <HealthBadge health={open.health} />
                </div>
              </div>
              <div className="rounded-xl border border-royal/10 bg-page p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                  Interpretation
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                  {interpretation(open).map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
              <p className="text-xs leading-5 text-muted">
                Figures are aggregates across all submitted attempts. Answer keys
                and per-student responses are not available on this screen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
