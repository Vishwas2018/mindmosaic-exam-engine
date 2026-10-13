import { describe, expect, it } from "vitest";

import {
  invalidBarModelFixtures,
  validBarModelFixtures,
  warningBarModelFixtures,
} from "@/content/visual-fixtures/bar-model";
import { RENDER_ONLY_VISUAL_TYPES } from "@/features/question-factory/config/render-only-visual-types";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { ALLOWED_VISUAL_TYPES } from "@/features/question-factory/config";
import { validateBarModelVisual } from "@/features/visuals/bar-model/pipeline";
import { barModelVisualSchema, visualSchema, VISUAL_TYPES } from "@/schemas/visual.schema";

const accepted = [...validBarModelFixtures, ...warningBarModelFixtures];
const schemaFixtures = invalidBarModelFixtures.filter((fixture) => fixture.layer === "schema");
const laterFixtures = invalidBarModelFixtures.filter((fixture) => fixture.layer !== "schema");

describe("bar_model schema layer (shape only)", () => {
  it.each(accepted.map((fixture) => [fixture.name, fixture] as const))("accepts %s", (_name, fixture) => {
    expect(barModelVisualSchema.safeParse(fixture.visual).success).toBe(true);
    expect(visualSchema.safeParse(fixture.visual).success).toBe(true);
  });

  it.each(schemaFixtures.map((fixture) => [fixture.name, fixture] as const))("rejects %s", (_name, fixture) => {
    const result = validateBarModelVisual(fixture.visual);
    expect(result.layer).toBe("schema");
    for (const code of fixture.errorCodes) expect(result.errorCodes).toContain(code);
  });

  it("does not claim to catch mathematical or referential mistakes", () => {
    // Zod alone lets these through; the later layers own them.
    for (const fixture of laterFixtures) {
      expect(barModelVisualSchema.safeParse(fixture.visual).success, fixture.name).toBe(true);
    }
  });

  it("registers bar_model as a visual type", () => {
    expect(VISUAL_TYPES).toContain("bar_model");
  });

  it("gives an unknown or blank element no numeric field to leak", () => {
    for (const fixture of accepted) {
      const parsed = barModelVisualSchema.parse(fixture.visual);
      const hidden = [
        ...parsed.data.bars.flatMap((bar) => bar.segments),
        ...parsed.data.braces,
        ...parsed.data.quantities,
      ].filter((element) => element.display !== "value");
      for (const element of hidden) {
        expect("value" in element && element.value !== undefined, `${fixture.name}/${element.id}`).toBe(false);
      }
    }
  });
});

describe("bar_model validator layers", () => {
  it.each(validBarModelFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s passes with the expected whole-number target and no warnings",
    (_name, fixture) => {
      const result = validateBarModelVisual(fixture.visual);
      expect(result.errorCodes).toEqual([]);
      expect(result.layer).toBe("ok");
      expect(result.solution?.target).toEqual(fixture.target);
      expect(result.solution?.isWhole).toBe(true);
      expect(result.warningCodes).toEqual([]);
    },
  );

  it.each(warningBarModelFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s passes with its expected warning",
    (_name, fixture) => {
      const result = validateBarModelVisual(fixture.visual);
      expect(result.ok).toBe(true);
      expect(result.solution?.target).toEqual(fixture.target);
      expect([...result.warningCodes].sort()).toEqual([...fixture.warningCodes].sort());
    },
  );

  it.each(laterFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s fails at its intended layer with its expected code",
    (_name, fixture) => {
      const result = validateBarModelVisual(fixture.visual);
      expect(result.ok).toBe(false);
      expect(result.layer).toBe(fixture.layer);
      for (const code of fixture.errorCodes) expect(result.errorCodes).toContain(code);
    },
  );

  it("covers every rule the brief lists", () => {
    const covered = new Set(invalidBarModelFixtures.flatMap((fixture) => fixture.errorCodes));
    for (const code of [
      "blank_with_value",
      "invalid_type",
      "too_big",
      "duplicate_id",
      "dangling_unit_id",
      "dangling_quantity_id",
      "non_contiguous_brace",
      "target_count",
      "change_stored_twice",
      "contradictory_givens",
      "target_not_unique",
      "transfer_breaks_conservation",
      "infeasible_negative",
      "answer_leak",
    ]) {
      expect(covered.has(code), code).toBe(true);
    }
  });

  it("never runs a later layer on input an earlier layer rejected", () => {
    for (const fixture of invalidBarModelFixtures.filter((entry) => entry.layer === "structural")) {
      const result = validateBarModelVisual(fixture.visual);
      expect(result.errorCodes.every((code) => !["contradictory_givens", "target_not_unique", "answer_leak"].includes(code))).toBe(true);
      expect(result.solution?.target).toBeNull();
    }
  });
});

describe("bar_model is render-only in Phase 1 (not in the question factory)", () => {
  it("is excluded from the factory's allowed visual types", () => {
    expect(RENDER_ONLY_VISUAL_TYPES).toContain("bar_model");
    expect(ALLOWED_VISUAL_TYPES).not.toContain("bar_model");
  });

  it("is rejected by the candidate-question schema", () => {
    const visual = validBarModelFixtures[0].visual;
    const candidate = {
      id: "cand-bar-model-1",
      type: "multiple_choice",
      yearLevel: 3,
      examStyle: "naplan",
      prompt: "What is the missing part?",
      visuals: [visual],
    };
    const result = candidateQuestionSchema.safeParse(candidate);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("render-only");
  });
});
