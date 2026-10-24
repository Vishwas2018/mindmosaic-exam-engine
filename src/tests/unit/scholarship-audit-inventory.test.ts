import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";

describe("Scholarship 160 inventory deterministic verification", () => {
  const inventoryPath = path.join(process.cwd(), "docs/reviews/scholarship-2026-10-18/scholarship-160-inventory.json");

  it("inventory file exists and is valid JSON", () => {
    expect(existsSync(inventoryPath)).toBe(true);
    const data = JSON.parse(readFileSync(inventoryPath, "utf8"));
    expect(data.totalQuestions).toBe(160);
    expect(data.items).toHaveLength(160);
  });

  it("recomputes hashes for every question and confirms exact D1, D2, D3 match", () => {
    const data = JSON.parse(readFileSync(inventoryPath, "utf8"));
    const files = {
      nr: "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json",
      maths: "content/scholarship-drafts/scholarship-y6-mathematics-draft.json",
      vr: "content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json",
      rc: "content/scholarship-drafts/scholarship-y6-reading-draft.json",
    };

    const drafts = new Map<string, any>();
    for (const [sec, file] of Object.entries(files)) {
      const p = JSON.parse(readFileSync(path.join(process.cwd(), file), "utf8"));
      for (const q of p.questions) {
        drafts.set(q.id, q);
      }
    }

    expect(drafts.size).toBe(160);

    for (const item of data.items) {
      const raw = drafts.get(item.id);
      expect(raw).toBeDefined();
      const candidate = candidateQuestionSchema.parse(raw);
      const built = buildPublishedQuestion(candidate);
      expect(built.ok).toBe(true);

      const d1 = hashJson(raw);
      const d2 = hashJson(candidate);
      const d3 = built.ok ? canonicalQuestionHash(built.question) : null;

      expect(item.hashes.d1_rawQuestionHash).toBe(d1);
      expect(item.hashes.d2_factoryCandidateHash).toBe(d2);
      expect(item.hashes.d3_publicationContentHash).toBe(d3);
      expect(item.provenanceStatus).toBe("unverified_legacy_origin");
      expect(item.humanApprovalStatus).toBe("none");
      expect(item.pipelineAndPublicationEligibility).toBe("ineligible_blocked");
    }
  });

  it("verifies accurate section distribution", () => {
    const data = JSON.parse(readFileSync(inventoryPath, "utf8"));
    const counts = { nr: 0, maths: 0, vr: 0, rc: 0 };
    for (const item of data.items) {
      counts[item.section as keyof typeof counts]++;
    }
    expect(counts).toEqual({
      nr: 40,
      maths: 40,
      vr: 45,
      rc: 35,
    });
  });

  it("verifies pipeline blockers and non-fabrication of approval or provenance", () => {
    const data = JSON.parse(readFileSync(inventoryPath, "utf8"));
    for (const item of data.items) {
      expect(item.blockingRequirements).toContain("human_approval: No qualified human approval on file");
      expect(item.blockingRequirements).toContain("provenance_hold: Unknown original generation; Phase 1 hold active; ADR-017 policy adopted but engineering unbuilt");
    }
  });
});
