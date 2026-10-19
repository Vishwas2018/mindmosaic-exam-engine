import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  invalidBarModelFixtures,
  validBarModelFixtures,
  warningBarModelFixtures,
} from "@/content/visual-fixtures/bar-model";
import { BarModelRenderer, VisualRenderer, visualRendererRegistry } from "@/features/exam-engine/visual-renderers";
import { describeBarModel } from "@/features/visuals/bar-model/describe";
import { layoutBarModel } from "@/features/visuals/bar-model/layout";
import { validateBarModelVisual } from "@/features/visuals/bar-model/pipeline";
import { barModelVisualSchema } from "@/schemas/visual.schema";

const all = [...validBarModelFixtures, ...warningBarModelFixtures];
const parse = (fixture: { visual: unknown }) => barModelVisualSchema.parse(fixture.visual);

/** Number tokens (whole or decimal) in a string. */
const tokens = (text: string) => text.match(/\d+(?:\.\d+)?/g) ?? [];

describe("BarModelRenderer", () => {
  it("is registered, and the shared registry resolves it", () => {
    expect(visualRendererRegistry.supports("bar_model")).toBe(true);
    expect(visualRendererRegistry.resolve("bar_model")).toBe(BarModelRenderer);
  });

  it.each(all.map((fixture) => [fixture.name, fixture] as const))(
    "%s renders deterministically: the same input gives the same SVG",
    (_name, fixture) => {
      const visual = parse(fixture);
      const first = renderToStaticMarkup(<BarModelRenderer visual={visual} />);
      const second = renderToStaticMarkup(<BarModelRenderer visual={parse(fixture)} />);
      expect(second).toBe(first);
      expect(layoutBarModel(visual.data)).toEqual(layoutBarModel(parse(fixture).data));
    },
  );

  it.each(all.map((fixture) => [fixture.name, fixture] as const))(
    "%s exposes an accessible name and a generated description",
    (_name, fixture) => {
      const visual = parse(fixture);
      render(<VisualRenderer visual={visual} />);
      const image = screen.getByRole("img");
      expect(image).toHaveAccessibleName(new RegExp(`^${visual.title ?? "Bar model"}`));
      expect(image).toHaveAccessibleName(new RegExp(visual.altText.slice(0, 20)));
      expect(image).toHaveAttribute("aria-labelledby");
      const description = document.getElementById(image.getAttribute("aria-labelledby")!.split(" ")[1]);
      expect(description?.textContent).toContain(visual.altText);
      expect(description?.textContent).toContain("Schematic bar model, not drawn to scale.");
      expect(screen.getByText("Diagram not to scale")).toBeInTheDocument();
    },
  );

  it.each(validBarModelFixtures.map((fixture) => [fixture.name, fixture] as const))(
    "%s never shows the solved answer in its SVG, name or description",
    (_name, fixture) => {
      const visual = parse(fixture);
      const answer = fixture.target.numerator;
      const { container } = render(<BarModelRenderer visual={visual} />);
      // Everything the renderer emits: markup text, title, description, labels.
      const emitted = container.textContent ?? "";
      expect(tokens(emitted), "rendered text").not.toContain(answer);
      expect(tokens(describeBarModel(visual.data).join(" ")), "generated description").not.toContain(answer);
      expect(tokens(visual.altText), "alt text").not.toContain(answer);
      // The target is drawn as a question mark instead.
      expect(emitted).toContain("?");
    },
  );

  it("coincidence fixture: the target element shows a question mark, not its number", () => {
    const fixture = warningBarModelFixtures.find((entry) => entry.name === "answer-equals-given")!;
    const visual = parse(fixture);
    const { container } = render(<BarModelRenderer visual={visual} />);
    const layout = layoutBarModel(visual.data);
    const targetSegment = layout.bars.flatMap((bar) => bar.segments).find((segment) => segment.isTarget)!;
    expect(targetSegment.amount).toBe("?");
    // The only 18 on screen is the given segment (the answer is also 18).
    const eighteens = Array.from(container.querySelectorAll("text")).filter((node) => node.textContent === "18");
    expect(eighteens).toHaveLength(1);
    expect(container.textContent).toContain("?");
  });

  it("uses '?' only for the target; other unknowns show their symbol or nothing", () => {
    const visual = parse(validBarModelFixtures.find((fixture) => fixture.name === "y5-transfer")!);
    const layout = layoutBarModel(visual.data);
    const shown = layout.bars.flatMap((bar) => bar.segments).filter((segment) => segment.amount === "?");
    expect(shown.map((segment) => segment.id)).toEqual(["ava-gives"]);
    const blank = layout.bars.flatMap((bar) => bar.segments).find((segment) => segment.id === "ava-keeps")!;
    expect(blank.amount).toBe("");
  });

  it("gives every unit with the same unitId the same width", () => {
    const visual = parse(validBarModelFixtures.find((fixture) => fixture.name === "y5-equal-units")!);
    const layout = layoutBarModel(visual.data);
    const [noor, tomas] = layout.bars.map((bar) => bar.segments[0]);
    expect(noor.width / 2).toBe(tomas.width / 5);
    expect(noor.unitTicks).toHaveLength(1);
    expect(tomas.unitTicks).toHaveLength(4);
  });

  it("does not use the solved answer to size anything", () => {
    // Two models identical except for the hidden answer's size: same layout.
    const small = parse(validBarModelFixtures[0]);
    const large = barModelVisualSchema.parse(JSON.parse(JSON.stringify(validBarModelFixtures[0].visual)));
    large.data.braces[0] = { ...large.data.braces[0], value: 4500 } as typeof large.data.braces[0];
    const widthsOf = (layout: ReturnType<typeof layoutBarModel>) =>
      layout.bars.flatMap((bar) => bar.segments.map((segment) => segment.width));
    // The unknown segment is fixed-width whatever the (now larger) answer is.
    expect(widthsOf(layoutBarModel(large.data))).toEqual(widthsOf(layoutBarModel(small.data)));
  });

  it("keeps every shape inside its viewBox", () => {
    for (const fixture of all) {
      const layout = layoutBarModel(parse(fixture).data);
      for (const bar of layout.bars) {
        for (const segment of bar.segments) {
          expect(segment.x, `${fixture.name}/${segment.id}`).toBeGreaterThanOrEqual(0);
          expect(segment.x + segment.width, `${fixture.name}/${segment.id}`).toBeLessThanOrEqual(layout.width);
          expect(segment.y + segment.height, `${fixture.name}/${segment.id}`).toBeLessThanOrEqual(layout.height);
        }
      }
      for (const brace of layout.braces) {
        expect(brace.textX).toBeGreaterThanOrEqual(0);
        expect(brace.textY).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it("describes givens and relationships but never the solved value", () => {
    const text = describeBarModel(parse(validBarModelFixtures.find((fixture) => fixture.name === "y5-before-after")!).data).join(" ");
    expect(text).toContain("taken away");
    expect(tokens(text)).toContain("32");
    expect(tokens(text)).not.toContain("47");
  });

  it("is never fed by the invalid fixtures that fail the schema", () => {
    for (const fixture of invalidBarModelFixtures.filter((entry) => entry.layer === "schema")) {
      expect(validateBarModelVisual(fixture.visual).visual).toBeNull();
    }
  });
});
