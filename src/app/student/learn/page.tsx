import type { Metadata } from "next";

import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
} from "@/features/curriculum/lessons";
import { LearningHubHero } from "@/features/student/components/learning-hub/LearningHubHero";
import { LearningHubExplorer } from "@/features/student/components/learning-hub/LearningHubExplorer";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Learning Hub" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Learning Hub — Curriculum explorer supporting Year 3 and Year 5.
 *
 * Data-integrity note:
 * - Lessons are authored across Victorian Curriculum Level 3 and Level 5.
 * - No lesson progress is stored in the database: no ticks, no % read,
 *   no units complete, and no invented completion bars are rendered.
 * - Curriculum codes are displayed as recorded with no false alignment guarantees.
 * - Unused Stitch mock components (UnitSpotlight, LabSpotlight, ResourceStrips)
 *   are no longer rendered; files remain in tree for the cleanup PR.
 */
export default async function StudentLearnPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);

  // Authoritatively load authored pathways for Year 3 and Year 5
  const year3Pathways = getCurriculumPathwaysForYearLevel(3);
  const year5Pathways = getCurriculumPathwaysForYearLevel(5);

  const pathwaysByYear: Record<number, typeof year3Pathways> = {
    3: year3Pathways,
    5: year5Pathways,
  };

  // If student has another year level on file, resolve it honestly (fails closed if unauthored)
  if (student.yearLevel !== null && student.yearLevel !== 3 && student.yearLevel !== 5) {
    pathwaysByYear[student.yearLevel] = getCurriculumPathwaysForYearLevel(student.yearLevel);
  }

  // Count lessons for hero banner for the student's initial year
  const initialYear =
    student.yearLevel === 5 ? 5 : student.yearLevel === 3 ? 3 : (student.yearLevel ?? 3);
  const activePathways = pathwaysByYear[initialYear] ?? [];
  const learningAreas = groupPathwaysByLearningArea(activePathways);

  const mathsArea = learningAreas.find((area) => area.learningArea === "Mathematics");
  const englishArea = learningAreas.find((area) => area.learningArea === "English");
  const countLessons = (pathways: typeof activePathways) =>
    pathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);

  const mathsLessonCount = mathsArea ? countLessons(mathsArea.pathways) : 0;
  const englishLessonCount = englishArea ? countLessons(englishArea.pathways) : 0;
  const strandCount = learningAreas.reduce((sum, area) => sum + area.pathways.length, 0);

  const hasPriorAttempts = overview.attempts.length > 0;

  return (
    <StudentPortalShell
      active="learn"
      breadcrumbLabel="Learning Hub"
      student={student}
      shellData={shellData}
    >
      <div className="space-y-8">
        <LearningHubHero
          yearLevel={student.yearLevel}
          mathsLessonCount={mathsLessonCount}
          englishLessonCount={englishLessonCount}
          strandCount={strandCount}
        />

        <LearningHubExplorer
          initialYearLevel={student.yearLevel}
          pathwaysByYear={pathwaysByYear}
          hasPriorAttempts={hasPriorAttempts}
        />
      </div>
    </StudentPortalShell>
  );
}
