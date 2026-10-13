import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { approvalFingerprint, canonicalQuestionHash, publicationManifestFacts,
  selectApprovedQuestions, validateHumanApproval, validatePublicationSource,
  type HumanPublicationApproval } from "@/features/content-governance/publication-integrity";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { buildProjectionPlan } from "@/features/content-projection/build-projection-plan";
import { assemblePublishedQuestions } from "@/features/question-factory/publication/assemble-published-bank";
import type { FactoryRepository } from "@/features/question-factory/storage";

const question = questionBank[0];
const approvedAt = "2026-10-05T05:00:00.000Z";

function approval(sourceManifestHash: string | null = null, revision = 1): HumanPublicationApproval {
  const facts = { kind: "human_publication_approval" as const, schemaVersion: 1 as const,
    questionId: question.id, revision, approvedBy: "fixture-human-reviewer", approvedAt,
    contentHash: canonicalQuestionHash(question), sourceManifestHash,
    checks: { correctness: true as const, originality: true as const, ageAppropriateness: true as const }, question };
  return { ...facts, fingerprint: approvalFingerprint(facts) };
}

function manifest(): Record<string, unknown> {
  const facts = { candidateId: "fixture-candidate", questionId: question.id,
    contentHash: "a".repeat(64), revision: 0, blueprintId: "fixture-blueprint", batchId: "fixture-batch",
    generatorAdapter: { class: "manual_external" }, originalityFingerprint: "b".repeat(64),
    difficultyFingerprint: "c".repeat(64), publishedAt: approvedAt, question };
  return { ...facts, manifestFingerprint: hashJson(facts), noChainRecovered: true };
}

