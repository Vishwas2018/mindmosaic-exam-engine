import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";

import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  learningAreaForSlug,
} from "@/features/curriculum/lessons";
import { EmptyPathwaysNotice, LearningAreaPathways } from "@/features/curriculum/lessons/components";
import { StudentShell } from "@/features/student/components/StudentShell";
import { requireStudent } from "@/features/student/require-student";

export const dynamic = "force-dynamic";

interface SubjectHubPageProps {
  params: Promise<{ area: string }>;
}

export async function generateMetadata({ params }: SubjectHubPageProps): Promise<Metadata> {
  const { area } = await params;
  const learningArea = learningAreaForSlug(area);
  if (!learningArea) return { title: "Learn" };
  return { title: `${learningArea} | Learn` };
}

/**
 * A single learning area's pathway hub (`/student/learn/mathematics`,
 * `/student/learn/english`) — every strand pathway for that one area at the
 * student's real yearLevel.
 *
 * An unrecognised `area` slug renders an honest "not found" state inline
 * rather than calling `next/navigation`'s `notFound()` — this segment sits
 * beneath `src/app/student/loading.tsx`, and a `notFound()` call under a
 * `loading.tsx` boundary streams as HTTP 200 (see
 * `route-loading-boundaries.test.ts`). `/student/learn/lessons/[code]`
 * already uses this same inline-state convention for the same reason.
 */
export default async function SubjectHubPage({ params }: SubjectHubPageProps) {
  const { area } = await params;
  const learningArea = learningAreaForSlug(area);

  if (!learningArea) {
    return (
      <StudentShell active="learn">
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-slate-100/90 text-slate-500 shadow-inner border border-slate-200/80">
            <BookX className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-mm-ink">Subject Not Found</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-mm-muted">
            We don&rsquo;t have a subject matching &ldquo;{area}&rdquo;.
          </p>
          <div className="mt-8">
            <Link
              href="/student/learn"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-mm-brand px-6 text-sm font-bold text-white shadow-xs transition-all duration-180 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to My Learning</span>
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  const student = await requireStudent();

  const body = (() => {
    if (student.yearLevel === null) {
      return (
        <EmptyPathwaysNotice message="We don't have a year level on file for your account yet, so we can't show your curriculum pathway. Ask a parent or teacher to add it in settings." />
      );
    }

    const yearPathways = getCurriculumPathwaysForYearLevel(student.yearLevel);
    const group = groupPathwaysByLearningArea(yearPathways).find(
      (g) => g.learningArea === learningArea,
    );

    if (!group || group.pathways.length === 0) {
      return (
        <EmptyPathwaysNotice
          message={`${learningArea} lessons for Year ${student.yearLevel} haven't been published yet. Your pathway will appear here as soon as they are.`}
        />
      );
    }

    return <LearningAreaPathways pathways={group.pathways} />;
  })();

  return (
    <StudentShell active="learn">
      <div className="grid gap-[clamp(20px,2.5vw,32px)]">
        <nav aria-label="Breadcrumb">
          <Link
            href="/student/learn"
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-mm-brand transition-colors hover:bg-mm-tint/50 hover:text-mm-brand-deep focus-visible:outline-3 focus-visible:outline-mm-brand"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
            <span>My Learning</span>
          </Link>
        </nav>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">
            {student.yearLevel === null ? "Learn" : `Year ${student.yearLevel}`}
          </p>
          <h1 className="mt-0.5 text-3xl font-black tracking-[-0.03em] text-mm-ink">{learningArea}</h1>
        </div>

        {body}
      </div>
    </StudentShell>
  );
}
