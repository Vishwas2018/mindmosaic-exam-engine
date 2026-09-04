import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  practiceExamBank,
  practiceQuestions,
  publishedExamBank,
} from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { LEVEL_5_ALIGNMENTS } from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";

interface ManifestEntry {
  id: string;
  curriculumNode: string;
  type: string;
  status: string;
  reviewStatus: string;
  hasVisual: boolean;
  question: any;
}

interface Manifest {
  batchId: string;
  description: string;
  generatedAt: string;
  nodesDeepened: number;
  itemsGenerated: number;
  passedValidation: number;
  quarantined: number;
  numeracyVisualCount: number;
  numeracyTotalCount: number;
  numeracyVisualPercentage: number;
  status: string;
  entries: ManifestEntry[];
}

const manifestPath = path.resolve(
  process.cwd(),
  "content/curriculum-imports/g5-depth-2026-09-02-review-queue-manifest.json",
);

const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const allEntries = manifest.entries;
const allIds = allEntries.map((e) => e.id);

describe("Grade 5 depth 2026-09-02 review queue quarantine verification", () => {
  it("the manifest accounts for exactly 61 generated items, all quarantined with status 'pending'", () => {
    expect(manifest.batchId).toBe("g5-depth-2026-09-02");
    expect(manifest.status).toBe("pending");
    expect(manifest.nodesDeepened).toBe(30);
    expect(manifest.itemsGenerated).toBe(61);
    expect(manifest.passedValidation).toBe(61);
    expect(manifest.quarantined).toBe(61);
    expect(allEntries).toHaveLength(61);

    // Ensure non-vacuous unique IDs
    const idSet = new Set(allIds);
    expect(idSet.size).toBe(61);

    for (const entry of allEntries) {
      expect(entry.status).toBe("pending");
      expect(entry.reviewStatus).toBe("pending");
    }
  });

  it("all 61 generated questions validate against candidateQuestionSchema", () => {
    for (const entry of allEntries) {
      const parseResult = candidateQuestionSchema.safeParse(entry.question);
      expect(parseResult.success, `Question ${entry.id} failed validation`).toBe(true);
    }
  });

  it("visual coverage for numeracy items is between 40% and 60% with valid alt text", () => {
    const numeracyEntries = allEntries.filter(
      (e) => e.question.metadata?.subject === "numeracy",
    );
    expect(numeracyEntries).toHaveLength(26);

    const withVisuals = numeracyEntries.filter((e) => e.hasVisual);
    expect(withVisuals).toHaveLength(11); // exactly 42.3%
    const percentage = (withVisuals.length / numeracyEntries.length) * 100;
    expect(percentage).toBeGreaterThanOrEqual(40);
    expect(percentage).toBeLessThanOrEqual(60);

    for (const entry of withVisuals) {
      for (const visual of entry.question.visuals) {
        expect(visual.altText).toBeDefined();
        expect(visual.altText.length).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it("zero generated items leaked into practiceQuestions", () => {
    const practiceIds = new Set(practiceQuestions.map((q) => q.id));
    const leaked = allEntries.filter((e) => practiceIds.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("zero generated items leaked into practiceExamBank", () => {
    const practiceExamIds = new Set(practiceExamBank.map((q) => q.id));
    const leaked = allEntries.filter((e) => practiceExamIds.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("zero generated items leaked into publishedExamBank", () => {
    const publishedIds = new Set(publishedExamBank.map((q) => q.id));
    const leaked = allEntries.filter((e) => publishedIds.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("zero generated items leaked into global questionBank", () => {
    const questionBankIds = new Set(questionBank.map((q) => q.id));
    const leaked = allEntries.filter((e) => questionBankIds.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("none of the 61 items are reachable through resolveQuestionsForCurriculumNode for any Level 5 node", () => {
    const generatedIdSet = new Set(allIds);
    for (const nodeId of Object.keys(LEVEL_5_ALIGNMENTS)) {
      const resolved = resolveQuestionsForCurriculumNode(nodeId);
      for (const q of resolved) {
        expect(
          generatedIdSet.has(q.id),
          `Leaked candidate ${q.id} into curriculum node ${nodeId}`,
        ).toBe(false);
      }
    }
  });
});
