"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Lock } from "lucide-react";

import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import type { SubjectFilter } from "@/features/exam-engine/selection/selection-config";
import {
  aboutMinutes,
  offeredSetSizes,
  STRAND_FLOOR,
  type StrandAvailability,
  type StudioAvailability,
} from "@/features/practice-studio/availability";

const STYLES = [
  { style: "naplan_style", label: "NAPLAN-style", desc: "Curriculum assessment format" },
  { style: "icas_style", label: "ICAS-style", desc: "Competition & extension format" },
] as const;

type ExamStyleKey = (typeof STYLES)[number]["style"];

interface PracticeStudioSelectorProps {
  availability: StudioAvailability;
  yearLevel: 3 | 5;
}

export function PracticeStudioSelector({
  availability,
  yearLevel,
}: PracticeStudioSelectorProps) {
  const [selectedYear, setSelectedYear] = useState<3 | 5>(yearLevel);
  const [selectedStyle, setSelectedStyle] = useState<ExamStyleKey | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Exclude<SubjectFilter, "mixed"> | null>(null);
  const [selectedStrandKey, setSelectedStrandKey] = useState<string | null>(null);
  const [selectedSetSize, setSelectedSetSize] = useState<number | null>(null);
  const [isUntimed, setIsUntimed] = useState<boolean>(true);

  // Global integrity check
  const isUnchecked = availability.integrity === "unknown";
  const forYear = availability.subjects.filter((s) => s.yearLevel === selectedYear);
  const hasAnyContentForYear = forYear.some((s) => s.state === "ready");

  // Cascading resets
  const handleYearChange = (year: 3 | 5) => {
    if (year === selectedYear) return;
    setSelectedYear(year);
    setSelectedStyle(null);
    setSelectedSubject(null);
    setSelectedStrandKey(null);
    setSelectedSetSize(null);
  };

  const handleStyleChange = (style: ExamStyleKey) => {
    setSelectedStyle(style);
    setSelectedSubject(null);
    setSelectedStrandKey(null);
    setSelectedSetSize(null);
  };

  const handleSubjectChange = (subject: Exclude<SubjectFilter, "mixed">) => {
    setSelectedSubject(subject);
    setSelectedStrandKey(null);
    setSelectedSetSize(null);
  };

  const handleStrandChange = (strand: StrandAvailability) => {
    setSelectedStrandKey(strand.strandKey);
    const availableSizes = offeredSetSizes(strand.uniqueQuestions);
    // Default to 10 if offered, else the largest available, or null
    if (availableSizes.includes(10)) {
      setSelectedSetSize(10);
    } else if (availableSizes.length > 0) {
      setSelectedSetSize(availableSizes[0]);
    } else {
      setSelectedSetSize(null);
    }
  };

  // Selected object references
  const currentSubjectObj = selectedStyle && selectedSubject
    ? forYear.find((s) => s.examStyle === selectedStyle && s.subject === selectedSubject) ?? null
    : null;

  const currentStrandObj = currentSubjectObj && selectedStrandKey
    ? currentSubjectObj.strands.find((st) => st.strandKey === selectedStrandKey) ?? null
    : null;

  const offeredSizes = currentStrandObj ? offeredSetSizes(currentStrandObj.uniqueQuestions) : [];
  const estimatedMins = currentStrandObj && selectedSetSize
    ? aboutMinutes(currentStrandObj, selectedSetSize)
    : null;

  const isConfigComplete = Boolean(
    selectedYear &&
    selectedStyle &&
    selectedSubject &&
    currentStrandObj &&
    selectedSetSize,
  );

  const startUrl = isConfigComplete
    ? `/practice/session?year=${selectedYear}&style=${selectedStyle}&subject=${selectedSubject}&count=${selectedSetSize}&strand=${encodeURIComponent(
        currentStrandObj!.strandKey,
      )}${isUntimed ? "&untimed=1" : ""}`
    : "#";

  if (isUnchecked) {
    return (
      <div role="status" className="rounded-2xl border border-mm-line bg-white p-8 text-center text-sm text-mm-muted shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mm-tint text-primary">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
          Availability check temporarily unavailable
        </h2>
        <p className="mt-1 text-mm-muted">
          We couldn&rsquo;t check what practice is available right now. Please try again in a little while.
        </p>
      </div>
    );
  }

  if (!hasAnyContentForYear) {
    return (
      <div className="rounded-2xl border border-dashed border-mm-line bg-white p-8 text-center text-sm text-mm-muted">
        <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
          No practice available
        </h2>
        <p className="mt-1">There is no practice available for Year {selectedYear} yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
      {/* 5-Step Selector Form */}
      <div className="space-y-8">
        {/* Step 1: Year Level */}
        <section aria-labelledby="step-year-heading" className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 id="step-year-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
              1. Year level
            </h2>
            <span className="text-xs font-semibold text-mm-muted">Step 1 of 5</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {[3, 5].map((y) => {
              const isEnrolledYear = y === yearLevel;
              const isSelected = selectedYear === y;
              return (
                <div key={y} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => isEnrolledYear && handleYearChange(y as 3 | 5)}
                    aria-pressed={isSelected}
                    aria-disabled={!isEnrolledYear}
                    disabled={!isEnrolledYear}
                    className={`inline-flex min-h-11 items-center justify-center rounded-btn px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-2 border-primary bg-primary text-white shadow-xs"
                        : isEnrolledYear
                        ? "border border-mm-line bg-white text-mm-ink hover:border-primary/40"
                        : "cursor-not-allowed border border-mm-line bg-mm-page text-mm-muted/60"
                    }`}
                  >
                    Year {y}
                    {!isEnrolledYear && <Lock className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />}
                  </button>
                  {!isEnrolledYear && (
                    <span className="text-[11px] text-mm-muted">
                      Enrolled in Year {yearLevel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 2: Programme */}
        <section aria-labelledby="step-programme-heading" className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 id="step-programme-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
              2. Programme
            </h2>
            <span className="text-xs font-semibold text-mm-muted">Step 2 of 5</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {STYLES.map(({ style, label, desc }) => {
              const subjectsForStyle = forYear.filter((s) => s.examStyle === style);
              const isStyleReady = subjectsForStyle.some((s) => s.state === "ready");
              const isSelected = selectedStyle === style;

              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => isStyleReady && handleStyleChange(style)}
                  disabled={!isStyleReady}
                  aria-pressed={isSelected}
                  aria-disabled={!isStyleReady}
                  className={`flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-mm-tint-soft shadow-xs ring-1 ring-primary"
                      : isStyleReady
                      ? "border-mm-line bg-white hover:border-primary/40 hover:bg-mm-tint-soft/40"
                      : "cursor-not-allowed border-mm-line bg-mm-page/70 opacity-60"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
                      {label}
                    </span>
                    {isStyleReady ? (
                      <span className="rounded-full bg-mm-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-mm-line/50 px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-mm-muted">{desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Subject */}
        {selectedStyle && (
          <section aria-labelledby="step-subject-heading" className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 id="step-subject-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
                3. Subject
              </h2>
              <span className="text-xs font-semibold text-mm-muted">Step 3 of 5</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {forYear
                .filter((s) => s.examStyle === selectedStyle)
                .map((subj) => {
                  const isSubjectReady = subj.state === "ready";
                  const isSelected = selectedSubject === subj.subject;
                  const label = SUBJECT_LABELS[subj.subject] ?? subj.subject;

                  return (
                    <button
                      key={subj.subject}
                      type="button"
                      onClick={() => isSubjectReady && handleSubjectChange(subj.subject)}
                      disabled={!isSubjectReady}
                      aria-pressed={isSelected}
                      aria-disabled={!isSubjectReady}
                      className={`flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-primary bg-mm-tint-soft shadow-xs ring-1 ring-primary"
                          : isSubjectReady
                          ? "border-mm-line bg-white hover:border-primary/40 hover:bg-mm-tint-soft/40"
                          : "cursor-not-allowed border-mm-line bg-mm-page/70 opacity-60"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                          {label}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                      </div>
                      <p className="mt-1 text-xs text-mm-muted">
                        {isSubjectReady
                          ? `${subj.uniqueQuestions} questions · ${subj.strands.filter((s) => s.eligible).length} strands ready`
                          : subj.reason === "coming_soon"
                          ? "Coming soon"
                          : "No practice available"}
                      </p>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {/* Step 4: Strand */}
        {selectedStyle && selectedSubject && currentSubjectObj && (
          <section aria-labelledby="step-strand-heading" className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 id="step-strand-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
                4. Strand
              </h2>
              <span className="text-xs font-semibold text-mm-muted">Step 4 of 5</span>
            </div>
            {currentSubjectObj.strands.length === 0 ? (
              <p className="mt-4 text-sm text-mm-muted">No strands available for this subject.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {currentSubjectObj.strands.map((strand) => {
                  const isEligible = strand.eligible;
                  const isSelected = selectedStrandKey === strand.strandKey;

                  return (
                    <button
                      key={strand.strandKey}
                      type="button"
                      onClick={() => isEligible && handleStrandChange(strand)}
                      disabled={!isEligible}
                      aria-pressed={isSelected}
                      aria-disabled={!isEligible}
                      className={`flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-primary bg-mm-tint-soft shadow-xs ring-1 ring-primary"
                          : isEligible
                          ? "border-mm-line bg-white hover:border-primary/40 hover:bg-mm-tint-soft/40"
                          : "cursor-not-allowed border-mm-line bg-mm-page/70 opacity-60"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                          {strand.strand}
                        </span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                      </div>
                      <p className="mt-1 text-xs text-mm-muted">
                        {isEligible
                          ? `${strand.uniqueQuestions} unique questions available`
                          : `${strand.uniqueQuestions ?? 0} questions (needs ${STRAND_FLOOR} to start)`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Step 5: Set options */}
        {currentStrandObj && (
          <section aria-labelledby="step-options-heading" className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 id="step-options-heading" className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
                5. Set options
              </h2>
              <span className="text-xs font-semibold text-mm-muted">Step 5 of 5</span>
            </div>

            {/* Set Size */}
            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-mm-muted">Set size</h3>
              {offeredSizes.length === 0 ? (
                <p className="text-sm text-mm-muted">No set sizes fit this strand.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {offeredSizes.map((size) => {
                    const isSelected = selectedSetSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSetSize(size)}
                        aria-pressed={isSelected}
                        className={`inline-flex min-h-11 items-center justify-center rounded-btn px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          isSelected
                            ? "border-2 border-primary bg-primary text-white shadow-xs"
                            : "border border-mm-line bg-white text-mm-ink hover:border-primary/40 hover:bg-mm-tint-soft/50"
                        }`}
                      >
                        {size} questions
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timer mode */}
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-mm-muted">Pacing</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsUntimed(true)}
                  aria-pressed={isUntimed}
                  className={`flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isUntimed
                      ? "border-primary bg-mm-tint-soft shadow-xs ring-1 ring-primary"
                      : "border border-mm-line bg-white hover:border-primary/40"
                  }`}
                >
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                    Untimed (recommended)
                  </span>
                  <p className="mt-1 text-xs text-mm-muted">
                    Work at your own pace without a clock.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUntimed(false)}
                  aria-pressed={!isUntimed}
                  className={`flex min-h-11 flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    !isUntimed
                      ? "border-primary bg-mm-tint-soft shadow-xs ring-1 ring-primary"
                      : "border border-mm-line bg-white hover:border-primary/40"
                  }`}
                >
                  <span className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                    Timed practice
                  </span>
                  <p className="mt-1 text-xs text-mm-muted">
                    {estimatedMins ? `Estimated duration: about ${estimatedMins} minutes.` : "Paced practice session."}
                  </p>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Summary Rail */}
      <aside aria-label="Practice set summary" className="h-fit space-y-4 lg:sticky lg:top-8">
        <div className="rounded-2xl border border-mm-line bg-white p-6 shadow-xs">
          <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
            Your practice set
          </h2>

          <div className="mt-4 space-y-3 divide-y divide-mm-line-soft text-sm">
            <div className="flex items-center justify-between pt-2">
              <span className="text-mm-muted">Year level</span>
              <span className="font-semibold text-mm-ink">Year {selectedYear}</span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Programme</span>
              <span className="font-semibold text-mm-ink">
                {selectedStyle
                  ? STYLES.find((s) => s.style === selectedStyle)?.label
                  : "Not selected"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Subject</span>
              <span className="font-semibold text-mm-ink">
                {selectedSubject ? SUBJECT_LABELS[selectedSubject] : "Not selected"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Strand</span>
              <span className="max-w-[160px] truncate text-right font-semibold text-mm-ink" title={currentStrandObj?.strand}>
                {currentStrandObj ? currentStrandObj.strand : "Not selected"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Questions</span>
              <span className="font-semibold text-mm-ink">
                {selectedSetSize ? `${selectedSetSize} questions` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Estimated time</span>
              <span className="font-semibold text-mm-ink">
                {estimatedMins ? `About ${estimatedMins} mins` : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <span className="text-mm-muted">Timer</span>
              <span className="font-semibold text-mm-ink">
                {isUntimed ? "Untimed" : "Timed"}
              </span>
            </div>
          </div>

          <p className="mt-4 rounded-xl bg-mm-page p-3 text-[11.5px] leading-relaxed text-mm-muted">
            Practice sets are not saved as you go. If you close the tab, your session restarts from question 1.
          </p>

          <div className="mt-5">
            {isConfigComplete ? (
              <Link
                href={startUrl}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Start practice</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-btn bg-mm-page px-5 py-3 text-sm font-semibold text-mm-muted/70"
              >
                Configure all steps to start
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
