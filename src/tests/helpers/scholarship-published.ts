import { readFileSync } from "node:fs";
import path from "node:path";

import { approvalFingerprint, canonicalQuestionHash, type HumanPublicationApproval } from "@/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";
import { validatePublicationSource } from "@/features/content-governance/publication-integrity";
import type { FactoryRepository } from "@/features/question-factory/storage";
import type { Question } from "@/schemas/question.schema";

/**
 * Test-only: the 160 scholarship drafts rendered exactly as `orchestratePublication` would build a published
 * Question, so assembly, selection and scoring can be exercised against the real content without that content
 * ever being published, approved or reachable from the served bank.
 */
const FILES = {
  nr: "scholarship-y6-numerical-reasoning-draft.json",
  maths: "scholarship-y6-mathematics-draft.json",
  vr: "scholarship-y6-verbal-reasoning-draft.json",
  rc: "scholarship-y6-reading-draft.json",
} as const;

export type ScholarshipSection = keyof typeof FILES;

export function loadScholarshipDraftQuestions(section: ScholarshipSection): Question[] {
  const packet = JSON.parse(readFileSync(path.join(process.cwd(), "content/scholarship-drafts", FILES[section]), "utf8")) as {
    questions: unknown[];
  };
  return packet.questions.map((raw) => {
    const candidate = candidateQuestionSchema.parse(raw);
    const built = buildPublishedQuestion(candidate);
    if (!built.ok) throw new Error(`${candidate.id}: ${built.issues.join("; ")}`);
    return built.question;
  });
}

export const approvedAt = "2026-10-20T01:00:00.000Z";

export function manifestFor(question: Question, withApproval?: HumanPublicationApproval): Record<string, unknown> {
  const facts = {
    candidateId: question.id, questionId: question.id, contentHash: hashJson({ candidate: question.id }), revision: 1,
    blueprintId: `${question.id}-seed-001`, batchId: "fixture-batch", generatorAdapter: { class: "manual_external" },
    originalityFingerprint: "b".repeat(64), difficultyFingerprint: "c".repeat(64), publishedAt: approvedAt, question,
  };
  return { ...facts, manifestFingerprint: hashJson(facts), noChainRecovered: true, ...(withApproval ? { humanApproval: withApproval } : {}) };
}

/** The approval a human reviewer's sign-off would produce for this exact manifest, for tests only. */
export function approvalFor(question: Question, manifest: Record<string, unknown>, approvedBy = "Fixture Reviewer"): HumanPublicationApproval {
  const source = validatePublicationSource(manifest, question);
  if (!source.ok) throw new Error(source.reason);
  const facts = {
    kind: "human_publication_approval" as const, schemaVersion: 1 as const, questionId: question.id, revision: source.revision,
    approvedBy, approvedAt, contentHash: canonicalQuestionHash(question), sourceManifestHash: source.sourceManifestHash,
    checks: { correctness: true as const, originality: true as const, ageAppropriateness: true as const }, question,
  };
  return { ...facts, fingerprint: approvalFingerprint(facts) };
}

export function repositoryOf(manifests: readonly Record<string, unknown>[]): FactoryRepository {
  const byId = new Map(manifests.map((m) => [String(m.candidateId), m]));
  return { list: async () => [...byId.keys()], read: async (_c: string, id: string) => byId.get(id) } as unknown as FactoryRepository;
}
