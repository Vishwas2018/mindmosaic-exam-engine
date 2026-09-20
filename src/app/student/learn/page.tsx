import type { Metadata } from "next";

import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
} from "@/features/curriculum/lessons";
import { SubjectExplorer, WorthRevisitingPanel } from "@/features/curriculum/lessons/components";
import { LearningHubHero } from "@/features/student/components/learning-hub/LearningHubHero";
import { LearningHubLabSpotlight } from "@/features/student/components/learning-hub/LearningHubLabSpotlight";
import { LearningHubResourceStrips } from "@/features/student/components/learning-hub/LearningHubResourceStrips";
import { LearningHubUnitSpotlight } from "@/features/student/components/learning-hub/LearningHubUnitSpotlight";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Learning Hub" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Learning Hub — a port of the Stitch "Learning Hub" mockup onto the same
 * StudentPortalShell as the dashboard, per this session's "pixel-match with
 * placeholders, wire later" decision.
 *
 * Data-integrity note: the hero eyebrow/term chip, the unit spotlight's
 * completion %, the fraction visuals, the interactive lab, and the two
 * resource strips are literal Stitch placeholder content — none of them
 * have a backing data model (see each component's own comment). Lesson/
 * strand counts, the "worth revisiting" panel, and the subject/strand
 * explorer below are real, unchanged from the previous build of this page.
 *
 * The previous version of this page also rendered a `CurriculumEthicsBanner`
 * stating "no opaque mastery scores... no invented mastery figure" as a
 * design guarantee. That claim would now be directly, visibly false on this
 * same page (the unit spotlight above it shows an invented 65% completion
 * figure), so the banner is dropped here rather than kept as a
 * self-contradiction — it is unrelated to the placeholder work otherwise
 * and can return once real completion tracking exists.
 */
export default async function StudentLearnPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);

  const yearPathways = getCurriculumPathwaysForYearLevel(student.yearLevel);
  const learningAreas = groupPathwaysByLearningArea(yearPathways);

  const mathsArea = learningAreas.find((area) => area.learningArea === "Mathematics");
  const englishArea = learningAreas.find((area) => area.learningArea === "English");
  const countLessons = (pathways: typeof yearPathways) =>
    pathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);

  const mathsLessonCount = mathsArea ? countLessons(mathsArea.pathways) : 0;
  const englishLessonCount = englishArea ? countLessons(englishArea.pathways) : 0;
  const strandCount = learningAreas.reduce((sum, area) => sum + area.pathways.length, 0);

  const spotlightPathway = mathsArea?.pathways[0];
  const spotlightNode = spotlightPathway?.nodes[0];

  /* The subjects with the fewest objective marks earned so far. */
  const revisit = [...overview.mastery].sort((a, b) => a.percent - b.percent).slice(0, 3);

  return (
    <StudentPortalShell active="learn" breadcrumbLabel="Learning Hub" student={student} shellData={shellData}>
      <LearningHubHero
        yearLevel={student.yearLevel}
        mathsLessonCount={mathsLessonCount}
        englishLessonCount={englishLessonCount}
        strandCount={strandCount}
      />

      {spotlightPathway && spotlightNode && (
        <LearningHubUnitSpotlight pathway={spotlightPathway} node={spotlightNode} />
      )}

      <WorthRevisitingPanel revisit={revisit} yearLevel={student.yearLevel} />

      <SubjectExplorer yearLevel={student.yearLevel} learningAreas={learningAreas} />

      <LearningHubLabSpotlight />

      <LearningHubResourceStrips />
    </StudentPortalShell>
  );
}
