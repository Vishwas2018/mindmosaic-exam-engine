"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SkillSummary } from "@/features/exam-engine/selection";
import {
  ISOLABLE_SUBJECT_FILTERS,
  type SubjectFilter,
} from "@/features/exam-engine/selection";

type SubjectChip = "all" | SubjectFilter;

const SUBJECT_CHIP_LABELS: Record<SubjectChip, string> = {
  all: "All subjects",
  numeracy: "Numeracy",
  reading: "Reading",
  language: "Language",
  science: "Science",
  digital_technologies: "Digital Technologies",
  spelling: "Spelling",
  mixed: "Mixed",
};

/**
 * Screen 12 subject/skill browser: every skill the bank has questions for,
 * filterable by subject, each linking straight into a Practice Engine
 * session scoped to that skill (/practice/session).
 */
export function SkillBrowser({ skills }: { skills: readonly SkillSummary[] }) {
  const [subject, setSubject] = useState<SubjectChip>("all");

  const availableSubjects = useMemo(() => {
    const found = new Set<SubjectChip>();
    for (const entry of skills) found.add(entry.subject);
    return found;
  }, [skills]);

  /* Chips follow the selection vocabulary, still narrowed to subjects the
     bank actually has skills for — a new subject appears here on its own
     once content exists, and never as an empty chip before that. */
  const chips: SubjectChip[] = [
    "all",
    ...ISOLABLE_SUBJECT_FILTERS.filter((s) => availableSubjects.has(s)),
  ];

  const filtered =
    subject === "all" ? skills : skills.filter((entry) => entry.subject === subject);

  if (skills.length === 0) return null;

  return (
    <div>
      {chips.length > 2 && (
        <div role="group" aria-label="Filter skills by subject" className="mb-4 flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isActive = chip === subject;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSubject(chip)}
                aria-pressed={isActive}
                data-testid={`skill-subject-filter-${chip}`}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-xl px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
                  isActive
                    ? "bg-royal text-white"
                    : "bg-white text-muted ring-1 ring-royal/12 hover:text-royal",
                )}
              >
                {SUBJECT_CHIP_LABELS[chip]}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="skill-browser-grid">
        {filtered.map((entry) => (
          <Link
            key={`${entry.subject}-${entry.skill}`}
            href={`/practice/session?subject=${entry.subject}&skill=${encodeURIComponent(entry.skill)}`}
            className="group rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <Card
              variant="outlined"
              className="flex h-full items-center justify-between gap-3 p-4 transition group-hover:border-royal/25"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-ink">{entry.skill}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {SUBJECT_CHIP_LABELS[entry.subject]} · {entry.questionCount} question
                  {entry.questionCount === 1 ? "" : "s"}
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-royal transition group-hover:translate-x-0.5"
              />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
