import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { selectApprovedQuestions, type PublicationEligibilityReport } from "@/features/content-governance/publication-integrity";

function readEvidence(directory: string): { records: unknown[]; problems: string[] } {
  const records: unknown[] = [];
  const problems: string[] = [];
  try {
    for (const file of readdirSync(directory).filter((file) => file.endsWith(".json")).sort()) {
      try { records.push(JSON.parse(readFileSync(path.join(directory, file), "utf8"))); }
      catch { problems.push(`Unreadable publication evidence: ${path.basename(directory)}/${file}`); }
    }
  } catch { problems.push(`Missing publication evidence directory: ${path.basename(directory)}`); }
  return { records, problems };
}

let cached: PublicationEligibilityReport | undefined;

/** Node-only, private, immutable within a deployment; traced into the server deployment. */
export function getPublicationEligibility(): PublicationEligibilityReport {
  if (cached) return cached;
  const manifests = readEvidence(path.join(process.cwd(), "content/question-factory/published-manifests"));
  const approvals = readEvidence(path.join(process.cwd(), "content/publication-approvals"));
  const report = selectApprovedQuestions(publishedExamBank,
    new Set(factoryPublishedQuestions.map((q) => q.id)), manifests.records, approvals.records);
  const readProblems = [...manifests.problems, ...approvals.problems];
  cached = { ...report, questions: readProblems.length ? Object.freeze([]) : report.questions,
    problems: [...readProblems, ...report.problems] };
  return cached;
}
