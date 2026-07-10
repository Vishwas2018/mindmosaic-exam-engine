import { describe, expect, it } from "vitest";

import {
  MultipleChoiceRenderer,
  questionRendererRegistry,
  UnsupportedQuestionRenderer,
} from "@/features/exam-engine/question-renderers";
import {
  BarChartRenderer,
  visualRendererRegistry,
} from "@/features/exam-engine/visual-renderers";

describe("questionRendererRegistry", () => {
  it("selects the multiple-choice renderer", () => {
    expect(questionRendererRegistry.resolve("multiple_choice")).toBe(
      MultipleChoiceRenderer,
    );
  });

  it("returns the accessible fallback for an unsupported renderer", () => {
    expect(questionRendererRegistry.resolve("essay")).toBe(
      UnsupportedQuestionRenderer,
    );
    expect(questionRendererRegistry.resolve("not_registered")).toBe(
      UnsupportedQuestionRenderer,
    );
  });
});

describe("visualRendererRegistry", () => {
  it("selects the bar-chart renderer", () => {
    expect(visualRendererRegistry.resolve("bar_chart")).toBe(BarChartRenderer);
  });
});
