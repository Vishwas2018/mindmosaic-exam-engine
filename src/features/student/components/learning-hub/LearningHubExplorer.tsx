"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ChevronDown,
  Clock,
  Compass,
  GraduationCap,
  PlayCircle,
  School,
  Sparkles,
} from "lucide-react";
import type { LessonPathway } from "@/features/curriculum/lessons/types";

const STRAND_LABELS: Record<string, string> = {
  number: "Number",
  algebra: "Algebra",
  measurement: "Measurement",
  space: "Space",
  statistics: "Statistics",
  probability: "Probability",
  language: "Language & Grammar",
  literature: "Literature",
  literacy: "Reading & Literacy",
};

interface LearningHubExplorerProps {
  initialYearLevel: number | null;
  pathwaysByYear: Record<number, readonly LessonPathway[]>;
  hasPriorAttempts?: boolean;
}

export function LearningHubExplorer({
  initialYearLevel,
  pathwaysByYear,
  hasPriorAttempts = false,
}: LearningHubExplorerProps) {
  // Available years in the curriculum catalogue
  const availableYears = Object.keys(pathwaysByYear)
    .map(Number)
    .sort((a, b) => a - b);

  // If initialYearLevel is supported, use it; otherwise default to 3 (or the first available)
  const defaultYear =
    initialYearLevel !== null && availableYears.includes(initialYearLevel)
      ? initialYearLevel
      : (availableYears[0] ?? 3);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedArea, setSelectedArea] = useState<"all" | "Mathematics" | "English">("all");

  const yearHeadingId = useId();
  const areaHeadingId = useId();

  const currentPathways = pathwaysByYear[selectedYear] ?? [];

  // Group current pathways by learning area
  const mathsPathways = currentPathways.filter((p) =>
    ["number", "algebra", "measurement", "space", "statistics", "probability"].includes(p.strand),
  );
  const englishPathways = currentPathways.filter((p) =>
    ["language", "literature", "literacy"].includes(p.strand),
  );

  const totalLessons = currentPathways.reduce((sum, p) => sum + p.nodes.length, 0);
  const mathsLessons = mathsPathways.reduce((sum, p) => sum + p.nodes.length, 0);
  const englishLessons = englishPathways.reduce((sum, p) => sum + p.nodes.length, 0);

  // Filtered pathways for display
  const displayedPathways =
    selectedArea === "Mathematics"
      ? mathsPathways
      : selectedArea === "English"
        ? englishPathways
        : currentPathways;

  return (
    <div className="space-y-6">
      {/* Welcome banner — First visit vs Returning (Honest, zero invented progress) */}
      <div className="rounded-2xl border border-mm-line bg-gradient-to-r from-mm-tint/40 via-white to-teal-light/20 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
                {hasPriorAttempts ? "Welcome back to your lessons" : "Welcome to the Learning Hub"}
              </h2>
              <p className="mt-0.5 text-xs text-mm-muted sm:text-sm">
                {hasPriorAttempts
                  ? "Pick any strand below to review core ideas or practice worked examples. Learn at your own pace."
                  : "Explore core ideas, step-by-step worked examples, and check-in practice questions. There are no test clocks or scores here."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mm-line bg-white px-3 py-1 text-xs font-semibold text-mm-ink shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Full curriculum access</span>
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Year Picker + Learning Area Picker */}
      <div className="rounded-2xl border border-mm-line bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Year Level Picker */}
          <div>
            <span
              id={yearHeadingId}
              className="block text-[11px] font-bold uppercase tracking-wider text-mm-muted mb-2"
            >
              Curriculum Year Level
            </span>
            <div
              role="group"
              aria-labelledby={yearHeadingId}
              className="inline-flex flex-wrap items-center gap-2"
            >
              {availableYears.map((year) => {
                const isSelected = selectedYear === year;
                return (
                  <button
                    key={year}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedYear(year)}
                    className={`inline-flex min-h-[38px] items-center gap-2 rounded-btn px-4 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "border border-mm-line bg-white text-mm-ink hover:bg-slate-50"
                    }`}
                  >
                    <span>Year {year}</span>
                    {initialYearLevel === year && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-mm-muted"
                        }`}
                      >
                        Your Year
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning Area Segmented Picker */}
          <div>
            <span
              id={areaHeadingId}
              className="block text-[11px] font-bold uppercase tracking-wider text-mm-muted mb-2"
            >
              Learning Area
            </span>
            <div
              role="group"
              aria-labelledby={areaHeadingId}
              className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-mm-line bg-slate-50/70 p-1"
            >
              <button
                type="button"
                aria-pressed={selectedArea === "all"}
                onClick={() => setSelectedArea("all")}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedArea === "all"
                    ? "bg-white text-mm-ink shadow-2xs font-bold"
                    : "text-mm-muted hover:text-mm-ink"
                }`}
              >
                <span>All Areas</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-mm-muted">
                  {totalLessons}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={selectedArea === "Mathematics"}
                onClick={() => setSelectedArea("Mathematics")}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedArea === "Mathematics"
                    ? "bg-white text-primary shadow-2xs font-bold"
                    : "text-mm-muted hover:text-mm-ink"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mathematics</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-mm-muted">
                  {mathsLessons}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={selectedArea === "English"}
                onClick={() => setSelectedArea("English")}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedArea === "English"
                    ? "bg-white text-teal-accent shadow-2xs font-bold"
                    : "text-mm-muted hover:text-mm-ink"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>English</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-mm-muted">
                  {englishLessons}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State: No Content for Selected Year */}
      {currentPathways.length === 0 && (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-mm-line bg-white p-8 text-center shadow-xs"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mm-tint text-primary">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
            Year {selectedYear} lessons haven&rsquo;t been published yet
          </h3>
          <p className="mt-2 max-w-md mx-auto text-sm leading-relaxed text-mm-muted">
            Our curriculum specialists author each lesson with step-by-step worked examples and verified practice. In the meantime, you can explore Year 3 or Year 5 lessons.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {availableYears
              .filter((y) => (pathwaysByYear[y] ?? []).length > 0)
              .map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-btn bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Explore Year {year}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Empty State: No Content for Selected Filter */}
      {currentPathways.length > 0 && displayedPathways.length === 0 && (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-mm-line bg-white p-8 text-center shadow-xs"
        >
          <p className="text-sm font-semibold text-mm-ink">
            No strands found for &ldquo;{selectedArea}&rdquo; in Year {selectedYear}.
          </p>
          <button
            type="button"
            onClick={() => setSelectedArea("all")}
            className="mt-4 inline-flex min-h-[38px] items-center gap-1.5 rounded-btn bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Show All Areas
          </button>
        </div>
      )}

      {/* Strands List — Interactive Disclosures */}
      {displayedPathways.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-mm-muted">
              {displayedPathways.length} Strand{displayedPathways.length === 1 ? "" : "s"} &middot; {displayedPathways.reduce((s, p) => s + p.nodes.length, 0)} Structured Lessons
            </span>
            <span className="text-xs text-mm-muted">
              Click any strand header to expand or collapse
            </span>
          </div>

          <div className="space-y-3">
            {displayedPathways.map((pathway) => {
              const strandLabel = STRAND_LABELS[pathway.strand] ?? pathway.strand;
              const isMaths = [
                "number",
                "algebra",
                "measurement",
                "space",
                "statistics",
                "probability",
              ].includes(pathway.strand);
              const totalPractice = pathway.nodes.reduce((sum, n) => sum + n.questionCount, 0);

              return (
                <details
                  key={`${selectedYear}-${pathway.strand}`}
                  open
                  className="group rounded-2xl border border-mm-line bg-white shadow-xs overflow-hidden transition-all"
                >
                  <summary className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer list-none select-none hover:bg-slate-50/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
                    <div className="space-y-1.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            isMaths
                              ? "bg-primary-tint text-primary"
                              : "bg-teal-light text-teal-accent"
                          }`}
                        >
                          {isMaths ? "Mathematics" : "English"}
                        </span>
                        <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
                          {strandLabel}
                        </h3>
                        <span className="text-mm-line">&bull;</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-mm-muted">
                          {pathway.nodes.length} lesson{pathway.nodes.length === 1 ? "" : "s"}
                        </span>
                        {totalPractice > 0 && (
                          <span className="rounded-full bg-teal-light px-2 py-0.5 text-xs font-semibold text-teal-accent">
                            {totalPractice} practice questions
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-mm-muted line-clamp-2 max-w-3xl">
                        {pathway.description}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-mm-muted">
                      <span className="hidden sm:inline group-open:hidden">Show lessons</span>
                      <span className="hidden sm:inline sm:group-open:inline">Hide lessons</span>
                      <ChevronDown
                        className="h-5 w-5 text-mm-muted transition-transform duration-200 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </div>
                  </summary>

                  {/* Disclosure Body: Sequenced Lessons */}
                  <div className="border-t border-mm-line bg-slate-50/40 p-4 sm:p-5">
                    <ol className="space-y-3">
                      {pathway.nodes.map((node, index) => {
                        const lessonHref = `/student/learn/lessons/${node.curriculumCode}`;
                        const drillHref = `/practice/session?curriculumCode=${encodeURIComponent(
                          node.curriculumCode,
                        )}&count=5`;
                        const hasPractice = !node.isClassroomOnly && node.questionCount > 0;

                        return (
                          <li
                            key={node.curriculumCode}
                            className="rounded-xl border border-mm-line bg-white p-4 shadow-2xs hover:border-primary/40 transition-colors"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-1.5 min-w-0">
                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-white">
                                    {index + 1}
                                  </span>
                                  {/* Curriculum code shown as recorded with NO alignment claim */}
                                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                                    {node.curriculumCode}
                                  </span>
                                  <span className="text-mm-line">&bull;</span>
                                  <span className="inline-flex items-center gap-1 text-mm-muted">
                                    <Clock className="h-3 w-3" aria-hidden="true" />
                                    <span>{node.estimatedMinutes} mins</span>
                                  </span>
                                  <span className="text-mm-line">&bull;</span>
                                  {node.isClassroomOnly ? (
                                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                                      <School className="h-3 w-3" aria-hidden="true" />
                                      <span>Classroom-only skill</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded border border-teal-border bg-teal-light px-1.5 py-0.5 text-[11px] font-semibold text-teal-accent">
                                      <span>
                                        {node.questionCount} practice question{node.questionCount === 1 ? "" : "s"}
                                      </span>
                                    </span>
                                  )}
                                </div>

                                {/* Title & Intention */}
                                <div>
                                  <Link
                                    href={lessonHref}
                                    className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
                                  >
                                    {node.title}
                                  </Link>
                                  <p className="mt-0.5 text-xs leading-relaxed text-mm-muted sm:text-sm">
                                    {node.learningIntention}
                                  </p>
                                </div>

                                {/* Prerequisites */}
                                {node.prerequisites.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-mm-muted">
                                    <span className="font-semibold">Prerequisites:</span>
                                    {node.prerequisites.map((prereq) => (
                                      <Link
                                        key={prereq}
                                        href={`/student/learn/lessons/${prereq}`}
                                        className="font-mono font-semibold text-primary hover:underline"
                                      >
                                        {prereq}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Action CTAs */}
                              <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 md:pt-0">
                                <Link
                                  href={lessonHref}
                                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-btn bg-primary px-4 text-xs font-bold text-white shadow-2xs hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                                >
                                  <span>Start Lesson</span>
                                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                </Link>

                                {hasPractice ? (
                                  <Link
                                    href={drillHref}
                                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-btn border border-mm-line bg-white px-3 text-xs font-semibold text-mm-ink shadow-2xs hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                                  >
                                    <PlayCircle className="h-3.5 w-3.5 text-teal-accent" aria-hidden="true" />
                                    <span>Practise drill</span>
                                  </Link>
                                ) : (
                                  <span className="inline-flex min-h-[38px] items-center px-2 text-xs font-semibold text-mm-muted">
                                    {node.isClassroomOnly ? "Practised in class" : "Practice coming soon"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
