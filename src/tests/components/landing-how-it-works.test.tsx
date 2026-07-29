import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { howItWorks } from "@/features/landing/content";

describe("HowItWorks (landing)", () => {
  it("renders all 4 numbered steps with a title and one supporting line each", () => {
    render(<HowItWorks />);
    expect(howItWorks.steps).toHaveLength(4);
    for (const step of howItWorks.steps) {
      expect(screen.getByRole("heading", { name: step.title, level: 3 })).toBeInTheDocument();
      expect(screen.getByText(step.body)).toBeInTheDocument();
    }
  });

  it("renders a single, centred CTA linking to real practice", () => {
    render(<HowItWorks />);
    const cta = screen.getByRole("link", { name: howItWorks.cta.label });
    expect(cta).toHaveAttribute("href", howItWorks.cta.href);
  });
});
