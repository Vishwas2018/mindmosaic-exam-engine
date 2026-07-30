import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { StatsBand } from "@/features/landing/components/StatsBand";
import { statsBand } from "@/features/landing/content";
import { getPublishedQuestionCount } from "@/server/exam-bank";

describe("StatsBand / Trust & social proof (landing)", () => {
  it("renders the section eyebrow and every configured stat value/label", () => {
    render(<StatsBand />);
    expect(screen.getByText(statsBand.eyebrow)).toBeInTheDocument();
    for (const stat of statsBand.stats) {
      const expectedValue = stat.value ?? String(getPublishedQuestionCount());
      expect(screen.getByText(expectedValue)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  it("fills the 'Original Questions' stat from the learner-accessible published pool (curated + factory-published), not a hardcoded literal", () => {
    render(<StatsBand />);
    expect(screen.getByText(String(getPublishedQuestionCount()))).toBeInTheDocument();
  });

  it("exposes an accessible section landmark named after the stats heading", () => {
    render(<StatsBand />);
    expect(screen.getByRole("region", { name: statsBand.heading })).toBeInTheDocument();
  });
});
