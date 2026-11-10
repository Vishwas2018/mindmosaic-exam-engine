import type { Metadata } from "next";
import { getLessonByCode } from "@/features/curriculum/lessons";
import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
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
  if (!lesson) return { title: "Lesson | MindMosaic Learn" };

  return {
    title: `${lesson.curriculumCode}: ${lesson.title} | MindMosaic Learn`,
    description: lesson.learningIntention,
  };
}

export default async function StudentLessonDetailPage({ params, searchParams }: LessonPageProps) {
  await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  if (!(await isStudentPreviewEnabled())) {
    await requireStudent();
  }

  return <StudentCanvasScreen screen="learn-lesson" state={resolvedSearch.state} />;
}
