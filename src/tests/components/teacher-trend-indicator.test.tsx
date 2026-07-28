import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendIndicator } from "@/features/teacher/components/TrendIndicator";

describe("TrendIndicator", () => {
  it("describes an upward trend with its delta", () => {
    render(<TrendIndicator direction="up" deltaPoints={8} />);
    expect(screen.getByText("Up 8 points")).toBeInTheDocument();
  });

  it("describes a downward trend using the absolute delta", () => {
    render(<TrendIndicator direction="down" deltaPoints={-6} />);
    expect(screen.getByText("Down 6 points")).toBeInTheDocument();
  });

  it("labels a flat trend as steady", () => {
    render(<TrendIndicator direction="flat" deltaPoints={1} />);
    expect(screen.getByText("Steady")).toBeInTheDocument();
  });
});
