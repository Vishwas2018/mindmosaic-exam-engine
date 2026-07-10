import { describe, expect, it } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { questionSchema, QUESTION_TYPES } from "@/schemas/question.schema";
import { visualSchema } from "@/schemas/visual.schema";
import { invalidQuestionFixtures } from "@/tests/fixtures/invalid-questions";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("questionSchema valid content", () => {
  it("accepts a valid multiple-choice question", () => {
    expect(questionSchema.safeParse(validMultipleChoiceQuestion).success).toBe(true);
  });

  it("accepts one valid fixture for every supported question type", () => {
    for (const type of QUESTION_TYPES) {
      const fixture = showcaseQuestions.find((question) => question.type === type);
      expect(fixture, `missing fixture for ${type}`).toBeDefined();
      expect(questionSchema.safeParse(fixture).success, type).toBe(true);
    }
  });
});

describe("questionSchema rejections", () => {
  it("rejects a missing prompt", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.missingPromptQuestion).success,
    ).toBe(false);
  });

  it("rejects an incompatible answer-key discriminator", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.incompatibleAnswerKeyQuestion)
        .success,
    ).toBe(false);
  });

  it("rejects an answer key that references an unknown option", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.unknownOptionReferenceQuestion)
        .success,
    ).toBe(false);
  });

  it("rejects an unsupported question type", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.unsupportedTypeQuestion).success,
    ).toBe(false);
  });

  it("rejects a fill_blank question with no interaction", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.fillBlankMissingInteractionQuestion)
        .success,
    ).toBe(false);
  });

  it("rejects a multiple_select with a single correct option", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.multipleSelectSingleCorrectQuestion)
        .success,
    ).toBe(false);
  });

  it("rejects a hotspot question with no hotspot_svg visual", () => {
    expect(
      questionSchema.safeParse(invalidQuestionFixtures.hotspotMissingVisualQuestion)
        .success,
    ).toBe(false);
  });
});

describe("visualSchema", () => {
  it("rejects a visual with no alt text", () => {
    expect(
      visualSchema.safeParse({
        id: "no-alt",
        type: "table",
        data: { headers: ["A"], rows: [["x"]] },
      }).success,
    ).toBe(false);
  });

  it("rejects an unsupported visual type", () => {
    expect(
      visualSchema.safeParse({
        id: "scatter",
        type: "scatter_plot",
        altText: "A scatter plot of results.",
        data: {},
      }).success,
    ).toBe(false);
  });
});