describe("revision-bound human publication approval", () => {
  it("rejects unsigned projection and revalidates supplied approval snapshots", () => {
    const input = { questions: [question], manifests: [], factoryQuestionIds: new Set<string>(), curatedPublishedAt: approvedAt };
    expect(buildProjectionPlan(input).items).toEqual([]);
    const signed = approval();
    expect(buildProjectionPlan({ ...input, approvals: new Map([[question.id, signed]]) }).items).toHaveLength(1);
    expect(buildProjectionPlan({ ...input, approvals: new Map([[question.id, { ...signed, approvedBy: "tampered" }]]) }).items).toEqual([]);
  });

  it("assembles only valid approved manifests, including external migration approvals", async () => {
    const source = manifest();
    const valid = validatePublicationSource(source, question);
    if (!valid.ok) throw new Error(valid.reason);
    const repository = { list: async () => ["fixture-candidate"], read: async () => source } as unknown as FactoryRepository;
    expect((await assemblePublishedQuestions(repository)).questions).toEqual([]);
    const signed = approval(valid.sourceManifestHash, valid.revision);
    expect((await assemblePublishedQuestions(repository, [signed])).questions).toEqual([question]);
    expect((await assemblePublishedQuestions(repository, [signed, signed])).questions).toEqual([]);
  });

  it("invalidates approval when accessible visual content changes", () => {
    const visualQuestion = questionBank.find(q => q.visuals.length > 0)!;
    const { fingerprint: _fingerprint, ...facts } = approval();
    void _fingerprint;
    const visualFacts = { ...facts, questionId: visualQuestion.id, question: visualQuestion, contentHash: canonicalQuestionHash(visualQuestion) };
    const signed = { ...visualFacts, fingerprint: approvalFingerprint(visualFacts) };
    const changed = { ...visualQuestion, visuals: visualQuestion.visuals.map(visual => ({ ...visual, altText: visual.altText + " changed" })) };
    expect(canonicalQuestionHash(changed)).not.toBe(canonicalQuestionHash(visualQuestion));
    expect(validateHumanApproval(signed, changed, 1, null).ok).toBe(false);
  });
  it("excludes unsigned curated content without discarding its authoring material", () => {
    const result = selectApprovedQuestions([question], new Set(), [], []);
    expect(result.questions).toEqual([]);
    expect(result.excluded).toEqual([{ questionId: question.id, reason: "awaiting_human_approval" }]);
    expect(result.problems).toEqual([]);
    expect(questionBank).toContain(question);
  });

  it("admits the exact approved curated snapshot", () => {
    const result = selectApprovedQuestions([question], new Set(), [], [approval()]);
    expect(result.questions).toEqual([question]);
    expect(result.approvals.get(question.id)?.approvedBy).toBe("fixture-human-reviewer");
    expect(result.problems).toEqual([]);
  });

  it("rejects modified answers, prompts, explanations, and visuals after approval", () => {
    if (question.answerKey.kind !== "single_option") throw new Error("Expected multiple-choice fixture");
    const correctId = question.answerKey.optionId;
    const alternate = question.options.find(option => option.id !== correctId)!;
    for (const edited of [ { ...question, prompt: question.prompt + " modified" },
      { ...question, explanation: "Modified explanation" },
      { ...question, options: question.options.map((option, index) => index === 0 ? { ...option, text: option.text + " changed" } : option) },
      { ...question, answerKey: { kind: "single_option" as const, optionId: alternate.id } } ]) {
      expect(canonicalQuestionHash(edited)).not.toBe(canonicalQuestionHash(question));
      expect(validateHumanApproval(approval(), edited, 1, null).ok).toBe(false);
    }
  });

  it("rejects edited reviewer identity, timestamp, or review checks", () => {
    for (const edited of [{ ...approval(), approvedBy: "another-reviewer" },
      { ...approval(), approvedAt: "2026-10-06T05:00:00.000Z" },
      { ...approval(), checks: { correctness: false, originality: true, ageAppropriateness: true } }]) {
      expect(validateHumanApproval(edited, question, 1, null).ok).toBe(false);
    }
  });

  it("rejects a reused approval for another revision or source", () => {
    expect(validateHumanApproval(approval(), question, 2, null).ok).toBe(false);
    expect(validateHumanApproval(approval(), question, 1, "a".repeat(64)).ok).toBe(false);
  });

  it("rejects duplicate approvals and question identities", () => {
    expect(selectApprovedQuestions([question], new Set(), [], [approval(), approval()]).questions).toEqual([]);
    expect(selectApprovedQuestions([question, question], new Set(), [], [approval()]).questions).toEqual([]);
  });

  it("requires valid source evidence as well as approval for factory content", () => {
    const source = manifest();
    const valid = validatePublicationSource(source, question);
    expect(valid.ok).toBe(true);
    if (!valid.ok) throw new Error(valid.reason);
    const signed = approval(valid.sourceManifestHash, valid.revision);
    expect(selectApprovedQuestions([question], new Set([question.id]), [source], [signed]).questions).toEqual([question]);
    expect(selectApprovedQuestions([question], new Set([question.id]), [], [signed]).questions).toEqual([]);
    expect(selectApprovedQuestions([question], new Set([question.id]), [source, source], [signed]).questions).toEqual([]);
  });

  it("rejects changed manifest evidence even when the content is unchanged", () => {
    const source = manifest();
    const valid = validatePublicationSource(source, question);
    if (!valid.ok) throw new Error(valid.reason);
    const signed = approval(valid.sourceManifestHash, valid.revision);
    const edited = { ...source, noChainRecovered: true, recoveredEvidence: [] };
    const result = selectApprovedQuestions([question], new Set([question.id]), [edited], [signed]);
    expect(result.questions).toEqual([]);
    expect(result.problems).toContain(`${question.id}: approval_source_mismatch`);
  });

  it("recognises embedded approval without making its hash self-referential", () => {
    const source = manifest();
    const valid = validatePublicationSource(source, question);
    if (!valid.ok) throw new Error(valid.reason);
    source.humanApproval = approval(valid.sourceManifestHash, valid.revision);
    expect(selectApprovedQuestions([question], new Set([question.id]), [source], []).questions).toEqual([question]);
  });

  it("compares schema-normalised content while preserving historical fingerprints", () => {
    const source = manifest();
    const normalised = { ...question, metadata: { ...question.metadata, tags: [] } };
    const rawQuestion = { ...normalised, metadata: { ...normalised.metadata } };
    delete (rawQuestion.metadata as Record<string, unknown>).tags;
    source.question = rawQuestion;
    source.manifestFingerprint = hashJson(publicationManifestFacts(source));
    expect(validatePublicationSource(source, normalised).ok).toBe(true);
    expect(canonicalQuestionHash(question)).toBe(canonicalQuestionHash(JSON.parse(JSON.stringify(question))));
  });

  it("rejects corrupted fingerprints, invalid content, and non-published questions", () => {
    expect(validatePublicationSource({ ...manifest(), manifestFingerprint: "d".repeat(64) }, question).ok).toBe(false);
    expect(validateHumanApproval(approval(), { ...question, status: "draft" }, 1, null).ok).toBe(false);
    expect(validateHumanApproval({}, question, 1, null).ok).toBe(false);
  });

  it("reports orphan approvals instead of silently accepting stale evidence", () => {
    expect(selectApprovedQuestions([], new Set(), [], [approval()]).problems).toEqual([`${question.id}: orphan_approval`]);
  });
});
