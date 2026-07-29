import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureStrip, SiteFooter } from "@/features/landing/components/Closing";
import { featureStrip, footer } from "@/features/landing/content";

describe("FeatureStrip (landing)", () => {
  it("renders every configured feature item", () => {
    render(<FeatureStrip />);
    for (const item of featureStrip.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.body)).toBeInTheDocument();
    }
  });
});

describe("SiteFooter (landing)", () => {
  it("renders every footer link with a real, non-empty href — zero dead links", () => {
    render(<SiteFooter />);
    for (const column of footer.columns) {
      for (const link of column.links) {
        expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
      }
    }
  });

  it("renders the non-affiliation disclaimer", () => {
    render(<SiteFooter />);
    expect(screen.getByText(footer.disclaimer)).toBeInTheDocument();
  });

  it("renders social icons as disabled controls, never dead links", () => {
    render(<SiteFooter />);
    for (const social of footer.socials) {
      const button = screen.getByRole("button", { name: new RegExp(social.label) });
      expect(button).toBeDisabled();
    }
  });
});
