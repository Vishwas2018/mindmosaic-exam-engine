import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatsBand } from "@/features/landing/components/StatsBand";
import { statsBand } from "@/features/landing/content";

describe("StatsBand / Trust & social proof (landing)", () => {
  it("renders the section eyebrow and every configured stat value/label", () => {
    render(<StatsBand />);
    expect(screen.getByText(statsBand.eyebrow)).toBeInTheDocument();
    for (const stat of statsBand.stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      expect(screen.getByText(stat.label)).toBeInTheDocument();
    }
  });

  it("exposes an accessible section landmark named after the stats heading", () => {
    render(<StatsBand />);
    expect(screen.getByRole("region", { name: statsBand.heading })).toBeInTheDocument();
  });
});
