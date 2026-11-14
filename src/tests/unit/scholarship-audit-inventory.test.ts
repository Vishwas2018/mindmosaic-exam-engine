import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";

interface InventoryItem {
  id: string;
  section: string;
  recomputedSourceFacts: { hashes: { d1_rawQuestionHash: string; d2_factoryCandidateHash: string; d3_publicationContentHash: string | null } };
  evidence: Record<string, { status: string }>;
  provenance: {
    verifiedOriginalGeneration: { status: string };
    independentReviewerQualification: { status: string };
  };
  governanceRecords: { humanApproval: { status: string }; publishedInCommittedManifests: { status: string } };
  policyDerivedAssessment: { publicationEligibility: string; blockingRequirements: string[] };
}

describe("Scholarship 160 inventory (committed artefact)", () => {
  const inventoryPath = path.join(process.cwd(), "docs/reviews/scholarship-2026-10-18/scholarship-160-inventory.json");
  const data = JSON.parse(readFileSync(inventoryPath, "utf8")) as {
    schemaVersion: number;
    totalQuestions: number;
    auditStatus: string;
    items: InventoryItem[];
    summary: Record<string, Record<string, unknown>>;
    contradictions: string[];
    generation: { mode: string };
  };

  it("is deterministic-schema v2, consistent, and has 160 items", () => {
    expect(data.schemaVersion).toBe(2);
    expect(data.generation.mode).toBe("deterministic");
    expect(data.totalQuestions).toBe(160);
    expect(data.items).toHaveLength(160);
    expect(data.auditStatus).toBe("consistent");
    expect(data.contradictions).toEqual([]);
  });

  it("recomputes D1, D2 and D3 for every question from the committed drafts", () => {
    const files = {
      nr: "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json",
      maths: "content/scholarship-drafts/scholarship-y6-mathematics-draft.json",
      vr: "content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json",
      rc: "content/scholarship-drafts/scholarship-y6-reading-draft.json",
    };
    const drafts = new Map<string, unknown>();
    for (const file of Object.values(files)) {
      const p = JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8")) as { questions: Array<{ id: string }> };
      for (const q of p.questions) drafts.set(q.id, q);
    }
    expect(drafts.size).toBe(160);
    for (const item of data.items) {
      const raw = drafts.get(item.id);
      expect(raw).toBeDefined();
      const candidate = candidateQuestionSchema.parse(raw);
      const built = buildPublishedQuestion(candidate);
      expect(built.ok).toBe(true);
      expect(item.recomputedSourceFacts.hashes.d1_rawQuestionHash).toBe(hashJson(raw));
      expect(item.recomputedSourceFacts.hashes.d2_factoryCandidateHash).toBe(hashJson(candidate));
      expect(item.recomputedSourceFacts.hashes.d3_publicationContentHash).toBe(built.ok ? canonicalQuestionHash(built.question) : null);
    }
  });

  it("has the programme section distribution 40 / 40 / 45 / 35", () => {
    const counts = { nr: 0, maths: 0, vr: 0, rc: 0 };
    for (const item of data.items) counts[item.section as keyof typeof counts]++;
    expect(counts).toEqual({ nr: 40, maths: 40, vr: 45, rc: 35 });
  });

  it("derived counts are internally consistent with the items", () => {
    const verified = data.items.filter((i) => i.evidence.machineVerifiedResult.status === "verified").length;
    const failed = data.items.filter((i) => i.evidence.machineVerifiedResult.status === "failed").length;
    const notEstablished = data.items.filter((i) => i.evidence.machineVerifiedResult.status === "not_established").length;
    expect(verified + failed + notEstablished).toBe(160);
    expect(data.summary.machineKeyCheck).toMatchObject({ verified, failed, not_established: notEstablished });
    expect(failed).toBe(0);
  });

  it("never asserts educational, provenance, approval or independence success that primary evidence does not support", () => {
    for (const item of data.items) {
      for (const field of ["stemToSolverSemanticVerification", "independentAnswerUniqueness", "distractorQuality", "ageCurriculumAppropriateness", "qualifiedHumanReview"]) {
        expect(item.evidence[field].status, `${item.id}.${field}`).toBe("not_established");
      }
      expect(item.provenance.verifiedOriginalGeneration.status).toBe("not_established");
      expect(item.provenance.independentReviewerQualification.status).toBe("not_established");
      expect(item.governanceRecords.humanApproval.status).toBe("not_established");
      expect(item.governanceRecords.publishedInCommittedManifests.status).toBe("verified");
      expect(item.policyDerivedAssessment.publicationEligibility).toMatch(/^refused/);
      expect(item.policyDerivedAssessment.blockingRequirements.some((b) => b.startsWith("human_approval"))).toBe(true);
      expect(item.policyDerivedAssessment.blockingRequirements.some((b) => b.startsWith("provenance_hold"))).toBe(true);
    }
  });
});
