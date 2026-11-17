import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { EXAM_PATTERNS, getExamPattern } from "@/features/exam-engine/exam-patterns/exam-pattern-registry";
import type { PatternReadiness } from "@/features/exam-engine/exam-patterns/pattern-readiness";
import type { AdminActivityEvent } from "@/features/admin/activity-query";
import { getAdminOverviewData } from "@/server/admin-library-data";
import { getExamBank, getPatternReadiness } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";
import { getWritingPromptEligibility } from "@/server/writing/tasks";

const STYLE_LABEL: Record<string, string> = {
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
  amc_style: "AMC-style",
  scholarship_style: "Scholarship-style",
};

/* ------------------------------------------------------------------ */
/* Papers                                                              */
/* ------------------------------------------------------------------ */

export interface AdminPaperRow {
  id: string;
  label: string;
  programmeLabel: string;
  yearLevel: number;
  presentation: string;
  questionCount: number;
  timeMinutes: number;
  /** ready: the gated bank fills the whole paper; short: only a reduced module; unavailable: nothing to draw. */
  state: PatternReadiness["state"];
  availableCount: number;
  distinctPapers: number;
  adaptations: readonly string[];
  sources: { sourceId: string; requested: number; poolSize: number; satisfiable: boolean }[];
}

function toPaperRow(id: string): AdminPaperRow | null {
  const pattern = getExamPattern(id);
  const readiness = getPatternReadiness()[id];
  if (!pattern || !readiness) return null;
  return {
    id,
    label: pattern.label,
    programmeLabel: STYLE_LABEL[pattern.examStyle] ?? pattern.examStyle,
    yearLevel: pattern.yearLevel,
    presentation: pattern.presentation,
    questionCount: pattern.questionCount,
    timeMinutes: pattern.timeMinutes,
    state: readiness.state,
    availableCount: readiness.availableCount,
    distinctPapers: readiness.distinctPapers,
    adaptations: pattern.adaptations,
    sources: readiness.sources.map((s) => ({
      sourceId: s.sourceId,
      requested: s.requested,
      poolSize: s.poolSize,
      satisfiable: s.satisfiable,
    })),
  };
}

/** Every full-length practice paper shape, with what the gated bank can fill today. */
export function getAdminPapers(): AdminPaperRow[] {
  return EXAM_PATTERNS.map((p) => toPaperRow(p.id)).filter((row): row is AdminPaperRow => row !== null);
}

export function getAdminPaper(id: string): AdminPaperRow | null {
  return toPaperRow(id);
}

/* ------------------------------------------------------------------ */
/* Manifests (publication history)                                     */
/* ------------------------------------------------------------------ */

interface ManifestFact {
  questionId: string;
  batchId: string;
  publishedAt: string;
  revision: number;
  contentHash: string;
}

let manifestCache: { facts: ManifestFact[]; problems: string[] } | undefined;

function readManifestFacts(): { facts: ManifestFact[]; problems: string[] } {
  if (manifestCache) return manifestCache;
  const dir = path.join(process.cwd(), "content/question-factory/published-manifests");
  const facts: ManifestFact[] = [];
  const problems: string[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  } catch {
    problems.push("The published-manifest directory could not be read.");
  }
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Record<string, unknown>;
      if (
        typeof raw.questionId === "string" &&
        typeof raw.batchId === "string" &&
        typeof raw.publishedAt === "string" &&
        typeof raw.contentHash === "string"
      ) {
        facts.push({
          questionId: raw.questionId,
          batchId: raw.batchId,
          publishedAt: raw.publishedAt,
          revision: typeof raw.revision === "number" ? raw.revision : 0,
          contentHash: raw.contentHash,
        });
      } else {
        problems.push(`Manifest ${file} is missing a required field.`);
      }
    } catch {
      problems.push(`Manifest ${file} could not be read.`);
    }
  }
  manifestCache = { facts, problems };
  return manifestCache;
}

/* ------------------------------------------------------------------ */
/* Publication                                                         */
/* ------------------------------------------------------------------ */

export interface AdminPublicationBatch {
  batchId: string;
  count: number;
  publishedAt: string;
}

