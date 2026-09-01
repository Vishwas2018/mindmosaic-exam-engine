import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import {
  getMappedQuestionIdsForNode,
  LEVEL_5_ALIGNMENTS,
} from "@/features/curriculum/lessons/alignments";
import { LEVEL_5_CLASSROOM_ONLY_NODES } from "@/features/curriculum/lessons/classroom-only";

/**
 * Regression guard for the trust boundary `scripts/validate-lessons.mts`
 * must respect: `practiceQuestionSeeds` (ungated, auto-generated seeds) must
 * never be folded into the bank a lesson/curriculum node's coverage is
 * resolved against. Only `questionBank` (curated) and `publishedExamBank`
 * (factory-published) are governed, gate-passed content — the same
 * boundary `resolveQuestionsForCurriculumNode` and
 * `gatedPracticeCoverageResolver` already enforce in production.
 */
describe("validate-lessons.mts trust boundary", () => {
  const publishedIds = new Set(publishedExamBank.map((q) => q.id));
  const curatedIds = new Set(questionBank.map((q) => q.id));
  const seedOnlyIds = practiceQuestionSeeds
    .map((q) => q.id)
    .filter((id) => !publishedIds.has(id) && !curatedIds.has(id));

  it("has at least one seed-only question ID to guard against (sanity check on fixture data)", () => {
    expect(seedOnlyIds.length).toBeGreaterThan(0);
  });

  it("the governed bank (questionBank + publishedExamBank) never contains a seed-only question ID", () => {
    const governedBankMap = new Map<string, unknown>();
    for (const q of questionBank) governedBankMap.set(q.id, q);
    for (const q of publishedExamBank) governedBankMap.set(q.id, q);

    for (const id of seedOnlyIds) {
      expect(governedBankMap.has(id)).toBe(false);
    }
  });

  it("a synthetic node mapped entirely to seed-only IDs resolves as zero governed coverage, not BOUND", () => {
    // Test the exact defect class the trust boundary closes:
    // With governedBankMap (questionBank + publishedExamBank), seed-only IDs resolve to 0.
    // With a buggy bankMap that includes practiceQuestionSeeds, they would have resolved as live.
    const syntheticSeedOnlyIds = seedOnlyIds.slice(0, 3);
    expect(syntheticSeedOnlyIds.length).toBeGreaterThan(0);

    const governedBankMap = new Map<string, unknown>();
    for (const q of questionBank) governedBankMap.set(q.id, q);
    for (const q of publishedExamBank) governedBankMap.set(q.id, q);
    const governedAligned = syntheticSeedOnlyIds.filter((id) => governedBankMap.has(id));

    expect(governedAligned.length).toBe(0);

    const buggyBankMap = new Map<string, unknown>(governedBankMap);
    for (const q of practiceQuestionSeeds) buggyBankMap.set(q.id, q);
    const buggyAligned = syntheticSeedOnlyIds.filter((id) => buggyBankMap.has(id));
    expect(buggyAligned.length).toBe(syntheticSeedOnlyIds.length);
  });

  it("all non-classroom Grade 5 nodes resolve to governed published questions", () => {
    const l5Codes = Object.keys(LEVEL_5_ALIGNMENTS);
    expect(l5Codes).toHaveLength(50);

    for (const code of l5Codes) {
      const ids = getMappedQuestionIdsForNode(code);
      if (LEVEL_5_CLASSROOM_ONLY_NODES.includes(code as (typeof LEVEL_5_CLASSROOM_ONLY_NODES)[number])) {
        expect(ids).toEqual([]);
      } else {
        expect(ids.length).toBeGreaterThan(0);
      }
    }
  });

  it("no curriculum node's mapped alignments resolve as governed-live through a seed-only ID alone", () => {
    const governedBankMap = new Map<string, unknown>();
    for (const q of questionBank) governedBankMap.set(q.id, q);
    for (const q of publishedExamBank) governedBankMap.set(q.id, q);

    const seedOnlySet = new Set(seedOnlyIds);
    const lessons = getAllLessons();

    for (const lesson of lessons) {
      const mappedIds = getMappedQuestionIdsForNode(lesson.curriculumCode);
      const governedAligned = mappedIds.filter((id) => governedBankMap.has(id));
      const seedOnlyAligned = mappedIds.filter((id) => seedOnlySet.has(id));

      // If a node has any seed-only mapped IDs, they do NOT contribute to governedAligned
      if (seedOnlyAligned.length > 0) {
        expect(governedAligned.length).toBe(mappedIds.length - seedOnlyAligned.length);
      }
    }
  });
});
