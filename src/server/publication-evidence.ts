import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { allFactoryPublishedQuestions as factoryPublishedQuestions } from "@/content/questions/factory-pools";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { partitionPendingAmcApprovals } from "@/features/content-governance/pending-amc-approvals";
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

let cached: (PublicationEligibilityReport & { readonly pendingPublication: readonly string[] }) | undefined;

/** Node-only, private, immutable within a deployment; traced into the server deployment. */
export function getPublicationEligibility(): PublicationEligibilityReport & { readonly pendingPublication: readonly string[] } {
  if (cached) return cached;
  const manifests = readEvidence(path.join(process.cwd(), "content/question-factory/published-manifests"));
  const approvals = readEvidence(path.join(process.cwd(), "content/publication-approvals"));
  const authoredIds = new Set(publishedExamBank.map((question) => question.id));
  const needsPendingCheck = approvals.records.some((raw) => raw && typeof raw === "object" &&
    /^roadmap-amc-y[35]-[0-9]{3}$/.test(String((raw as Record<string, unknown>).questionId)) && !authoredIds.has(String((raw as Record<string, unknown>).questionId)));
  const reviewSources = needsPendingCheck ? readEvidence(path.join(process.cwd(), "content/review-sources/amc")) : { records: [], problems: [] };
  const partition = partitionPendingAmcApprovals(authoredIds, approvals.records,
    reviewSources.records.flatMap((record) => Array.isArray(record) ? record : [record]));
  const report = selectApprovedQuestions(publishedExamBank,
    new Set(factoryPublishedQuestions.map((q) => q.id)), manifests.records, partition.publicationRecords);
  const readProblems = [...manifests.problems, ...approvals.problems, ...reviewSources.problems];
  cached = { ...report, pendingPublication: partition.pending.map((record) => record.questionId).sort(), questions: readProblems.length ? Object.freeze([]) : report.questions,
    problems: [...readProblems, ...report.problems] };
  return cached;
}
