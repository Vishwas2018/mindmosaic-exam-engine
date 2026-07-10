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
  it("resolves a dedicated renderer for all 14 question types", () => {
    expect(questionRendererRegistry.supportedTypes).toHaveLength(14);
    for (const type of QUESTION_TYPES) {
      expect(questionRendererRegistry.supports(type), type).toBe(true);
      expect(questionRendererRegistry.resolve(type), type).not.toBe(
        UnsupportedQuestionRenderer,
      );
    }
  });

  it("falls back to the accessible unsupported renderer", () => {
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
