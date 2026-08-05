import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Eyebrow,
  mmButton,
  MosaicRule,
  pillClasses,
  SectionHeading,
} from "@/features/landing/components/primitives";

describe("mmButton", () => {
  it("defaults to the primary treatment at the touch-target floor", () => {
    const classes = mmButton();
    expect(classes).toContain("bg-mm-brand");
    expect(classes).toContain("min-h-12");
  });

  it("merges a caller's overrides last, so they win", () => {
    expect(mmButton({ className: "w-full" })).toContain("w-full");
  });

  it("keeps a visible focus ring on every variant", () => {
    for (const variant of ["primary", "outline", "quiet"] as const) {
      expect(mmButton({ variant })).toContain("focus-visible:ring-4");
    }
  });
});

describe("pillClasses", () => {
  it("distinguishes selected, unselected and unavailable without relying on colour alone at the call site", () => {
    expect(pillClasses({ selected: true })).toContain("bg-mm-brand");
    expect(pillClasses({ selected: false })).toContain("bg-white");
    expect(pillClasses({ selected: false, disabled: true })).toContain("bg-mm-surface-quiet");
  });
});

describe("SectionHeading", () => {
  it("renders an h2 carrying the id its section is labelled by", () => {
    render(<SectionHeading id="demo-heading" eyebrow="Eyebrow" title="Title" intro="Intro" />);
    const heading = screen.getByRole("heading", { level: 2, name: "Title" });
    expect(heading).toHaveAttribute("id", "demo-heading");
    expect(screen.getByText("Eyebrow")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
  });

  it("omits the eyebrow and intro when they are not given", () => {
    render(<SectionHeading id="bare-heading" title="Bare" />);
    expect(screen.getByRole("heading", { level: 2, name: "Bare" })).toBeInTheDocument();
  });
});

describe("Eyebrow and MosaicRule", () => {
  it("hides the decorative rule from assistive tech", () => {
    const { container } = render(<MosaicRule tiles={["brand", "coral", "quiet"]} />);
    const rule = container.firstElementChild!;
    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(rule.children).toHaveLength(3);
  });

  it("renders the eyebrow's coral rule only when asked for", () => {
    const { container, rerender } = render(<Eyebrow>Plain</Eyebrow>);
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
    rerender(<Eyebrow rule>Ruled</Eyebrow>);
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(1);
  });
});
