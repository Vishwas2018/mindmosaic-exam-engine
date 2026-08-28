"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { SkillSummary, SubjectFilter } from "@/features/exam-engine/selection";
import { ISOLABLE_SUBJECT_FILTERS } from "@/features/exam-engine/selection";

import {
  DEFAULT_SKILL_PAGE_SIZE,
  MIN_DRILL_QUESTION_COUNT,
  filterPracticableSkills,
  filterSkills,
  sliceSkillsForDisplay,
} from "./skill-browser-helpers";

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

export interface SkillBrowserProps {
  skills: readonly SkillSummary[];
  /** Minimum question count required to display a skill. Default 5. */
  minQuestions?: number;
  /** Initial page size before "Show more". Default 12. */
  pageSize?: number;
}

/**
 * Subject/skill browser for the Learning Hub.
 * Exposes only practicable skills with at least 5 questions, defaults to a single
 * subject view, and provides search and pagination to prevent rendering hundreds of cards.
 */
export function SkillBrowser({
  skills,
  minQuestions = MIN_DRILL_QUESTION_COUNT,
  pageSize = DEFAULT_SKILL_PAGE_SIZE,
}: SkillBrowserProps) {
  // Only include skills with sufficient question depth
  const practicableSkills = useMemo(
    () => filterPracticableSkills(skills, minQuestions),
    [skills, minQuestions],
  );

  const availableSubjects = useMemo(() => {
    const found = new Set<SubjectFilter>();
    for (const entry of practicableSkills) found.add(entry.subject);
    return found;
  }, [practicableSkills]);

  // Order chips according to ISOLABLE_SUBJECT_FILTERS
  const orderedSubjects = useMemo(
    () => ISOLABLE_SUBJECT_FILTERS.filter((s) => availableSubjects.has(s)),
    [availableSubjects],
  );

  // Default to the first available subject instead of flooding the screen with "all"
  const defaultSubject: SubjectChip = orderedSubjects[0] ?? "all";
  const [subject, setSubject] = useState<SubjectChip>(defaultSubject);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(pageSize);

  const chips: SubjectChip[] = useMemo(
    () => (orderedSubjects.length > 1 ? ["all", ...orderedSubjects] : orderedSubjects),
    [orderedSubjects],
  );

  const filtered = useMemo(
    () =>
      filterSkills(practicableSkills, {
        subject,
        search: searchQuery,
        minQuestions,
      }),
    [practicableSkills, subject, searchQuery, minQuestions],
  );

  const { visible, totalCount, hasMore, remainingCount } = useMemo(
    () => sliceSkillsForDisplay(filtered, displayLimit),
    [filtered, displayLimit],
  );

  if (skills.length === 0 || practicableSkills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Controls: Search and Subject Chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {chips.length > 1 && (
          <div
            role="group"
            aria-label="Filter skills by subject"
            className="flex flex-wrap gap-2"
          >
            {chips.map((chip) => {
              const isActive = chip === subject;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSubject(chip);
                    setDisplayLimit(pageSize);
                  }}
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

        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="skill-search-input" className="sr-only">
            Search skills
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Search aria-hidden="true" className="h-4 w-4" />
          </div>
          <input
            id="skill-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayLimit(pageSize);
            }}
            placeholder="Search skills…"
            aria-label="Search skills"
            data-testid="skill-search-input"
            className="w-full rounded-xl border border-royal/15 bg-white py-2 pl-9 pr-3 text-xs font-medium text-ink placeholder:text-muted focus:border-royal focus:outline-none focus:ring-4 focus:ring-royal/20"
          />
        </div>
      </div>

      {/* Available skills counter */}
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <p data-testid="skill-count-summary">
          {totalCount === 0
            ? "No matching skills found"
            : `Showing ${visible.length} of ${totalCount} skill${
                totalCount === 1 ? "" : "s"
              } with 5+ questions`}
        </p>
      </div>

      {/* Skills Grid */}
      {visible.length > 0 && (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="skill-browser-grid"
        >
          {visible.map((entry) => (
            <Link
              key={`${entry.subject}-${entry.skill}`}
              href={`/practice/session?subject=${entry.subject}&skill=${encodeURIComponent(
                entry.skill,
              )}&count=5`}
              className="group rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <Card
                variant="outlined"
                className="flex h-full items-center justify-between gap-3 p-4 transition group-hover:border-royal/25"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {entry.skill}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    {SUBJECT_CHIP_LABELS[entry.subject]} · {entry.questionCount} questions
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
      )}

      {/* Show more pagination */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + pageSize)}
            data-testid="show-more-skills"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-royal/20 bg-white px-5 text-xs font-bold text-royal hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            Show more ({remainingCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
