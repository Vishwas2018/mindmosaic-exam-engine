"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import type { Program } from "../catalogue";
import { isProgramLocked, type StudentPlan } from "../entitlement";
import { LockedProgramCard, ProgramCard } from "./ProgramCard";

type SubjectChip = "all" | "numeracy" | "reading" | "language";

const SUBJECT_CHIP_LABELS: Record<SubjectChip, string> = {
  all: "All subjects",
  numeracy: "Numeracy",
  reading: "Reading",
  language: "Language",
};

/**
 * Screen 8 (session selection) subject filter over the live catalogue grid.
 * Client-only state — the server-rendered program list never changes, only
 * which of it is shown. `plan` defaults to "free": no program is locked by
 * default (see isProgramLocked), so this only starts gating cards once a
 * caller passes a resolved viewer plan.
 */
export function ProgramGrid({
  programs,
  alwaysShown = [],
  plan = "free",
}: {
  programs: readonly Program[];
  /** Rendered after the filtered set regardless of the active subject chip — e.g. an unscoped "build your own" program. */
  alwaysShown?: readonly Program[];
  plan?: StudentPlan;
}) {
  const availableSubjects = useMemo(() => {
    const found = new Set<SubjectChip>();
    for (const program of programs) {
      if (program.scope) found.add(program.scope.subject);
    }
    return found;
  }, [programs]);

  const [subject, setSubject] = useState<SubjectChip>("all");

  const chips: SubjectChip[] = [
    "all",
    ...(["numeracy", "reading", "language"] as const).filter((s) =>
      availableSubjects.has(s),
    ),
  ];

  const filtered = (
    subject === "all"
      ? programs
      : programs.filter((program) => program.scope?.subject === subject)
  ).concat(alwaysShown);

  return (
    <div>
      {chips.length > 2 && (
        <div
          role="group"
          aria-label="Filter by subject"
          className="mb-6 flex flex-wrap gap-2"
        >
          {chips.map((chip) => {
            const isActive = chip === subject;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setSubject(chip)}
                aria-pressed={isActive}
                data-testid={`subject-filter-${chip}`}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20",
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="program-grid">
        {filtered.map((program) =>
          isProgramLocked(program, plan) ? (
            <LockedProgramCard key={program.id} program={program} />
          ) : (
            <ProgramCard key={program.id} program={program} />
          ),
        )}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl bg-page px-4 py-8 text-center text-sm font-semibold text-muted">
          No programs match this subject yet.
        </p>
      )}
    </div>
  );
}
