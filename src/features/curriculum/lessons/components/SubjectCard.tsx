import Link from "next/link";
import { ArrowRight, BookText, Compass } from "lucide-react";
import type { CurriculumLearningArea } from "../types";

interface SubjectCardProps {
  learningArea: CurriculumLearningArea;
  /** Real lesson count for this area at the student's yearLevel — never a
   *  completion fraction, since no per-lesson completion field exists. */
  lessonCount: number;
  href: string;
}

/**
 * A subject-level summary card on `/student/learn`, linking into that
 * subject's own pathway hub (`/student/learn/[area]`). Carries exactly one
 * real number — the lesson count already computed by the caller from
 * `LessonPathway.nodes.length` — never a "mastered"/"complete" claim, since
 * the data model has no per-student, per-topic completion field.
 */
export function SubjectCard({ learningArea, lessonCount, href }: SubjectCardProps) {
  const isMath = learningArea.toLowerCase().includes("math");
  const Icon = isMath ? Compass : BookText;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-mm-line bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-mm-brand/40 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
    >
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-mm-brand to-mm-brand-deep text-white shadow-xs">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="grid gap-0.5">
          <h3 className="text-[17px] font-bold text-mm-ink group-hover:text-mm-brand transition-colors">
            {learningArea}
          </h3>
          <p className="text-[13.5px] font-semibold text-mm-muted">
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-mm-muted transition-colors group-hover:bg-mm-tint group-hover:text-mm-brand">
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
