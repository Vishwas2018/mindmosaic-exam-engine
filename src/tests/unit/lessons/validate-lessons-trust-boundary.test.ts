import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { getAllLessons } from "@/features/curriculum/lessons/content";
import {
  getMappedQuestionIdsForNode,
  LEVEL_3_ALIGNMENTS,
  LEVEL_5_ALIGNMENTS,
} from "@/features/curriculum/lessons/alignments";

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

  it("a node mapped entirely to seed-only IDs resolves as zero governed coverage, not BOUND", () => {
    // Found dynamically rather than pinned to one node code: the
    // 2026-08-31 runtime-quarantine correction retired every Grade 5
    // seed-only mapping from alignments.ts entirely (so a node whose only
    // content was quarantined now maps to an EMPTY array, not a seed-only
    // one — VC2M5N04 was the previous example and now demonstrates exactly
    // that in the next test). This still needs a real example of a
    // *non-empty* mapped set that resolves entirely through
    // practiceQuestionSeeds, so it scans for one instead of assuming a
    // specific node stays in that state as content keeps moving.
    const seedOnlySet = new Set(seedOnlyIds);
    const allNodeCodes = new Set([
      ...Object.keys(LEVEL_3_ALIGNMENTS),
      ...Object.keys(LEVEL_5_ALIGNMENTS),
    ]);
    let seedOnlyNodeCode: string | undefined;
    for (const code of allNodeCodes) {
      const ids = getMappedQuestionIdsForNode(code);
      if (ids.length > 0 && ids.every((id) => seedOnlySet.has(id))) {
        seedOnlyNodeCode = code;
        break;
      }
    }
    expect(seedOnlyNodeCode, "no curriculum node has a non-empty, entirely seed-only mapped set to test against").toBeDefined();

    const mappedIds = getMappedQuestionIdsForNode(seedOnlyNodeCode as string);
    expect(mappedIds.length).toBeGreaterThan(0);

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

  it("VC2M5N04 (all-quarantined) now resolves to an empty mapped set, not a dangling/seed-only one", () => {
    // Its 6 g5-num-perc-* mappings were retired from alignments.ts entirely
    // by the 2026-08-31 runtime-quarantine correction — see
    // g5-runtime-quarantine-inventory.json. An empty array here is the
    // correct, honest outcome: no live OR pending-review question is
    // claimed for this node any more.
    expect(getMappedQuestionIdsForNode("VC2M5N04")).toEqual([]);
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
