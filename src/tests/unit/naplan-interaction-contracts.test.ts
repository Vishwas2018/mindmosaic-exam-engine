import { describe, expect, it } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { questionRendererRegistry } from "@/features/exam-engine/question-renderers";
import { scoreQuestion } from "@/features/exam-engine/scoring";
import { ALLOWED_QUESTION_TYPES } from "@/features/question-factory/config";
import {
  candidateQuestionSchema,
  candidateQuestionTypeSchema,
} from "@/features/question-factory/ingestion/candidate-question";
import { HARVEST_SUPPORTED_QUESTION_TYPES } from "@/features/question-factory/ingestion/mappings";
import {
  INTERACTION_REQUIRED_QUESTION_TYPES,
  STIMULUS_REQUIRED_QUESTION_TYPES,
} from "@/features/question-factory/generation/prompt-builder";
import { checkAgainstProductionSchema } from "@/features/question-factory/validation/production-schema-check";
import { canonicalResponse } from "@/tests/fixtures/canonical-response";
import { QUESTION_TYPES, questionSchema } from "@/schemas/question.schema";

function nativeCandidate(question: (typeof showcaseQuestions)[number]) {
  const { status: _status, origin: _origin, instructions: _instructions, ...candidate } = question;
  void _status; void _origin; void _instructions;
  return candidate;
}

describe("NAPLAN interaction contract alignment", () => {
  it("uses the runtime vocabulary for governed candidates and advertised formats", () => {
    expect([...ALLOWED_QUESTION_TYPES].sort()).toEqual([...questionRendererRegistry.supportedTypes].sort());
    for (const type of QUESTION_TYPES) expect(candidateQuestionTypeSchema.safeParse(type).success).toBe(true);
  });

  it("requires inline gaps to occur in an ordered segment sequence", () => {
    const authored = structuredClone(showcaseQuestions.find((question) => question.type === "drag_drop")!);
    authored.interaction = authored.interaction?.type === "drag_drop"
      ? { ...authored.interaction, presentation: "inline_gap" }
      : authored.interaction;
    expect(questionSchema.safeParse(authored).success).toBe(false);

    if (authored.interaction?.type === "drag_drop") {
      authored.interaction.segments = [
        { kind: "text", text: "Odd numbers:" },
        { kind: "gap", zoneId: "odd" },
        { kind: "text", text: "Even numbers:" },
        { kind: "gap", zoneId: "even" },
      ];
    }
    expect(questionSchema.safeParse(authored).success).toBe(true);
  });

  it("binds graphic and direct-placement targets to real hotspot regions", () => {
    const hotspot = showcaseQuestions.find((question) => question.type === "hotspot")!;
    const hotspotVisual = hotspot.visuals.find((visual) => visual.type === "hotspot_svg")!;

    const drag = structuredClone(showcaseQuestions.find((question) => question.type === "drag_drop")!);
    drag.visuals = [hotspotVisual];
    if (drag.interaction?.type === "drag_drop") {
      drag.interaction.presentation = "graphic_gap";
      drag.interaction.zones = drag.interaction.zones.map((zone, index) => ({
        ...zone,
        visualId: hotspotVisual.id,
        regionId: hotspotVisual.data.regions[index]!.id,
      }));
    }
    expect(questionSchema.safeParse(drag).success).toBe(true);
    if (drag.interaction?.type === "drag_drop") delete drag.interaction.zones[0]!.regionId;
    expect(questionSchema.safeParse(drag).success).toBe(false);

    const diagram = structuredClone(showcaseQuestions.find((question) => question.type === "label_diagram")!);
    diagram.visuals = [hotspotVisual];
    if (diagram.interaction?.type === "label_diagram") {
      diagram.interaction.presentation = "direct_placement";
      diagram.interaction.targets = diagram.interaction.targets.map((target, index) => ({
        ...target,
        visualId: hotspotVisual.id,
        regionId: hotspotVisual.data.regions[index]!.id,
      }));
    }
    expect(questionSchema.safeParse(diagram).success).toBe(true);
  });

  it("enforces hot-text and matrix selection semantics", () => {
    const hotText = structuredClone(showcaseQuestions.find((question) => question.type === "hot_text")!);
    if (hotText.interaction?.type === "hot_text") hotText.interaction.maxSelections = 2;
    expect(questionSchema.safeParse(hotText).success).toBe(false);

    const matrix = structuredClone(showcaseQuestions.find((question) => question.type === "matrix_choice")!);
    if (matrix.interaction?.type === "matrix_choice" && matrix.answerKey.kind === "matrix") {
      matrix.interaction.selectionMode = "multiple_per_row";
      const firstRow = matrix.interaction.rows[0]!.id;
      matrix.answerKey.cellIds = matrix.interaction.cells
        .filter((cell) => cell.rowId === firstRow && cell.selectable)
        .map((cell) => cell.id);
    }
    expect(questionSchema.safeParse(matrix).success).toBe(false);
  });

  it("accepts and production-validates a native candidate for every runtime type", () => {
    for (const type of QUESTION_TYPES) {
      const authored = showcaseQuestions.find((question) => question.type === type);
      expect(authored, type).toBeDefined();
      const parsed = candidateQuestionSchema.safeParse(nativeCandidate(authored!));
      expect(parsed.success, type).toBe(true);
      if (parsed.success) expect(checkAgainstProductionSchema(parsed.data).ok, type).toBe(true);
    }
  });

  it("rejects every interaction-requiring type without its interaction", () => {
    for (const type of INTERACTION_REQUIRED_QUESTION_TYPES) {
      const authored = showcaseQuestions.find((question) => question.type === type)!;
      const parsed = candidateQuestionSchema.parse(nativeCandidate(authored));
      expect(checkAgainstProductionSchema({ ...parsed, interaction: undefined }).ok, type).toBe(false);
    }
  });

  it("rejects every stimulus-requiring type without its stimulus", () => {
    for (const type of STIMULUS_REQUIRED_QUESTION_TYPES) {
      const authored = showcaseQuestions.find((question) => question.type === type)!;
      const parsed = candidateQuestionSchema.parse(nativeCandidate(authored));
      expect(checkAgainstProductionSchema({ ...parsed, stimulus: undefined }).ok, type).toBe(false);
    }
  });

  it("keeps the legacy donor vocabulary restricted and unchanged", () => {
    expect(HARVEST_SUPPORTED_QUESTION_TYPES).toEqual([
      "multiple_choice", "multiple_select", "number_entry", "fill_blank", "dropdown",
      "true_false", "matching", "ordering", "short_answer", "reading_comprehension",
    ]);
    for (const type of ["essay", "label_diagram", "hotspot", "drag_drop", "hot_text", "matrix_choice"]) {
      expect((HARVEST_SUPPORTED_QUESTION_TYPES as readonly string[]).includes(type)).toBe(false);
    }
  });

  it("keeps every registered objective scorer compatible with its canonical response", () => {
    for (const question of showcaseQuestions) {
      if (
        question.answerKey.kind === "manual" ||
        (question.answerKey.kind === "structured" &&
          question.answerKey.parts.some((part) => part.marking === "manual"))
      ) continue;
      expect(scoreQuestion(question, canonicalResponse(question)).status, question.type).toBe("correct");
    }
  });
});
