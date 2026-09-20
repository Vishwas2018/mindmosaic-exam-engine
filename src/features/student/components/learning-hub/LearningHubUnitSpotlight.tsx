import Link from "next/link";
import { BookOpen, PlayCircle, Sparkles, Verified } from "lucide-react";

import type { LessonPathway, LessonPathwayNode } from "@/features/curriculum/lessons";

/**
 * "Unit in progress" hero card from the Stitch mock. The unit itself (title,
 * description, strand, href) is the real first lesson of the student's
 * first Mathematics pathway — the same deterministic pick
 * deriveStartHereItem() uses for its curriculum_lesson fallback. The
 * completion percentage and the fraction-equivalence visual are decorative:
 * there is no per-lesson completion model in this codebase (see
 * CurriculumPathwaysPanel's own doc comment), so these are literal Stitch
 * placeholder values, not a real progress read — wire real progress here
 * before treating this section as done.
 */
export function LearningHubUnitSpotlight({
  pathway,
  node,
}: {
  pathway: LessonPathway;
  node: LessonPathwayNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-mm-line bg-white p-6 shadow-[0_4px_28px_-6px_rgba(30,11,56,0.07)] md:p-8">
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-mm-tint/60 blur-3xl" />
      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mm-tint px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-primary">
              Mathematics · {pathway.title}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-mm-coral-text">
              <span className="h-1.5 w-1.5 rounded-full bg-mm-coral-text" />
              Current unit
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink">
              {node.title}
            </h2>
            <p className="text-sm leading-relaxed text-mm-muted">
              {node.learningIntention || "Master core concepts with step-by-step worked examples and checkpoint questions."}
            </p>
          </div>
          {/* Placeholder — no per-lesson completion tracking exists (see CurriculumPathwaysPanel doc comment). */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-medium text-mm-muted">
              <span className="font-semibold text-mm-ink">Mastery progress (3 of 5 topics completed)</span>
              <span className="font-semibold text-primary">65%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-mm-line-soft">
              <div className="h-full w-[65%] rounded-full bg-primary" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={`/student/learn/lessons/${node.curriculumCode}`}
              className="flex h-11 items-center gap-2 rounded-btn bg-primary px-6 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(89,37,168,0.28)] transition-colors hover:bg-primary-hover"
            >
              <PlayCircle aria-hidden="true" className="h-[17px] w-[17px]" />
              Resume lesson
            </Link>
            <Link
              href="/student/learn/mathematics"
              className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-mm-muted transition-colors hover:text-primary"
            >
              <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
              View unit syllabus
            </Link>
          </div>
        </div>

        {/* Placeholder — decorative equivalence visual, not derived from node.title (may not even be about fractions). */}
        <div className="flex flex-col gap-3 rounded-2xl bg-mm-page/70 p-5 lg:col-span-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mm-ink">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
              Interactive area dissection
            </span>
            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-medium text-mm-muted shadow-xs">
              Scale: 1 whole
            </span>
          </div>
          <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-mm-muted">
                <span>Tier 1: Halves</span>
                <span className="font-semibold text-mm-ink">1/2</span>
              </div>
              <div className="grid h-8 grid-cols-2 gap-1 overflow-hidden rounded-lg bg-mm-line-soft p-1">
                <div className="flex items-center justify-center rounded bg-primary text-[11px] font-semibold text-white">
                  1/2
                </div>
                <div className="flex items-center justify-center rounded bg-mm-page text-[11px] text-mm-muted">
                  1/2
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-mm-muted">
                <span>Tier 2: Quarters</span>
                <span className="font-semibold text-mm-ink">2/4</span>
              </div>
              <div className="grid h-8 grid-cols-4 gap-1 overflow-hidden rounded-lg bg-mm-line-soft p-1">
                {[true, true, false, false].map((filled, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-center rounded text-[11px] font-semibold ${
                      filled ? "bg-primary text-white" : "bg-mm-page text-mm-muted font-normal"
                    }`}
                  >
                    1/4
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-mm-muted">
                <span>Tier 3: Eighths</span>
                <span className="font-semibold text-mm-ink">4/8</span>
              </div>
              <div className="grid h-8 grid-cols-8 gap-1 overflow-hidden rounded-lg bg-mm-line-soft p-1">
                {[true, true, true, true, false, false, false, false].map((filled, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-center rounded text-[10px] font-semibold ${
                      filled ? "bg-primary text-white" : "bg-mm-page text-mm-muted font-normal"
                    }`}
                  >
                    1/8
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 text-[11px] text-mm-muted">
            <span className="flex items-center gap-1">
              <Verified aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              Identity: 1/2 = 2/4 = 4/8 = 0.50
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
