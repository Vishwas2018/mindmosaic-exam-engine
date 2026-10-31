import {fireEvent, render, screen, within} from "@testing-library/react";
import {describe, expect, it} from "vitest";

import BarModelPreviewPage from "@/app/dev/bar-model/page";
import {barModelPilotFixtures} from "@/content/visual-fixtures/bar-model";
import {validateBarModelVisual} from "@/features/visuals/bar-model/pipeline";
import {independentlySolvePilot} from "../../../scripts/lib/bar-model-pilot-independent";

describe("bar_model pilot fixtures", () => {
  it("enforces the exact owner-confirmed year/skill/difficulty matrix", () => {
    expect(barModelPilotFixtures).toHaveLength(30);
    expect(
      barModelPilotFixtures.filter((fixture) => fixture.yearLevel === 3),
    ).toHaveLength(15);
    expect(
      barModelPilotFixtures.filter((fixture) => fixture.yearLevel === 5),
    ).toHaveLength(15);
    const counts: Record<string, {easy: number; medium: number; hard: number}> =
      {};
    for (const fixture of barModelPilotFixtures) {
      const key = `${fixture.yearLevel}/${fixture.skill}`;
      counts[key] ??= {easy: 0, medium: 0, hard: 0};
      counts[key][fixture.difficulty]++;
    }
    expect(counts).toEqual({
      "3/part-whole": {easy: 3, medium: 1, hard: 1},
      "3/comparison": {easy: 2, medium: 2, hard: 1},
      "3/times-as-many": {easy: 0, medium: 3, hard: 2},
      "5/equal-units": {easy: 2, medium: 2, hard: 1},
      "5/before-after": {easy: 1, medium: 2, hard: 2},
      "5/transfer": {easy: 1, medium: 1, hard: 3},
    });
    expect(
      new Set(barModelPilotFixtures.map((fixture) => fixture.name)).size,
    ).toBe(30);
  });

  it.each(barModelPilotFixtures)(
    "independently computes $name from story givens",
    (fixture) => {
      const independent = independentlySolvePilot(fixture.prompt);
      expect(fixture.privateAnswerKey, independent.calculation).toBe(
        independent.answer,
      );
      expect(validateBarModelVisual(fixture.visual).solution?.target).toEqual({
        numerator: String(independent.answer),
        denominator: "1",
      });
    },
  );

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

  it("renders preview diagnostics from the current pilot schema", () => {
    const fixture = barModelPilotFixtures[0];

    render(BarModelPreviewPage());
    fireEvent.click(
      screen.getByText("Developer fixture gallery (contains answer keys)"),
    );

    const fixtureSection = screen
      .getByRole("heading", {name: new RegExp(fixture.name, "i")})
      .closest("section");

    expect(screen.getByText(/Bar model pilot preview/i)).toBeInTheDocument();
    expect(screen.getByText(/30 pilot items/i)).toBeInTheDocument();
    expect(fixtureSection).not.toBeNull();
    expect(
      within(fixtureSection as HTMLElement).getByLabelText(
        new RegExp(`Developer diagnostics for ${fixture.name}`, "i"),
      ),
    ).toBeInTheDocument();
    const diagnostics = within(fixtureSection as HTMLElement).getByLabelText(
      new RegExp(`Developer diagnostics for ${fixture.name}`, "i"),
    );

    const expectedRow = within(diagnostics).getByText("Expected").closest("dt");
    expect(expectedRow).not.toBeNull();
    expect(expectedRow?.nextElementSibling).toHaveTextContent(
      String(fixture.privateAnswerKey),
    );
  });
});
