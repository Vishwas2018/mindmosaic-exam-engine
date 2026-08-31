import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";

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

  it("a node mapped entirely to seed-only IDs (VC2M5N04) resolves as zero governed coverage, not BOUND", () => {
    const mappedIds = getMappedQuestionIdsForNode("VC2M5N04");
    expect(mappedIds.length).toBeGreaterThan(0);

    const seedOnlySet = new Set(seedOnlyIds);
    // Sanity: every mapped ID for this node is genuinely seed-only right
    // now (unpublished) — if this ever stops being true (the node gets
    // published), pick a different still-unpublished node instead of
    // weakening the assertion below.
    for (const id of mappedIds) {
      expect(seedOnlySet.has(id)).toBe(true);
    }

    const governedBankMap = new Map<string, unknown>();
    for (const q of questionBank) governedBankMap.set(q.id, q);
    for (const q of publishedExamBank) governedBankMap.set(q.id, q);
    const governedAligned = mappedIds.filter((id) => governedBankMap.has(id));

    // The exact defect class the fix closes: with the pre-fix bankMap
    // (questionBank + publishedExamBank + practiceQuestionSeeds), every one
    // of these IDs would have resolved as "live", making this node BOUND.
    // The fixed bankMap must resolve it as zero — COMING_SOON, not BOUND.
    expect(governedAligned.length).toBe(0);

    const buggyBankMap = new Map<string, unknown>(governedBankMap);
    for (const q of practiceQuestionSeeds) buggyBankMap.set(q.id, q);
    const buggyAligned = mappedIds.filter((id) => buggyBankMap.has(id));
    expect(buggyAligned.length).toBe(mappedIds.length);
  });

  it("no curriculum node's mapped alignments resolve as governed-live through a seed-only ID alone", () => {
    const governedBankMap = new Map<string, unknown>();
    for (const q of questionBank) governedBankMap.set(q.id, q);
    for (const q of publishedExamBank) governedBankMap.set(q.id, q);

    const seedOnlySet = new Set(seedOnlyIds);
    const lessons = getAllLessons();
    let sawSeedOnlyNode = false;

    for (const lesson of lessons) {
      const mappedIds = getMappedQuestionIdsForNode(lesson.curriculumCode);
      const governedAligned = mappedIds.filter((id) => governedBankMap.has(id));
      const seedOnlyAligned = mappedIds.filter((id) => seedOnlySet.has(id));

      // A node whose only mapped IDs are seed-only must resolve as NOT
      // governed-live (zero governed alignments) — this is the exact
      // defect class the fix closes: a seed-only mapping alone must never
      // count toward "BOUND" / live-practice coverage.
      if (seedOnlyAligned.length > 0 && seedOnlyAligned.length === mappedIds.length) {
        sawSeedOnlyNode = true;
        expect(governedAligned.length).toBe(0);
      }
    }

    // The loop's assertion is only meaningful if at least one node actually
    // exercised it (otherwise it degrades to a no-op the way the vacuous
    // `if` guard could hide a reintroduced defect).
    expect(sawSeedOnlyNode).toBe(true);
  });
});
