import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { StatsBand } from "@/features/landing/components/StatsBand";
import { statsBand } from "@/features/landing/content";
import { getPublishedQuestionCount, getPublishedTopicCount } from "@/server/exam-bank";

const derived: Record<string, string> = {
  questions: String(getPublishedQuestionCount()),
  topics: String(getPublishedTopicCount()),
};

describe("StatsBand / Trust & social proof (landing)", () => {
  it("renders the section eyebrow and every configured stat value/label", () => {
    render(<StatsBand />);
    expect(screen.getByText(statsBand.eyebrow)).toBeInTheDocument();
    for (const stat of statsBand.stats) {
      const expectedValue = stat.derive ? derived[stat.derive] : stat.value;
      expect(screen.getByText(String(expectedValue))).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  it("fills the 'Original Questions' stat from the learner-accessible published pool (curated + factory-published), not a hardcoded literal", () => {
    render(<StatsBand />);
    expect(screen.getByText(String(getPublishedQuestionCount()))).toBeInTheDocument();
  });

  /* Was a hardcoded "✓" tile duplicating the hero's "Curriculum Aligned (AU)"
     chip — every stat in the row now carries a real figure. */
  it("shows a derived topic count rather than a tick glyph", () => {
    render(<StatsBand />);
    expect(screen.getByText(String(getPublishedTopicCount()))).toBeInTheDocument();
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
  });

  it("exposes an accessible section landmark named after the stats heading", () => {
    render(<StatsBand />);
    expect(screen.getByRole("region", { name: statsBand.heading })).toBeInTheDocument();
  });
});