export interface AdminPublicationCheck {
  id: string;
  inBank: boolean;
  /** A verified human approval record exists for this id. */
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  revision?: number;
  inManifest: boolean;
  /** A child can be served this question by the running deployment. */
  served: boolean;
}

export interface AdminPublicationData {
  gates: ReturnType<typeof getAdminOverviewData>["programmes"];
  batches: AdminPublicationBatch[];
  evidenceProblems: string[];
  totals: { manifests: number; approvals: number; served: number; authored: number };
  check: AdminPublicationCheck | null;
}

export function getAdminPublication(checkId?: string): AdminPublicationData {
  const overview = getAdminOverviewData();
  const eligibility = getPublicationEligibility();
  const { facts, problems } = readManifestFacts();

  const byBatch = new Map<string, AdminPublicationBatch>();
  for (const fact of facts) {
    const current = byBatch.get(fact.batchId);
    if (current) {
      current.count += 1;
      if (fact.publishedAt > current.publishedAt) current.publishedAt = fact.publishedAt;
    } else {
      byBatch.set(fact.batchId, { batchId: fact.batchId, count: 1, publishedAt: fact.publishedAt });
    }
  }
  const batches = [...byBatch.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  let check: AdminPublicationCheck | null = null;
  const id = checkId?.trim();
  if (id) {
    const approval = eligibility.approvals.get(id);
    check = {
      id,
      inBank: publishedExamBank.some((q) => q.id === id),
      approved: Boolean(approval),
      approvedBy: approval && "approvedBy" in approval ? approval.approvedBy : undefined,
      approvedAt: approval && "approvedAt" in approval ? approval.approvedAt : undefined,
      revision: approval && "revision" in approval ? approval.revision : undefined,
      inManifest: facts.some((f) => f.questionId === id),
      served: getExamBank("practice").some((q) => q.id === id),
    };
  }

  return {
    gates: overview.programmes,
    batches,
    evidenceProblems: [...problems, ...eligibility.problems],
    totals: {
      manifests: facts.length,
      approvals: eligibility.approvals.size,
      served: overview.programmes.reduce((n, p) => n + p.served, 0),
      authored: overview.authored,
    },
    check,
  };
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export interface AdminWritingPrompt {
  id: string;
  title: string;
  form: string;
  yearLevel: number;
  timeLimitMinutes: number;
  approvedBy: string;
  approvedAt: string;
  revision: number;
}

export function getAdminWriting(): { prompts: AdminWritingPrompt[]; problems: string[] } {
  const report = getWritingPromptEligibility();
  const prompts = [...report.approvals.values()].map((approval) => ({
    id: approval.promptId,
    title: approval.prompt.title,
    form: approval.prompt.form,
    yearLevel: approval.prompt.yearLevel,
    timeLimitMinutes: approval.prompt.timeLimitMinutes,
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    revision: approval.revision,
  }));
  prompts.sort((a, b) => a.id.localeCompare(b.id));
  return { prompts, problems: [...report.problems] };
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

/** Everything the repository's own evidence records: approvals and publications. Newest first. */
export function getAdminActivityEvents(): AdminActivityEvent[] {
  const events: AdminActivityEvent[] = [];
  for (const [id, approval] of getPublicationEligibility().approvals) {
    if (!("approvedBy" in approval) || !("approvedAt" in approval)) continue;
    events.push({
      id: `approve-${id}`,
      at: approval.approvedAt,
      actor: approval.approvedBy,
      action: "approved",
      target: id,
      detail: "revision" in approval ? `Revision ${approval.revision}` : undefined,
      hash: "contentHash" in approval ? approval.contentHash : undefined,
    });
  }
  for (const approval of getWritingPromptEligibility().approvals.values()) {
    events.push({
      id: `writing-${approval.promptId}`,
      at: approval.approvedAt,
      actor: approval.approvedBy,
      action: "writing_approved",
      target: approval.promptId,
      detail: `Writing prompt, revision ${approval.revision}`,
      hash: approval.contentHash,
    });
  }
  for (const batch of getAdminPublication().batches) {
    events.push({
      id: `publish-${batch.batchId}`,
      at: batch.publishedAt,
      actor: "System",
      action: "published",
      target: `Batch ${batch.batchId}`,
      detail: `${batch.count} question${batch.count === 1 ? "" : "s"} published`,
    });
  }
  return events.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
}
