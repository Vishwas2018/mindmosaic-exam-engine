import { describe, expect, it } from "vitest";

import { approvalFingerprint, canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { assemblePublishedQuestions } from "@/features/question-factory/publication";
import {
  approvalFor,
  loadScholarshipDraftQuestions,
  manifestFor,
  repositoryOf,
} from "@/tests/helpers/scholarship-published";
import { questionBank } from "@/content/questions/question-bank";

const SCOPE = { onlyExamStyle: "scholarship_style" } as const;
const maths = loadScholarshipDraftQuestions("maths");
const nr = loadScholarshipDraftQuestions("nr");
const vr = loadScholarshipDraftQuestions("vr");

/** A signed external approval for the manifest, then the assembly of that single manifest. */
async function assembleOne(
  mutate?: (m: Record<string, unknown>) => Record<string, unknown>,
  approvalsFor?: (m: Record<string, unknown>) => unknown[],
  question = maths[0],
) {
  const manifest = mutate ? mutate(manifestFor(question)) : manifestFor(question);
  const approvals = approvalsFor ? approvalsFor(manifest) : [approvalFor(question, manifest)];
  return assemblePublishedQuestions(repositoryOf([manifest]), approvals, SCOPE);
}

describe("scholarship strict scoped assembly", () => {
  it("assembles an item with exactly one valid external approval", async () => {
    const result = await assembleOne();
    expect(result.warnings).toEqual([]);
    expect(result.questions.map((q) => q.id)).toEqual([maths[0].id]);
  });

  it("accepts the approval embedded in the manifest when no external record exists, never both", async () => {
    const q = maths[1];
    const bare = manifestFor(q);
    const embedded = manifestFor(q, approvalFor(q, bare));
    const only = await assemblePublishedQuestions(repositoryOf([embedded]), [], SCOPE);
    expect(only.warnings).toEqual([]);
    expect(only.questions).toHaveLength(1);

    const both = await assemblePublishedQuestions(repositoryOf([embedded]), [approvalFor(q, bare)], SCOPE);
    expect(both.questions).toEqual([]);
    expect(both.warnings.join("\n")).toMatch(/no valid unique revision-bound human approval/);
  });

  it("rejects a missing approval", async () => {
    const result = await assembleOne(undefined, () => []);
    expect(result.questions).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it("rejects a duplicate approval", async () => {
    const result = await assembleOne(undefined, (m) => [approvalFor(maths[0], m), approvalFor(maths[0], m)]);
    expect(result.questions).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it("rejects a stale approval after the question content changes", async () => {
    const original = maths[2];
    const oldManifest = manifestFor(original);
    const staleApproval = approvalFor(original, oldManifest);
    // The explanation is corrected after sign-off, so the content hash the reviewer approved no longer matches.
    const revised = { ...original, explanation: `${original.explanation} (corrected)` };
    expect(canonicalQuestionHash(revised)).not.toBe(canonicalQuestionHash(original));
    const result = await assemblePublishedQuestions(repositoryOf([manifestFor(revised)]), [staleApproval], SCOPE);
    expect(result.questions).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it("rejects an approval bound to a different manifest, revision or question", async () => {
    const q = maths[3];
    const manifest = manifestFor(q);
    const good = approvalFor(q, manifest);

    const wrongRevision = { ...good, revision: good.revision + 1 };
    const { fingerprint: _f1, ...revFacts } = wrongRevision;
    void _f1;
    const refingerprinted = { ...revFacts, fingerprint: approvalFingerprint(revFacts) };
    expect((await assemblePublishedQuestions(repositoryOf([manifest]), [refingerprinted], SCOPE)).questions).toEqual([]);

    const otherManifest = { ...manifest, publishedAt: "2026-10-21T01:00:00.000Z" };
    expect((await assemblePublishedQuestions(repositoryOf([otherManifest]), [good], SCOPE)).questions).toEqual([]);

    const tampered = { ...good, approvedBy: "Someone Else" };
    expect((await assemblePublishedQuestions(repositoryOf([manifest]), [tampered], SCOPE)).questions).toEqual([]);

    const forOther = approvalFor(maths[4], manifestFor(maths[4]));
    const orphan = await assemblePublishedQuestions(repositoryOf([manifest]), [forOther], SCOPE);
    expect(orphan.questions).toEqual([]);
    expect(orphan.warnings.join("\n")).toMatch(/orphan approval refused/);
  });

  it("refuses an approval that names a model or tool instead of a person", async () => {
    for (const name of ["Claude Opus 5.5", "ChatGPT", "gemini-ultra", "Anthropic automated review"]) {
      const q = maths[5];
      const bare = manifestFor(q);
      const embedded = manifestFor(q, approvalFor(q, bare, name));
      const result = await assemblePublishedQuestions(repositoryOf([embedded]), [], SCOPE);
      expect(result.questions, name).toEqual([]);
      expect(result.warnings.join("\n"), name).toMatch(/not a human/);
    }
  });

  it("refuses a scholarship-style question whose id is outside the scholarship pool", async () => {
    const q = { ...maths[6], id: "naplan-y5-numeracy-9999" };
    const result = await assemblePublishedQuestions(repositoryOf([manifestFor(q)]), [], SCOPE);
    expect(result.questions).toEqual([]);
    expect(result.warnings.join("\n")).toMatch(/not a scholarship pool id/);
  });

  it("refuses a first-party attested item whose answer key disagrees with the independent recompute", async () => {
    const q = maths[7];
    const wrongKey = { ...q, answerKey: { kind: "single_option" as const, optionId: q.options.find((o) => o.id !== (q.answerKey as { optionId: string }).optionId)!.id } };
    const manifest = manifestFor(wrongKey);
    const result = await assemblePublishedQuestions(repositoryOf([manifest]), [approvalFor(wrongKey, manifest)], SCOPE);
    expect(result.questions).toEqual([]);
    expect(result.warnings.join("\n")).toMatch(/first-party answer attestation/);
  });

  it("leaves out-of-scope manifests untouched, whatever their approval state", async () => {
    const legacy = manifestFor({ ...questionBank[0] });
    const q = nr[0];
    const manifest = manifestFor(q);
    const result = await assemblePublishedQuestions(repositoryOf([legacy, manifest]), [approvalFor(q, manifest)], SCOPE);
    expect(result.warnings).toEqual([]);
    expect(result.outOfScope).toBe(1);
    expect(result.questions.map((x) => x.id)).toEqual([q.id]);
  });

  it("does not let an unapproved legacy manifest block the scholarship pool, and the legacy assembly never includes scholarship", async () => {
    const q = vr[0];
    const manifest = manifestFor(q, approvalFor(q, manifestFor(q)));
    const scoped = await assemblePublishedQuestions(repositoryOf([manifestFor(questionBank[1]), manifest]), [], SCOPE);
    expect(scoped.questions.map((x) => x.id)).toEqual([q.id]);

    const legacyAssembly = await assemblePublishedQuestions(repositoryOf([manifest]), [], { excludeExamStyle: "scholarship_style" });
    expect(legacyAssembly.questions).toEqual([]);
    expect(legacyAssembly.outOfScope).toBe(1);
  });

  it("accepts an empty scholarship pool when no scholarship manifest is published", async () => {
    const result = await assemblePublishedQuestions(repositoryOf([manifestFor({ ...questionBank[2] })]), [], SCOPE);
    expect(result.questions).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("flags a duplicate scholarship manifest as a refusal, not a silent pick", async () => {
    const q = maths[8];
    const m1 = manifestFor(q);
    const m2 = { ...manifestFor(q), candidateId: `${q.id}-second` };
    const approvals = [approvalFor(q, m1)];
    const result = await assemblePublishedQuestions(repositoryOf([m1, m2]), approvals, SCOPE);
    expect(result.questions).toHaveLength(1);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
