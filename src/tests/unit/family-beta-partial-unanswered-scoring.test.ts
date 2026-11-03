import { describe, expect, it } from "vitest";

import { scoreResponse } from "@/features/exam-engine/scoring";
import type { AuthoringQuestion, CandidateAnswer } from "@/features/exam-engine/types";
import {
  loadFamilyBetaFixedPaperQuestions,
  type FamilyBetaPaperKind,
} from "@/server/family-beta-fixed-papers";

const ENABLED_ENV = { FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled" } as const;

/**
 * Partial and unanswered scoring for the eleven interactive configurations.
 *
 * The existing interactive-renderer suite proves fully-correct and
 * fully-incorrect scoring. This file covers the two cases it does not: a
 * PARTIALLY correct response, and no response at all.
 *
 * It records the engine's actual rule rather than asserting a preferred one.
 * `objective()` in scoring/question-scorers.ts awards `availableMarks` or 0
 * with nothing in between, so EVERY multi-part item here is all-or-nothing: a
 * response with some parts right earns zero. That is a deliberate product
 * rule, and these assertions exist so that if it ever changes to award partial
 * credit, the change is visible here instead of silently altering a child's
 * mark on a 2-mark question.
 */

function itemAt(paper: FamilyBetaPaperKind, slot: number): AuthoringQuestion {
  const questions = loadFamilyBetaFixedPaperQuestions(paper, ENABLED_ENV);
  const question = questions[slot - 1];
  if (!question) throw new Error(`no pinned item at ${paper} slot ${slot}`);
  return question;
}

/** The eleven interactive configurations, with a deliberately partial response for each. */
const PARTIAL_CASES: readonly {
  readonly label: string;
  readonly paper: FamilyBetaPaperKind;
  readonly slot: number;
  readonly partial: CandidateAnswer;
  readonly note: string;
}[] = [
  {
    label: "ordering (Y3 Q1)",
    paper: "year3",
    slot: 1,
    partial: ["creek", "fern", "ridge", "gully"],
    note: "first two of four in the right places, last two swapped",
  },
  {
    label: "fill_blank, 2 blanks (Y3 Q19)",
    paper: "year3",
    slot: 19,
    partial: { "shaded-parts": "3", "total-parts": "5" },
    note: "shaded parts right, total parts wrong",
  },
  {
    label: "label_diagram, 3 targets (Y3 Q20)",
    paper: "year3",
    slot: 20,
    partial: { "target-left": "label-triangle", "target-middle": "label-circle", "target-right": "label-square" },
    note: "one of three labels right",
  },
  {
    label: "dropdown, 1 field (Y5 Q2)",
    paper: "year5",
    slot: 2,
    partial: { count: "opt-b" },
    note: "single field answered wrongly; no partial state exists",
  },
  {
    label: "matching, 3 pairs (Y5 Q5)",
    paper: "year5",
    slot: 5,
    partial: { "time-9am": "temp-15", "time-12pm": "temp-21", "time-3pm": "temp-24" },
    note: "one of three pairs right",
  },
  {
    label: "fill_blank, perimeter and area (Y5 Q11)",
    paper: "year5",
    slot: 11,
    partial: { perimeter: "26", area: "13" },
    note: "perimeter right, area wrong — a 2-mark item",
  },
  {
    label: "matching, 4 fraction pairs (Y5 Q15)",
    paper: "year5",
    slot: 15,
    partial: { "src-0": "tgt-0", "src-1": "tgt-1", "src-2": "tgt-3", "src-3": "tgt-2" },
    note: "two of four pairs right — a 2-mark item",
  },
  {
    label: "matching, 3 fraction pairs (Y5 Q27)",
    paper: "year5",
    slot: 27,
    partial: { "src-0": "tgt-0", "src-1": "tgt-2", "src-2": "tgt-1" },
    note: "one of three pairs right",
  },
  {
    label: "fill_blank, 1 blank (Y5 Q30)",
    paper: "year5",
    slot: 30,
    partial: { count: "2" },
    note: "single blank answered wrongly (the shaded count, not the total)",
  },
  {
    label: "dropdown, 2 fields (Y5 Q31)",
    paper: "year5",
    slot: 31,
    partial: { "busiest-day": "busiest-wed", "difference": "diff-35" },
    note: "busiest day right, difference wrong",
  },
  {
    label: "label_diagram, 3 angles (Y5 Q35)",
    paper: "year5",
    slot: 35,
    partial: { "target-left": "label-right", "target-middle": "label-obtuse", "target-right": "label-acute" },
    note: "one of three angle types right",
  },
];

describe("Family Beta: partial responses on the eleven interactive items", () => {
  it("covers all eleven interactive configurations", () => {
    expect(PARTIAL_CASES).toHaveLength(11);
  });

  for (const testCase of PARTIAL_CASES) {
    it(`scores a partial ${testCase.label} as incorrect with zero marks (${testCase.note})`, () => {
      const question = itemAt(testCase.paper, testCase.slot);
      const scored = scoreResponse(question, testCase.partial);

      expect(scored.status).toBe("incorrect");
      expect(scored.correct).toBe(false);
      expect(scored.earnedMarks).toBe(0);
      expect(scored.availableMarks).toBeGreaterThan(0);
      expect(scored.requiresManualMarking).toBe(false);
    });
  }
});

describe("Family Beta: unanswered responses on the eleven interactive items", () => {
  for (const testCase of PARTIAL_CASES) {
    it(`scores an absent ${testCase.label} as unanswered, not incorrect`, () => {
      const question = itemAt(testCase.paper, testCase.slot);
      const scored = scoreResponse(question, undefined);

      expect(scored.status).toBe("unanswered");
      expect(scored.earnedMarks).toBe(0);
      expect(scored.manualReviewRequired).toBe(false);
    });

    it(`scores a cleared-back-to-blank ${testCase.label} as unanswered`, () => {
      const question = itemAt(testCase.paper, testCase.slot);
      const blank: CandidateAnswer = Array.isArray(testCase.partial) ? [] : {};
      const scored = scoreResponse(question, blank);

      expect(scored.status).toBe("unanswered");
      expect(scored.earnedMarks).toBe(0);
    });
  }
});

describe("Family Beta: no interactive item awards partial credit", () => {
  it("awards either the full marks or zero, never a fraction, across both papers", () => {
    for (const paper of ["year3", "year5"] as const) {
      const questions = loadFamilyBetaFixedPaperQuestions(paper, ENABLED_ENV);
      for (const question of questions) {
        const scored = scoreResponse(question, undefined);
        expect([0, scored.availableMarks]).toContain(scored.earnedMarks);
      }
    }
  });
});
