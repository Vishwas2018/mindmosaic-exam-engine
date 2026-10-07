import "./lib/allow-server-only.mts";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { programmeIdForQuestion, publicationGateMode } from "@/features/content-governance/gate-config";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { buildAllPatternReadiness } from "@/features/exam-engine/exam-patterns";
import { getExamBank, getPatternReadiness } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";

function formatProgrammeName(programmeId: string): string {
  const parts = programmeId.split("-");
  if (parts.length < 3) return programmeId;
  const family = parts[0].toUpperCase();
  const year = parts[1].replace(/^y/, "Year ");
  const subject = parts.slice(2).join(" ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${family} ${year} ${subject}`;
}

function distinctPaperTarget(patternId: string): number {
  return patternId.startsWith("icas-") && patternId !== "icas-y5-science-full" ? 2 : 1;
}

const authored = buildAllPatternReadiness(publishedExamBank);
const eligible = getPatternReadiness();
const report = getPublicationEligibility();
const approvedReadiness = buildAllPatternReadiness(report.questions);

const programmeCounts = new Map<string, { authored: number; approved: number; problems: number }>();
for (const question of publishedExamBank) {
  const id = programmeIdForQuestion(question);
  const counts = programmeCounts.get(id) ?? { authored: 0, approved: 0, problems: 0 };
  counts.authored++;
  if (report.approvals.has(question.id)) counts.approved++;
  programmeCounts.set(id, counts);
}

// Map integrity problems to programmes where possible
for (const prob of report.problems) {
  for (const [id] of programmeCounts) {
    if (prob.includes(id)) {
      const counts = programmeCounts.get(id)!;
      counts.problems++;
    }
  }
}

const programmeRows = [...programmeCounts.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, counts]) => {
    const awaitingApproval = counts.authored - counts.approved;
    const approvalPercentNum = counts.authored > 0 ? Number(((100 * counts.approved) / counts.authored).toFixed(1)) : 0;
    const approvalPercentStr = counts.authored > 0 ? `${((100 * counts.approved) / counts.authored).toFixed(1)}%` : "0.0%";
    return {
      programmeId: id,
      programmeName: formatProgrammeName(id),
      gateMode: publicationGateMode(id),
      eligibleAuthoredCount: counts.authored,
      approvedCount: counts.approved,
      awaitingApprovalCount: awaitingApproval,
      integrityProblemCount: counts.problems,
      approvalPercentage: approvalPercentStr,
      approvalPercent: approvalPercentNum,
      denominatorDocumentation: "Denominator is eligible authored questions in publishedExamBank for this programme.",
    };
  });

const publicationByProgramme = Object.fromEntries(
  programmeRows.map((r) => [
    r.programmeId,
    {
      authored: r.eligibleAuthoredCount,
      approved: r.approvedCount,
      awaitingApproval: r.awaitingApprovalCount,
      integrityProblems: r.integrityProblemCount,
      approvedPercent: r.approvalPercent,
      gateMode: r.gateMode,
    },
  ]),
);

const level3 = getAllLessons()
  .filter((lesson) => lesson.level === "Level 3")
  .map((lesson) => ({
    code: lesson.curriculumCode,
    classroomOnly: CLASSROOM_ONLY_CURRICULUM_CODES.has(lesson.curriculumCode),
    learnerAvailableQuestions: resolveQuestionsForCurriculumNode(lesson.curriculumCode).length,
    approvedQuestions: resolveQuestionsForCurriculumNode(lesson.curriculumCode)
      .filter((question) => report.approvals.has(question.id)).length,
  }));

const patterns = Object.values(eligible).map((pattern) => ({
  ...pattern,
  authoringReadiness: authored[pattern.patternId],
  approvalReadiness: approvedReadiness[pattern.patternId],
  launchTargetDistinctPapers: distinctPaperTarget(pattern.patternId),
}));

const releaseGate = process.argv.includes("--release-gate");
const includeAmc = process.argv.includes("--include-amc");
const jsonOnly = process.argv.includes("--json-only");

const failures = patterns
  .filter(
    (pattern) =>
      pattern.patternId.endsWith("-full") &&
      (includeAmc || !pattern.patternId.startsWith("amc-")) &&
      (pattern.approvalReadiness.state !== "ready" ||
        pattern.approvalReadiness.distinctPapers < pattern.launchTargetDistinctPapers),
  )
  .map((pattern) => `${pattern.patternId}: ${pattern.approvalReadiness.state}, ${pattern.approvalReadiness.distinctPapers}/${pattern.launchTargetDistinctPapers} approved distinct full papers`);

for (const node of level3) {
  if (!node.classroomOnly && node.approvedQuestions < 5) {
    failures.push(`${node.code}: ${node.approvedQuestions}/5 approved questions`);
  }
}

if (!jsonOnly) {
  console.log("==============================================================================");
  console.log("PROGRAMME PUBLICATION READINESS REPORT");
  console.log("==============================================================================");
  console.table(
    programmeRows.map((r) => ({
      "Programme ID": r.programmeId,
      "Programme Name": r.programmeName,
      "Gate Mode": r.gateMode,
      Authored: r.eligibleAuthoredCount,
      Approved: r.approvedCount,
      Awaiting: r.awaitingApprovalCount,
      Problems: r.integrityProblemCount,
      Readiness: r.approvalPercentage,
    })),
  );
  console.log("\nDenominator: eligible authored questions in publishedExamBank for each programme.");
  console.log(`Total authored questions: ${publishedExamBank.length} across ${programmeRows.length} programme(s).\n`);
}

const payload = {
  authoredQuestions: publishedExamBank.length,
  eligibleQuestions: getExamBank("published").length,
  excludedQuestions: report.excluded.length,
  integrityProblems: report.problems,
  denominator: "eligible authored questions in publishedExamBank",
  programmes: programmeRows,
  publicationByProgramme,
  patterns,
  level3,
  releaseGate: {
    requested: releaseGate,
    includeAmc,
    passed: failures.length === 0 && report.problems.length === 0,
    failures,
    note: "Content acceptance only. Commercial/browser/deployment gates remain separate.",
  },
};

console.log(JSON.stringify(payload, null, 2));

if (report.problems.length || (releaseGate && failures.length)) process.exitCode = 1;
