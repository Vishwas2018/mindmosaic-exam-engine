import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { showcaseVisuals } from "@/content/questions/showcase-fixtures";
import {
  CoordinateGridRenderer,
  NumberLineRenderer,
  PieChartRenderer,
  TableRenderer,
  VisualRenderer,
} from "@/features/exam-engine/visual-renderers";
import {
  MAX_COORDINATE_GRID_LINES_PER_AXIS,
  MAX_NUMBER_LINE_TICKS,
} from "@/schemas/visual-safety";
import type { VisualAsset } from "@/schemas/visual.schema";

function findVisual(id: string): VisualAsset {
  const visual = showcaseVisuals.find((item) => item.id === id);
  if (!visual) throw new Error(`Missing visual ${id}`);
  return visual;
}

describe("TableRenderer", () => {
  it("renders a semantic table with a caption and headers", () => {
    render(<TableRenderer visual={findVisual("vis-table")} />);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Month" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "March" })).toBeInTheDocument();
  });
});

describe("PieChartRenderer", () => {
  it("exposes an accessible image with a legend", () => {
    render(<PieChartRenderer visual={findVisual("vis-pie-chart")} />);
    expect(
      screen.getByRole("img", { name: /How students travel to school/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Walk")).toBeInTheDocument();
  });
});

describe("VisualRenderer registry dispatch", () => {
  it("renders each visual type with an accessible name", () => {
    for (const visual of showcaseVisuals) {
      const { unmount } = render(<VisualRenderer visual={visual} />);
      if (visual.type === "table") {
        expect(screen.getByRole("table")).toBeInTheDocument();
      } else {
        expect(screen.getAllByRole("img").length).toBeGreaterThan(0);
      }
      unmount();
    }
  });
});

describe("visual render-time safety backstop", () => {
  /*
   * Schema validation is the primary defence against a tiny step over a
   * huge span (visual-safety.test.ts). These tests construct the same
   * adversarial shape directly — bypassing schema, as content that
   * somehow slipped through would — to confirm the renderer itself never
   * produces a main-thread-scale array, satisfying "no main-thread-scale
   * arrays" and "safe renderer output count" as a defence-in-depth check.
   */
  it("caps a number line's tick count even for a tiny step over a huge span", () => {
    const hostile: VisualAsset = {
      id: "hostile-number-line",
      type: "number_line",
      altText: "A hostile number line configuration.",
      data: { min: 0, max: 1_000_000, step: 0.0001, highlightedValues: [] },
    };
    const { container } = render(<NumberLineRenderer visual={hostile} />);
    const tickLines = container.querySelectorAll("g[aria-hidden='true'] line");
    expect(tickLines.length).toBeLessThanOrEqual(MAX_NUMBER_LINE_TICKS);
  });

  it("caps a coordinate grid's line count even for a tiny step over huge ranges", () => {
    const hostile: VisualAsset = {
      id: "hostile-coordinate-grid",
      type: "coordinate_grid",
      altText: "A hostile coordinate grid configuration.",
      data: {
        xRange: [0, 1_000_000],
        yRange: [0, 1_000_000],
        points: [],
        gridStep: 0.0001,
      },
    };
    const { container } = render(<CoordinateGridRenderer visual={hostile} />);
    /* Every gridline plus the two fixed x/y axis lines are all <line>
       elements inside the same aria-hidden group. */
    const gridLines = container.querySelectorAll("g[aria-hidden='true'] > line");
    expect(gridLines.length).toBeLessThanOrEqual(
      2 * MAX_COORDINATE_GRID_LINES_PER_AXIS + 2,
    );
  });
});
