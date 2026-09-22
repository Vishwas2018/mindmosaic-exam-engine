import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
} from "@/features/curriculum/lessons";
import {
  CurriculumPathwaysPanel,
  SubjectHubHeader,
  WorthRevisitingPanel,
} from "@/features/curriculum/lessons/components";
import { StudentShell } from "@/features/student/components/StudentShell";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "English" };

export const dynamic = "force-dynamic";

/** Bank subject keys that roll up into the English learning area. */
const ENGLISH_SUBJECT_KEYS = new Set(["reading", "language_conventions", "language", "writing"]);

export default async function EnglishSubjectPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();

  const yearPathways = getCurriculumPathwaysForYearLevel(student.yearLevel);
  const learningAreas = groupPathwaysByLearningArea(yearPathways);
  const englishArea = learningAreas.find((area) => area.learningArea === "English");

  const lessonCount = englishArea ? englishArea.pathways.reduce((sum, p) => sum + p.nodes.length, 0) : 0;
  const strandCount = englishArea?.pathways.length ?? 0;

  const revisit = overview.mastery
    .filter((subject) => ENGLISH_SUBJECT_KEYS.has(subject.subject))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  return (
    <StudentShell active="learn">
      <SubjectHubHeader
        subjectName="English"
        tagline="Reading, writing, grammar, vocabulary and literature."
        lessonCount={lessonCount}
        strandCount={strandCount}
        accent="teal"
        icon={BookOpen}
      />

      <WorthRevisitingPanel
        revisit={revisit}
        yearLevel={student.yearLevel}
        learningAreaFilter="English"
      />

      <CurriculumPathwaysPanel yearLevel={student.yearLevel} learningAreas={englishArea ? [englishArea] : []} />
    </StudentShell>
  );
}
