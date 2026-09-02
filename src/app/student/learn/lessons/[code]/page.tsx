import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookX, Lock } from "lucide-react";
import { getPublishedLessons, getLessonByCode } from "@/features/curriculum/lessons";
import { LessonView } from "@/features/curriculum/lessons/components";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import { StudentShell } from "@/features/student/components/StudentShell";
import { requireStudent } from "@/features/student/require-student";

export const dynamic = "force-dynamic";

/**
 * Maps a Victorian Curriculum level string to the corresponding student year level number.
 * Victorian Curriculum F-10 v2.0: Level 3 ≈ Year 3, Level 5 ≈ Year 5.
 *
 * This is an approximate mapping — a school may teach a Level 3 topic in Year 4,
 * but for access control we use the authoritative level-to-year mapping.
 */
function levelToYearLevel(level: string): number | null {
  const match = /Level\s+(\d+)/i.exec(level);
  if (!match) return null;
  return parseInt(match[1], 10);
}

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
  const student = await requireStudent();
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase(), { publishedOnly: true });

  if (!lesson) {
    return (
      <StudentShell active="learn">
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <BookX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-mm-ink">Lesson Not Found</h1>
          <p className="mt-2 text-sm text-mm-muted">
            We could not find a published curriculum lesson matching code &ldquo;{code}&rdquo;.
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

  /*
   * Year-level access guard.
   *
   * A lesson's level (e.g. "Level 5") maps to a year level (e.g. 5).
   * Students may only access lessons matching their own year level.
   * Students without a year level cannot access any lesson.
   *
   * This prevents cross-year leakage: a Year 3 student who knows a
   * Level 5 lesson URL cannot silently receive Level 5 content.
   */
  const lessonYearLevel = levelToYearLevel(lesson.level);
  const studentYearLevel = student.yearLevel;

  if (studentYearLevel === null || lessonYearLevel !== studentYearLevel) {
    return (
      <StudentShell active="learn">
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Lock className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-mm-ink">Lesson Not Available</h1>
          <p className="mt-2 text-sm text-mm-muted">
            {studentYearLevel === null
              ? "Your year level has not been set. Ask a parent or teacher to update your profile."
              : `This lesson is for a different year level. Return to your Year ${studentYearLevel} pathways.`}
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

  const publishedLessons = getPublishedLessons();
  /* Navigate within the same year level's published lessons only. */
  const sameLevelLessons = publishedLessons.filter((l) => l.level === lesson.level);
  const currentIndex = sameLevelLessons.findIndex((l) => l.curriculumCode === lesson.curriculumCode);
  const nextLesson =
    currentIndex >= 0 && currentIndex < sameLevelLessons.length - 1
      ? {
          curriculumCode: sameLevelLessons[currentIndex + 1].curriculumCode,
          title: sameLevelLessons[currentIndex + 1].title,
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
