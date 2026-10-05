/** Read-only inventory. Authored content and learner-eligible content are distinct. */
import "./lib/allow-server-only.mts";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { questionBank } from "@/content/questions/question-bank";
import { factoryPublishedQuestions } from "@/content/questions/generated";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { getExamBank, getPatternReadiness } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";

function inventory(directory: string): { files: number; questions: number; unreadable: number } {
  const result = { files: 0, questions: 0, unreadable: 0 };
  if (!statExists(directory)) return result;
  for (const name of readdirSync(directory)) {
    const file = path.join(directory, name);
    if (statSync(file).isDirectory()) {
      const child = inventory(file);
      result.files += child.files; result.questions += child.questions; result.unreadable += child.unreadable;
    } else if (name.endsWith(".json")) {
      result.files++;
      try {
        const raw = JSON.parse(readFileSync(file, "utf8"));
        result.questions += Array.isArray(raw) ? raw.length : Array.isArray(raw.questions) ? raw.questions.length : raw.question ? 1 : 0;
      } catch { result.unreadable++; }
    }
  }
  return result;
}
function statExists(directory: string): boolean {
  try { return statSync(directory).isDirectory(); } catch { return false; }
}

const eligibility = getPublicationEligibility();
const report = {
  authoring: { curated: questionBank.length, factory: factoryPublishedQuestions.length,
    total: publishedExamBank.length, uniqueIds: new Set(publishedExamBank.map(q => q.id)).size },
  served: { curated: getExamBank("curated").length, published: getExamBank("published").length,
    practice: getExamBank("practice").length,
    note: "All banks require valid, revision-bound human approval; practice aliases published. No ungated opt-in exists." },
  approval: { approved: eligibility.approvals.size,
    awaitingHumanApproval: eligibility.excluded.filter(q => q.reason === "awaiting_human_approval").length,
    excluded: eligibility.excluded.length },
  integrity: { problems: eligibility.problems,
    comparison: "questionSchema.parse followed by the shared canonical content hash; schema defaults do not constitute drift" },
  pipeline: Object.fromEntries(["inbox", "review-queue", "staged", "quarantined", "rejected", "published-manifests", "archived"]
    .map(stage => [stage, inventory(path.join("content/question-factory", stage))])),
  manual: inventory("content/manual-questions"),
  readiness: Object.values(getPatternReadiness()).map(r => ({ patternId: r.patternId,
    state: r.state, available: r.availableCount, requested: r.requestedCount, distinctPapers: r.distinctPapers })),
};
console.log(JSON.stringify(report, null, 2));
// Pending human review is reported, never fabricated. Actual integrity failures fail CI.
if (eligibility.problems.length) process.exitCode = 1;
