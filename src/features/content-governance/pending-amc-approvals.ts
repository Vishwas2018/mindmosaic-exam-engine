import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { verifyFirstPartyAmcAttestation } from "@/features/question-factory/correctness/amc-attestation";
import { z } from "zod";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { AMC_ATTESTED_CONTENT_HASHES } from "@/features/question-factory/correctness/amc-content-bindings";
import { humanPublicationApprovalSchema, validateHumanApproval, type HumanPublicationApproval } from "./publication-integrity";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
const reviewSource = z.object({ kind: z.literal("amc_draft_review_source"), schemaVersion: z.literal(1),
  questionId: z.string().regex(/^roadmap-amc-y[35]-[0-9]{3}$/), revision: z.literal(1),
  sourceFile: z.string().min(1), sourceQuestionHash: digest, contentHash: digest }).strict();
const excluded = new Set(["roadmap-amc-y3-014", "roadmap-amc-y5-006", "roadmap-amc-y5-028"]);

/** Recognizes valid approval of a registered, hash-pinned authoring target. It NEVER marks the target published or eligible for serving. Invalid/missing/duplicate sources remain orphan errors. */
export function partitionPendingAmcApprovals(
  publishedIds: ReadonlySet<string>, approvals: readonly unknown[], sourceRecords: readonly unknown[],
): { readonly pending: readonly HumanPublicationApproval[]; readonly publicationRecords: readonly unknown[] } {
  const pending: HumanPublicationApproval[] = [];
  const publicationRecords: unknown[] = [];
  for (const raw of approvals) {
    const parsed = humanPublicationApprovalSchema.safeParse(raw);
    if (!parsed.success || publishedIds.has(parsed.data.questionId) || excluded.has(parsed.data.questionId)) {
      publicationRecords.push(raw); continue;
    }
    const approval = parsed.data;
    const matching = sourceRecords.flatMap((record) => {
      const source = reviewSource.safeParse(record);
      return source.success && source.data.questionId === approval.questionId ? [source.data] : [];
    });
    const source = matching.length === 1 ? matching[0] : undefined;
    if (!source || source.sourceQuestionHash !== AMC_ATTESTED_CONTENT_HASHES[approval.questionId] ||
        approval.contentHash !== source.contentHash || approval.sourceManifestHash !== hashJson(source)) {
      publicationRecords.push(raw); continue;
    }
    const candidate = candidateQuestionSchema.safeParse(approval.question);
    if (!candidate.success || !verifyFirstPartyAmcAttestation(candidate.data, source.sourceQuestionHash).ok) {
      publicationRecords.push(raw); continue;
    }
    const valid = validateHumanApproval(raw, approval.question, source.revision, hashJson(source));
    if (!valid.ok) { publicationRecords.push(raw); continue; }
    pending.push(valid.approval);
  }
  // A duplicated signature is never silently de-duplicated into a pending pass.
  const duplicated = new Set(pending.filter((record, index) => pending.findIndex((other) => other.questionId === record.questionId) !== index).map((record) => record.questionId));
  return { pending: pending.filter((record) => !duplicated.has(record.questionId)),
    publicationRecords: [...publicationRecords, ...pending.filter((record) => duplicated.has(record.questionId))] };
}
