import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingLogo } from "@/features/landing/components/Brand";
import { lpButton, SectionHeading } from "@/features/landing/components/primitives";

describe("lpButton (landing)", () => {
  it("uses the 12px button radius and 15-16px text token specified by the design system", () => {
    const className = lpButton({ size: "lg" });
    expect(className).toContain("rounded-btn");
    expect(className).toContain("text-[length:var(--text-btn)]");
  });

  it("uses the --brand background for the primary variant and outline styling for secondary", () => {
    expect(lpButton({ variant: "primary" })).toContain("bg-brand");
    expect(lpButton({ variant: "outline" })).toContain("border-brand");
  });
});

describe("SectionHeading (landing)", () => {
  it("renders an eyebrow, an H2 title, and an optional intro", () => {
    render(<SectionHeading eyebrow="Eyebrow text" title="Section title" intro="Intro copy" />);
    expect(screen.getByText("Eyebrow text")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Section title" })).toBeInTheDocument();
    expect(screen.getByText("Intro copy")).toBeInTheDocument();
  });
});

describe("LandingLogo (landing)", () => {
  it("renders the wordmark", () => {
    render(<LandingLogo />);
    expect(screen.getByText("Mind")).toBeInTheDocument();
    expect(screen.getByText("Mosaic")).toBeInTheDocument();
  });
});
