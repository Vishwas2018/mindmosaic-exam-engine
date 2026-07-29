import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ForParents } from "@/features/landing/components/ForParents";
import { forParents } from "@/features/landing/content";

describe("ForParents / Learning insights (landing)", () => {
  it("exposes the #audiences anchor the nav's Insights link targets", () => {
    const { container } = render(<ForParents />);
    expect(container.querySelector("#audiences")).toBeInTheDocument();
  });

  it("renders the heading, all 3 bullet points, and the CTA", () => {
    render(<ForParents />);
    expect(screen.getByRole("heading", { name: forParents.heading, level: 2 })).toBeInTheDocument();
    expect(forParents.points).toHaveLength(3);
    for (const point of forParents.points) {
      expect(screen.getByText(point.text)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: forParents.cta.label })).toHaveAttribute(
      "href",
      forParents.cta.href,
    );
  });
});
