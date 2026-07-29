import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Educators, Testimonials } from "@/features/landing/components/SocialProof";
import { educators, testimonials } from "@/features/landing/content";

describe("Educators (landing)", () => {
  it("renders nothing while the flagged photo set stays disabled", () => {
    expect(educators.enabled).toBe(false);
    const { container } = render(<Educators />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Testimonials (landing)", () => {
  it("stays hidden (enabled: false) until real, consented reviews exist", () => {
    expect(testimonials.enabled).toBe(false);
    const { container } = render(<Testimonials />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is configured with exactly two parent testimonials for when it's turned on", () => {
    expect(testimonials.items).toHaveLength(2);
    for (const item of testimonials.items) {
      expect(item.role).toBe("Parent");
    }
  });
});
