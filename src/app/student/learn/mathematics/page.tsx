import type { Metadata } from "next";
import { Ruler } from "lucide-react";

import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
} from "@/features/curriculum/lessons";
import { CurriculumPathwaysPanel, SubjectHubHeader } from "@/features/curriculum/lessons/components";
import { StudentShell } from "@/features/student/components/StudentShell";
import { WorthRevisitingPanel } from "@/features/curriculum/lessons/components";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Mathematics" };

export const dynamic = "force-dynamic";

/** Bank subject keys that roll up into the Mathematics learning area. */
const MATHS_SUBJECT_KEYS = new Set(["numeracy"]);

export default async function MathematicsSubjectPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();

  const yearPathways = getCurriculumPathwaysForYearLevel(student.yearLevel);
  const learningAreas = groupPathwaysByLearningArea(yearPathways);
  const mathsArea = learningAreas.find((area) => area.learningArea === "Mathematics");

  const lessonCount = mathsArea ? mathsArea.pathways.reduce((sum, p) => sum + p.nodes.length, 0) : 0;
  const strandCount = mathsArea?.pathways.length ?? 0;

  const revisit = overview.mastery
    .filter((subject) => MATHS_SUBJECT_KEYS.has(subject.subject))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  return (
    <StudentShell active="learn">
      <SubjectHubHeader
        subjectName="Mathematics"
        tagline="Numbers, fractions, measurement, geometry, statistics and problem solving."
        lessonCount={lessonCount}
        strandCount={strandCount}
        accent="primary"
        icon={Ruler}
      />

      <WorthRevisitingPanel
        revisit={revisit}
        yearLevel={student.yearLevel}
        learningAreaFilter="Mathematics"
      />

      <CurriculumPathwaysPanel yearLevel={student.yearLevel} learningAreas={mathsArea ? [mathsArea] : []} />
    </StudentShell>
  );
}
