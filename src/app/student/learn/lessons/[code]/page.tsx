import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";
import { getPublishedLessons, getLessonByCode } from "@/features/curriculum/lessons";
import { LessonView } from "@/features/curriculum/lessons/components";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { StudentShell } from "@/features/student/components/StudentShell";
import { requireStudent } from "@/features/student/require-student";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase(), { publishedOnly: true });
  if (!lesson) return { title: "Lesson Not Found | MindMosaic Learn" };

  return {
    title: `${lesson.curriculumCode}: ${lesson.title} | MindMosaic Learn`,
    description: lesson.learningIntention,
  };
}

export default async function StudentLessonDetailPage({ params }: LessonPageProps) {
  await requireStudent();
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase(), { publishedOnly: true });

  if (!lesson) {
    return (
      <StudentShell active="learn">
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-slate-100/90 text-slate-500 shadow-inner border border-slate-200/80">
            <BookX className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-mm-ink">Lesson Not Found</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-mm-muted">
            We could not find a published curriculum lesson matching code &ldquo;{code}&rdquo;.
          </p>
          <div className="mt-8">
            <Link
              href="/student/learn"
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-mm-brand px-6 text-sm font-bold text-white shadow-xs transition-all duration-180 hover:bg-mm-brand-deep hover:shadow-sm active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Learning Pathway</span>
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  /* Scoped to the current lesson's own curriculum level so "next lesson"
     navigation never hands a student a different year's content. */
  const sameLevelLessons = getPublishedLessons().filter((l) => l.level === lesson.level);
  const currentIndex = sameLevelLessons.findIndex((l) => l.curriculumCode === lesson.curriculumCode);
  const nextLesson =
    currentIndex >= 0 && currentIndex < sameLevelLessons.length - 1
      ? {
          curriculumCode: sameLevelLessons[currentIndex + 1].curriculumCode,
          title: sameLevelLessons[currentIndex + 1].title,
        }
      : undefined;

  const availableQuestionsCount = resolveQuestionsForCurriculumNode(lesson.curriculumCode).length;

  return (
    <StudentShell active="learn">
      <LessonView
        lesson={lesson}
        nextLesson={nextLesson}
        availableQuestionsCount={availableQuestionsCount}
      />
    </StudentShell>
  );
}
