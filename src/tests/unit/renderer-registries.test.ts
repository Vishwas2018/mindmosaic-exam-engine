import { describe, expect, it } from "vitest";

import {
  questionRendererRegistry,
  UnsupportedQuestionRenderer,
} from "@/features/exam-engine/question-renderers";
import {
  UnsupportedVisualRenderer,
  visualRendererRegistry,
} from "@/features/exam-engine/visual-renderers";
import { QUESTION_TYPES } from "@/schemas/question.schema";
import { VISUAL_TYPES } from "@/schemas/visual.schema";

describe("questionRendererRegistry", () => {
  it("resolves a dedicated renderer for all 14 established question types", () => {
    expect(questionRendererRegistry.supportedTypes).toHaveLength(14);
    for (const type of questionRendererRegistry.supportedTypes) {
      expect(questionRendererRegistry.supports(type), type).toBe(true);
      expect(questionRendererRegistry.resolve(type), type).not.toBe(
        UnsupportedQuestionRenderer,
      );
    }
  });

  it("falls back to the accessible unsupported renderer for new types without dedicated widgets", () => {
    for (const type of ["hot_text", "matrix_choice", "structured_response"] as const) {
      expect(questionRendererRegistry.supports(type)).toBe(false);
      expect(questionRendererRegistry.resolve(type)).toBe(
        UnsupportedQuestionRenderer,
      );
    }
  });

  it("falls back to the accessible unsupported renderer for unknown types", () => {
    expect(questionRendererRegistry.resolve("mystery_type")).toBe(
      UnsupportedQuestionRenderer,
    );
  });
});

describe("visualRendererRegistry", () => {
  it("resolves a dedicated renderer for all 10 visual types", () => {
    expect(visualRendererRegistry.supportedTypes).toHaveLength(10);
    for (const type of VISUAL_TYPES) {
      expect(visualRendererRegistry.supports(type), type).toBe(true);
      expect(visualRendererRegistry.resolve(type), type).not.toBe(
        UnsupportedVisualRenderer,
      );
    }
  });

  it("falls back to the accessible unsupported renderer", () => {
    expect(visualRendererRegistry.resolve("hologram")).toBe(UnsupportedVisualRenderer);
  });
});
