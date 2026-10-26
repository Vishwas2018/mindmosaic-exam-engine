import {describe, expect, it} from "vitest";

import {barModelPilotFixtures} from "@/content/visual-fixtures/bar-model";
import {validateBarModelVisual} from "@/features/visuals/bar-model/pipeline";

describe("bar_model pilot fixtures", () => {
  it("includes 30 pilot items with the required year split", () => {
    expect(barModelPilotFixtures).toHaveLength(30);
    expect(
      barModelPilotFixtures.filter((fixture) => fixture.yearLevel === 3),
    ).toHaveLength(15);
    expect(
      barModelPilotFixtures.filter((fixture) => fixture.yearLevel === 5),
    ).toHaveLength(15);
    expect(
      new Set(barModelPilotFixtures.map((fixture) => fixture.skill)).size,
    ).toBeGreaterThan(3);
  });

  it("exposes the required metadata and validates every pilot item", () => {
    for (const fixture of barModelPilotFixtures) {
      expect(fixture.prompt).toBeTruthy();
      expect(fixture.skill).toBeTruthy();
      expect(fixture.difficulty).toBeTruthy();
      expect(fixture.unit).toBeTruthy();
      expect(fixture.privateAnswerKey).toBeGreaterThanOrEqual(0);
      expect(fixture.workedExplanation).toBeTruthy();
      expect(fixture.draftProvenance).toBeTruthy();

      const result = validateBarModelVisual(fixture.visual);
      expect(result.ok, `${fixture.name} should validate`).toBe(true);
      expect(result.solution?.target).toEqual({
        numerator: String(fixture.privateAnswerKey),
        denominator: "1",
      });
    }
  });
});
