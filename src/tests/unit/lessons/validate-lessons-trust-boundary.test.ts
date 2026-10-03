import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import {
  getMappedQuestionIdsForNode,
  LEVEL_3_ALIGNMENTS,
  LEVEL_5_ALIGNMENTS,
} from "@/features/curriculum/lessons/alignments";
import { LEVEL_5_CLASSROOM_ONLY_NODES } from "@/features/curriculum/lessons/classroom-only";

/**
 * Regression guard for the trust boundary `scripts/validate-lessons.mts`
 * must respect: ungated auto-generated seeds have been completely deleted
 * and must never be folded into the bank a lesson/curriculum node's coverage is
 * resolved against. Only `questionBank` (curated) and `publishedExamBank`
 * (factory-published) are governed, gate-passed content.
 */
describe("validate-lessons.mts trust boundary", () => {
  const governedBankMap = new Map<string, unknown>();
  for (const q of questionBank) governedBankMap.set(q.id, q);
  for (const q of publishedExamBank) governedBankMap.set(q.id, q);

  it("the ungated seed bank file no longer exists on disk", () => {
    const seedFile = resolve(process.cwd(), "src/content/questions/generated/generated-questions.ts");
    expect(existsSync(seedFile)).toBe(false);
  });

  it("the governed bank contains zero questions with the retired 'gen-' seed prefix", () => {
    for (const id of governedBankMap.keys()) {
      expect(id.startsWith("gen-"), `Governed bank contains retired seed ${id}`).toBe(false);
    }
  });

  it("a synthetic ungated seed ID mapped to a node resolves as zero governed coverage, not BOUND", () => {
    const syntheticSeedIds = ["gen-num-synthetic-001", "gen-lang-synthetic-002"];
    const governedAligned = syntheticSeedIds.filter((id) => governedBankMap.has(id));
    expect(governedAligned.length).toBe(0);
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

  it("every mapped question ID in all lessons resolves strictly to the governed bank", () => {
    const lessons = getAllLessons();
    expect(lessons.length).toBe(104);

    for (const lesson of lessons) {
      const mappedIds = getMappedQuestionIdsForNode(lesson.curriculumCode);
      for (const id of mappedIds) {
        expect(
          governedBankMap.has(id),
          `Node ${lesson.curriculumCode} references question ${id} not found in governed bank`,
        ).toBe(true);
        expect(id.startsWith("gen-"), `Node ${lesson.curriculumCode} still references seed ${id}`).toBe(false);
      }
    }
  });

  it("every alignment in LEVEL_3_ALIGNMENTS and LEVEL_5_ALIGNMENTS contains zero seed IDs", () => {
    for (const [code, ids] of Object.entries(LEVEL_3_ALIGNMENTS)) {
      for (const id of ids) {
        expect(id.startsWith("gen-"), `Level 3 ${code} references seed ${id}`).toBe(false);
        expect(governedBankMap.has(id), `Level 3 ${code} references ungoverned ${id}`).toBe(true);
      }
    }
    for (const [code, ids] of Object.entries(LEVEL_5_ALIGNMENTS)) {
      for (const id of ids) {
        expect(id.startsWith("gen-"), `Level 5 ${code} references seed ${id}`).toBe(false);
        expect(governedBankMap.has(id), `Level 5 ${code} references ungoverned ${id}`).toBe(true);
      }
    }
  });
});
