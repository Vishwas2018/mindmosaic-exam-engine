import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";
import { getAllLessons, getLessonByCode } from "@/features/curriculum/lessons";
import { LessonView } from "@/features/curriculum/lessons/components";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import { StudentShell } from "@/features/student/components/StudentShell";
import { requireStudent } from "@/features/student/require-student";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase());
  if (!lesson) return { title: "Lesson Not Found | MindMosaic Learn" };

  return {
    title: `${lesson.curriculumCode}: ${lesson.title} | MindMosaic Learn`,
    description: lesson.learningIntention,
  };
}

export default async function StudentLessonDetailPage({ params }: LessonPageProps) {
  await requireStudent();
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase());

  if (!lesson) {
    return (
      <StudentShell active="learn">
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <BookX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-mm-ink">Lesson Not Found</h1>
          <p className="mt-2 text-sm text-mm-muted">
            We could not find a curriculum lesson matching code &ldquo;{code}&rdquo;.
          </p>
          <div className="mt-6">
            <Link
              href="/student/learn"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-mm-brand px-5 text-sm font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-2 focus-visible:outline-mm-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Learning Pathway</span>
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex((l) => l.curriculumCode === lesson.curriculumCode);
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? {
          curriculumCode: allLessons[currentIndex + 1].curriculumCode,
          title: allLessons[currentIndex + 1].title,
        }
      : undefined;

  const mappedQuestionIds = getMappedQuestionIdsForNode(lesson.curriculumCode);

  return (
    <StudentShell active="learn">
      <LessonView
        lesson={lesson}
        nextLesson={nextLesson}
        availableQuestionsCount={mappedQuestionIds.length}
      />
    </StudentShell>
  );
}
