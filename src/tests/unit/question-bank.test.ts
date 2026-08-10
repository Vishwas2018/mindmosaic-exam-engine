import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { summariseQuestionBank } from "@/content/questions/question-bank-summary";
import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { scoreResponse } from "@/features/exam-engine/scoring";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";
import { questionSchema, type Question } from "@/schemas/question.schema";
import { canonicalResponse } from "@/tests/fixtures/canonical-response";

const summary = summariseQuestionBank(questionBank);

/* Remeasured after the 2026-08-10 promotion of the Grade 5 ICAS digital
   technologies and spelling batches; mirrors the pin in
   scripts/validate-question-bank.mts. */
const EXPECTED_TYPE_COUNTS: Record<string, number> = {
  multiple_choice: 453,
  multiple_select: 46,
  number_entry: 81,
  fill_blank: 39,
  dropdown: 41,
  true_false: 55,
  matching: 42,
  ordering: 45,
  short_answer: 24,
  reading_comprehension: 117,
  essay: 4,
  label_diagram: 6,
  hotspot: 5,
  drag_drop: 7,
};

const VISUAL_MINIMUMS: Record<string, number> = {
  bar_chart: 5,
  line_graph: 4,
  pie_chart: 4,
  table: 6,
  number_line: 5,
  geometry_shape: 5,
  coordinate_grid: 4,
  fraction_model: 4,
  labelled_svg: 5,
  hotspot_svg: 5,
};

describe("production bank distribution", () => {
  it("holds the whole curated bank, every question published and original", () => {
    /* 100 at Phase 3; 885 after the overnight Grade 3 ingest added 568
       reviewed questions; 965 once the Grade 5 ICAS digital technologies
       (35) and spelling (45) batches were promoted. Exact, so content
       cannot change size unnoticed. */
    expect(questionBank).toHaveLength(965);
    for (const question of questionBank) {
      expect(question.status).toBe("published");
      expect(question.origin).toBe("original_seed");
    }
  });

  it("matches the exact per-type distribution", () => {
    expect(summary.byQuestionType).toEqual(EXPECTED_TYPE_COUNTS);
  });

  it("meets every visual minimum with at least 45 visual questions", () => {
    expect(summary.questionsWithVisuals).toBeGreaterThanOrEqual(45);
    for (const [type, minimum] of Object.entries(VISUAL_MINIMUMS)) {
      expect(summary.byVisualType[type]).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("stays inside grade and exam-style ranges", () => {
    /* The Grade 3 ingest inverted both balances — Year 3 now outweighs
       Year 5, and ICAS outweighs NAPLAN — which is the intended direction
       of travel for the ICAS expansion. The 2026-08-10 Grade 5 promotion
       moved Year 5 53 -> 133 and ICAS 607 -> 687, narrowing the Year 3/5
       gap slightly. Bounds stay exact so a programme's worth of content
       cannot disappear unnoticed. */
    expect(summary.byYearLevel["year-3"]).toBeGreaterThanOrEqual(832);
    expect(summary.byYearLevel["year-3"]).toBeLessThanOrEqual(832);
    expect(summary.byYearLevel["year-5"]).toBeGreaterThanOrEqual(133);
    expect(summary.byYearLevel["year-5"]).toBeLessThanOrEqual(133);
    expect(summary.byExamStyle.naplan_style).toBeGreaterThanOrEqual(278);
    expect(summary.byExamStyle.naplan_style).toBeLessThanOrEqual(278);
    expect(summary.byExamStyle.icas_style).toBeGreaterThanOrEqual(687);
    expect(summary.byExamStyle.icas_style).toBeLessThanOrEqual(687);
  });

  it("has globally unique question IDs", () => {
    const ids = questionBank.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates every question against the schema", () => {
    for (const question of questionBank) {
      const parsed = questionSchema.safeParse(question);
      expect(parsed.success, `${question.id} failed schema validation`).toBe(true);
    }
  });

  it("resolves a real renderer for every question and visual", () => {
    for (const question of questionBank) {
      expect(
        questionRendererRegistry.supports(question.type),
        `${question.id} type unsupported`,
      ).toBe(true);
      for (const visual of question.visuals) {
        expect(
          visualRendererRegistry.supports(visual.type),
          `${question.id} visual '${visual.id}' unsupported`,
        ).toBe(true);
      }
    }
  });
});

describe("canonical self-scoring across the whole bank", () => {
  const objectiveQuestions = questionBank.filter(
    (question) => question.answerKey.kind !== "manual",
  );
  const manualQuestions = questionBank.filter(
    (question) => question.answerKey.kind === "manual",
  );

  it.each(objectiveQuestions.map((question) => [question.id, question] as const))(
    "scores the canonical answer for %s as fully correct",
    (_id, question: Question) => {
      const scored = scoreResponse(question, canonicalResponse(question));
      expect(scored.status).toBe("correct");
      expect(scored.correct).toBe(true);
      expect(scored.earnedMarks).toBe(question.metadata.marks);
      expect(scored.availableMarks).toBe(question.metadata.marks);
    },
  );

  it.each(manualQuestions.map((question) => [question.id, question] as const))(
    "routes %s to manual review with no automatic marks",
    (_id, question: Question) => {
      const scored = scoreResponse(question, "A sample written response.");
      expect(scored.status).toBe("manual_review");
      expect(scored.correct).toBeNull();
      expect(scored.earnedMarks).toBeNull();
      expect(scored.manualReviewRequired).toBe(true);
    },
  );

  it("treats empty and missing responses as unanswered for objective questions", () => {
    for (const question of objectiveQuestions) {
      for (const empty of [undefined, null, "", [], {}]) {
        const scored = scoreResponse(
          question,
          empty as Parameters<typeof scoreResponse>[1],
        );
        expect(scored.status, `${question.id} with ${JSON.stringify(empty)}`).toBe(
          "unanswered",
        );
        expect(scored.earnedMarks).toBe(0);
      }
    }
  });

  it("marks malformed responses incorrect rather than crashing", () => {
    for (const question of objectiveQuestions) {
      const scored = scoreResponse(question, "definitely-not-the-answer-shape");
      expect(["incorrect", "correct"]).toContain(scored.status);
      /* A random string must never be accepted for non-text keys. */
      if (!["text", "fill_blank"].includes(question.answerKey.kind)) {
        expect(scored.status, question.id).toBe("incorrect");
      }
    }
  });
});
