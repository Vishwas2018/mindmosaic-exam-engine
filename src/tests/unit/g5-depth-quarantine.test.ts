import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import {
  practiceExamBank,
  publishedExamBank,
} from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { LEVEL_5_ALIGNMENTS } from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { questionSchema } from "@/schemas/question.schema";

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

describe("Grade 5 depth 2026-09-02 review queue promotion verification", () => {
  it("the manifest accounts for exactly 61 promoted items with status 'promoted' / 'published'", () => {
    expect(manifest.batchId).toBe("g5-depth-2026-09-02");
    expect(manifest.status).toBe("promoted");
    expect(manifest.nodesDeepened).toBe(30);
    expect(manifest.itemsGenerated).toBe(61);
    expect(manifest.passedValidation).toBe(61);
    expect(manifest.quarantined).toBe(0);
    expect(allEntries).toHaveLength(61);

    // Ensure non-vacuous unique IDs
    const idSet = new Set(allIds);
    expect(idSet.size).toBe(61);

    for (const entry of allEntries) {
      expect(entry.status).toBe("published");
      expect(entry.reviewStatus).toBe("approved");
    }
  });

  it("all 61 generated questions validate against questionSchema", () => {
    for (const entry of allEntries) {
      const parseResult = questionSchema.safeParse({
        ...entry.question,
        status: "published",
      });
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

  it("all 61 items are present in factoryPublishedQuestions and publishedExamBank", () => {
    const factoryIds = new Set(factoryPublishedQuestions.map((q) => q.id));
    const publishedIds = new Set(publishedExamBank.map((q) => q.id));

    for (const id of allIds) {
      expect(factoryIds.has(id), `Missing ${id} in factoryPublishedQuestions`).toBe(true);
      expect(publishedIds.has(id), `Missing ${id} in publishedExamBank`).toBe(true);
    }
  });

  it("all 30 target Level 5 nodes resolve to at least 8 served questions", () => {
    const nodeIds = [...new Set(allEntries.map((e) => e.curriculumNode))];
    expect(nodeIds).toHaveLength(30);

    for (const nodeId of nodeIds) {
      const resolved = resolveQuestionsForCurriculumNode(nodeId);
      expect(
        resolved.length,
        `Node ${nodeId} expected >= 8 served questions, got ${resolved.length}`,
      ).toBeGreaterThanOrEqual(8);
    }
  });

  it("the 3 excluded classroom-only nodes remain unmapped / zero served questions", () => {
    const excludedNodes = ["VC2E5LY01", "VC2E5LY02", "VC2E5LY12"];
    for (const nodeId of excludedNodes) {
      const resolved = resolveQuestionsForCurriculumNode(nodeId);
      expect(resolved).toHaveLength(0);
    }
  });
});
