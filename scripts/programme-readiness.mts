import "./lib/allow-server-only.mts";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { buildAllPatternReadiness } from "@/features/exam-engine/exam-patterns";
import { getExamBank, getPatternReadiness } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";
import { programmeIdForQuestion, publicationGateMode } from "@/features/content-governance/gate-config";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";

function distinctPaperTarget(patternId: string): number {
  return patternId.startsWith("icas-") && patternId !== "icas-y5-science-full" ? 2 : 1;
}

const authored = buildAllPatternReadiness(publishedExamBank);
const eligible = getPatternReadiness();
const report = getPublicationEligibility();
const programmeCounts = new Map<string, { authored: number; approved: number }>();
for (const question of publishedExamBank) {
  const id = programmeIdForQuestion(question);
  const counts = programmeCounts.get(id) ?? { authored: 0, approved: 0 };
  counts.authored++;
  if (report.approvals.has(question.id)) counts.approved++;
  programmeCounts.set(id, counts);
}
const publicationByProgramme = Object.fromEntries([...programmeCounts].sort(([a], [b]) => a.localeCompare(b))
  .map(([id, counts]) => [id, { ...counts,
    approvedPercent: counts.authored ? Number((100 * counts.approved / counts.authored).toFixed(1)) : 0,
    gateMode: publicationGateMode(id) }]));
const level3 = getAllLessons().filter(lesson => lesson.level === "Level 3")
  .map(lesson => ({ code: lesson.curriculumCode,
    classroomOnly: CLASSROOM_ONLY_CURRICULUM_CODES.has(lesson.curriculumCode),
    approvedQuestions: resolveQuestionsForCurriculumNode(lesson.curriculumCode).length }));
const patterns = Object.values(eligible).map(pattern => ({ ...pattern,
  authoringReadiness: authored[pattern.patternId],
  launchTargetDistinctPapers: distinctPaperTarget(pattern.patternId) }));
const releaseGate = process.argv.includes("--release-gate");
const includeAmc = process.argv.includes("--include-amc");
const failures = patterns.filter(pattern => pattern.patternId.endsWith("-full") &&
  (includeAmc || !pattern.patternId.startsWith("amc-")) &&
  (pattern.state !== "ready" || pattern.distinctPapers < pattern.launchTargetDistinctPapers))
  .map(pattern => `${pattern.patternId}: ${pattern.state}, ${pattern.distinctPapers}/${pattern.launchTargetDistinctPapers} distinct full papers`);
for (const node of level3) if (!node.classroomOnly && node.approvedQuestions < 5) {
  failures.push(`${node.code}: ${node.approvedQuestions}/5 approved questions`);
}
console.log(JSON.stringify({
  authoredQuestions: publishedExamBank.length,
  eligibleQuestions: getExamBank("published").length,
  excludedQuestions: report.excluded.length,
  integrityProblems: report.problems,
  publicationByProgramme,
  patterns, level3,
  releaseGate: { requested: releaseGate, includeAmc, passed: failures.length === 0 && report.problems.length === 0,
    failures, note: "Content acceptance only. Commercial/browser/deployment gates remain separate." },
}, null, 2));
if (report.problems.length || (releaseGate && failures.length)) process.exitCode = 1;
