import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { showcaseVisuals } from "@/content/questions/showcase-fixtures";
import {
  PieChartRenderer,
  TableRenderer,
  VisualRenderer,
} from "@/features/exam-engine/visual-renderers";
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
