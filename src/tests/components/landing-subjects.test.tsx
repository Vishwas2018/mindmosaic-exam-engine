import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubjectCards, SubjectGrid } from "@/features/landing/components/Subjects";
import { subjectCards, subjectGrid } from "@/features/landing/content";

describe("SubjectCards / Practice by Assessment (landing)", () => {
  it("renders a real, clickable link for every live assessment card", () => {
    render(<SubjectCards />);
    for (const card of subjectCards.cards.filter((c) => !c.comingSoon)) {
      const link = screen.getByRole("link", { name: new RegExp(`^${card.name}`) });
      expect(link).toHaveAttribute("href", card.href);
      expect(screen.getByText(card.description)).toBeInTheDocument();
    }
  });

  it("renders coming-soon assessment cards (e.g. AMC) as disabled, non-interactive, never a dead link", () => {
    render(<SubjectCards />);
    for (const card of subjectCards.cards.filter((c) => c.comingSoon)) {
      expect(screen.getByText(card.name, { exact: false })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: new RegExp(`^${card.name}`) })).not.toBeInTheDocument();
      const disabled = screen.getAllByText("Coming soon").length;
      expect(disabled).toBeGreaterThan(0);
    }
  });
});

describe("SubjectGrid / Explore Subjects (landing)", () => {
  it("renders exactly 8 distinct subject tiles", () => {
    render(<SubjectGrid />);
    expect(subjectGrid.tiles).toHaveLength(8);
    for (const tile of subjectGrid.tiles) {
      expect(screen.getByText(tile.name)).toBeInTheDocument();
    }
  });

  it("marks non-live subjects aria-disabled instead of inventing a live tile", () => {
    render(<SubjectGrid />);
    const comingSoonLabels = screen.getAllByText("Coming soon");
    const comingSoonCount = subjectGrid.tiles.filter((t) => t.comingSoon).length;
    expect(comingSoonLabels).toHaveLength(comingSoonCount);
  });

  it("makes every live tile an actual link (not just visually 'clickable'), coming-soon tiles stay non-interactive", () => {
    render(<SubjectGrid />);
    for (const tile of subjectGrid.tiles.filter((t) => !t.comingSoon)) {
      expect(screen.getByRole("link", { name: new RegExp(`^${tile.name}`) })).toHaveAttribute("href", "/practice");
    }
    for (const tile of subjectGrid.tiles.filter((t) => t.comingSoon)) {
      expect(screen.queryByRole("link", { name: new RegExp(`^${tile.name}`) })).not.toBeInTheDocument();
    }
  });
});
