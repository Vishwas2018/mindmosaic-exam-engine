import { z } from "zod";

import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { validateManifestReviewEvidence } from "@/features/question-factory/publication/manifest-schema";
import { questionSchema, type Question } from "@/schemas/question.schema";

const digest = z.string().regex(/^[a-f0-9]{64}$/);

/** Private authoring evidence. Never send this record to a learner. */
export const humanPublicationApprovalSchema = z.object({
  kind: z.literal("human_publication_approval"),
  schemaVersion: z.literal(1),
  questionId: z.string().min(1),
  revision: z.number().int().nonnegative(),
  approvedBy: z.string().trim().min(1),
  approvedAt: z.iso.datetime({ offset: true }),
  contentHash: digest,
  sourceManifestHash: digest.nullable(),
  checks: z.object({
    correctness: z.literal(true),
    originality: z.literal(true),
    ageAppropriateness: z.literal(true),
  }).strict(),
  question: questionSchema,
  fingerprint: digest,
}).strict();

export type HumanPublicationApproval = z.infer<typeof humanPublicationApprovalSchema>;

/** Schema validation and defaults define the canonical content representation. */
export function canonicalQuestionHash(question: unknown): string {
  return hashJson(questionSchema.parse(question));
}

export function approvalFingerprint(approval: Omit<HumanPublicationApproval, "fingerprint">): string {
  return hashJson(approval);
}

export function validateHumanApproval(
  raw: unknown,
  question: Question,
  revision: number,
  sourceManifestHash: string | null,
): { ok: true; approval: HumanPublicationApproval } | { ok: false; reason: string } {
  const parsed = humanPublicationApprovalSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "missing_or_invalid_human_approval" };
  const { fingerprint, ...facts } = parsed.data;
  if (fingerprint !== approvalFingerprint(facts)) return { ok: false, reason: "approval_fingerprint_mismatch" };
  if (facts.questionId !== question.id || facts.question.id !== question.id || facts.revision !== revision) {
    return { ok: false, reason: "approval_revision_mismatch" };
  }
  if (facts.sourceManifestHash !== sourceManifestHash) return { ok: false, reason: "approval_source_mismatch" };
  if (question.status !== "published" || facts.contentHash !== canonicalQuestionHash(question) ||
      facts.contentHash !== canonicalQuestionHash(facts.question)) {
    return { ok: false, reason: "approved_content_mismatch" };
  }
  return { ok: true, approval: parsed.data };
}

const MANIFEST_FACT_KEYS = [
  "candidateId", "questionId", "contentHash", "revision", "blueprintId", "batchId",
  "generatorAdapter", "originalityFingerprint", "difficultyFingerprint", "publishedAt", "question",
] as const;

/** Keep historical fingerprints reproducible without rewriting historical evidence. */
export function publicationManifestFacts(manifest: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(MANIFEST_FACT_KEYS.map((key) => [key, manifest[key]]));
}

export function validatePublicationSource(raw: unknown, question: Question):
  | { ok: true; revision: number; sourceManifestHash: string; embeddedApproval: unknown }
  | { ok: false; reason: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "missing_manifest" };
  const manifest = raw as Record<string, unknown>;
  if (manifest.questionId !== question.id || typeof manifest.candidateId !== "string" ||
      typeof manifest.contentHash !== "string" || !Number.isInteger(manifest.revision) || Number(manifest.revision) < 0) {
    return { ok: false, reason: "invalid_manifest_identity" };
  }
  if (manifest.manifestFingerprint !== hashJson(publicationManifestFacts(manifest))) {
    return { ok: false, reason: "manifest_fingerprint_mismatch" };
  }
  try {
    if (canonicalQuestionHash(manifest.question) !== canonicalQuestionHash(question)) {
      return { ok: false, reason: "manifest_content_mismatch" };
    }
    const evidence = validateManifestReviewEvidence(manifest as unknown as Parameters<typeof validateManifestReviewEvidence>[0]);
    if (!evidence.ok) return { ok: false, reason: "invalid_review_evidence" };
  } catch {
    return { ok: false, reason: "invalid_manifest_content" };
  }
  // Approval is separately fingerprinted and bound to all remaining manifest evidence.
  const { humanApproval: _approval, ...source } = manifest;
  void _approval;
  return { ok: true, revision: Number(manifest.revision), sourceManifestHash: hashJson(source), embeddedApproval: manifest.humanApproval };
}

export interface PublicationEligibilityReport {
  readonly questions: readonly Question[];
  readonly approvals: ReadonlyMap<string, HumanPublicationApproval>;
  readonly excluded: readonly { questionId: string; reason: string }[];
  readonly problems: readonly string[];
}

/** Fail closed per item; an ambiguous identity is never resolved by picking the first record. */
export function selectApprovedQuestions(
  questions: readonly Question[],
  factoryIds: ReadonlySet<string>,
  manifests: readonly unknown[],
  approvals: readonly unknown[],
): PublicationEligibilityReport {
  const manifestMap = new Map<string, unknown[]>();
  const approvalMap = new Map<string, unknown[]>();
  const problems: string[] = [];
  for (const [records, index] of [[manifests, manifestMap], [approvals, approvalMap]] as const) {
    for (const raw of records) {
      const id = raw && typeof raw === "object" ? (raw as Record<string, unknown>).questionId : undefined;
      if (typeof id !== "string") { problems.push("publication evidence has no questionId"); continue; }
      index.set(id, [...(index.get(id) ?? []), raw]);
    }
  }
  const approved: Question[] = [];
  const verifiedApprovals = new Map<string, HumanPublicationApproval>();
  const excluded: { questionId: string; reason: string }[] = [];
  const counts = new Map<string, number>();
  for (const q of questions) counts.set(q.id, (counts.get(q.id) ?? 0) + 1);
  for (const question of questions) {
    let revision = 1;
    let sourceHash: string | null = null;
    let embedded: unknown;
    let reason: string | undefined;
    const sources = manifestMap.get(question.id) ?? [];
    if (counts.get(question.id) !== 1) reason = "duplicate_question_id";
    else if (factoryIds.has(question.id)) {
      if (sources.length !== 1) reason = sources.length ? "duplicate_manifest" : "missing_manifest";
      else {
        const source = validatePublicationSource(sources[0], question);
        if (!source.ok) reason = source.reason;
        else { revision = source.revision; sourceHash = source.sourceManifestHash; embedded = source.embeddedApproval; }
      }
    } else if (sources.length > 0) reason = "ambiguous_curated_source";
    const records = [...(approvalMap.get(question.id) ?? []), ...(embedded === undefined ? [] : [embedded])];
    if (!reason && records.length > 1) reason = "duplicate_approval";
    if (!reason && records.length === 0) {
      excluded.push({ questionId: question.id, reason: "awaiting_human_approval" });
      continue;
    }
    if (!reason) {
      const result = validateHumanApproval(records[0], question, revision, sourceHash);
      if (result.ok) { approved.push(question); verifiedApprovals.set(question.id, result.approval); }
      else reason = result.reason;
    }
    if (reason) {
      excluded.push({ questionId: question.id, reason });
      problems.push(`${question.id}: ${reason}`);
    }
  }
  const ids = new Set(questions.map((q) => q.id));
  for (const [id] of approvalMap) if (!ids.has(id)) problems.push(`${id}: orphan_approval`);
  for (const [id] of manifestMap) if (!ids.has(id)) problems.push(`${id}: orphan_manifest`);
  return { questions: Object.freeze(approved), approvals: verifiedApprovals, excluded, problems };
}
