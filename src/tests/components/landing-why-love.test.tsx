import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyLove } from "@/features/landing/components/WhyLove";
import { whyLove } from "@/features/landing/content";

describe("WhyLove (landing)", () => {
  it("renders exactly the 5 configured benefit cards, each with a title and supporting line", () => {
    render(<WhyLove />);
    expect(whyLove.cards).toHaveLength(5);
    for (const card of whyLove.cards) {
      expect(screen.getByRole("heading", { name: card.title, level: 3 })).toBeInTheDocument();
      expect(screen.getByText(card.body)).toBeInTheDocument();
    }
  });
});
