import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookX } from "lucide-react";
import { getPublishedLessons, getLessonByCode } from "@/features/curriculum/lessons";
import { LessonView } from "@/features/curriculum/lessons/components";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ state?: string }>;
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

export default async function StudentLessonDetailPage({ params, searchParams }: LessonPageProps) {
  const resolvedSearch = searchParams ? await searchParams : {};
  if (await isStudentPreviewEnabled()) {
    return <StudentCanvasScreen screen="learn-lesson" state={resolvedSearch.state} />;
  }

  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);
  const { code } = await params;
  const lesson = getLessonByCode(code.toUpperCase(), { publishedOnly: true });

  if (!lesson) {
    return (
      <StudentPortalShell
        active="learn"
        breadcrumbLabel="Lesson Not Found"
        student={student}
        shellData={shellData}
      >
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <BookX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">
            Lesson Not Found
          </h1>
          <p className="mt-2 text-sm text-mm-muted">
            We could not find a published curriculum lesson matching code &ldquo;{code}&rdquo;.
          </p>
          <div className="mt-6">
            <Link
              href="/student/learn"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-btn bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Learning Hub</span>
            </Link>
          </div>
        </div>
      </StudentPortalShell>
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
    <StudentPortalShell
      active="learn"
      breadcrumbLabel={lesson.curriculumCode}
      student={student}
      shellData={shellData}
    >
      <LessonView
        lesson={lesson}
        nextLesson={nextLesson}
        availableQuestionsCount={availableQuestionsCount}
      />
    </StudentPortalShell>
  );
}
