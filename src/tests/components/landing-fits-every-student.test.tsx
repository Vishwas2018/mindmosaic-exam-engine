import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FitsEveryStudent } from "@/features/landing/components/FitsEveryStudent";
import { fitsEveryStudent } from "@/features/landing/content";

describe("FitsEveryStudent (landing)", () => {
  it("renders the headline, body and CTA from content.ts", () => {
    render(<FitsEveryStudent />);
    const heading = screen.getByRole("heading", { level: 2 });
    for (const line of fitsEveryStudent.headlineLines) {
      expect(heading).toHaveTextContent(line.text);
    }
    expect(screen.getByText(fitsEveryStudent.body)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: fitsEveryStudent.cta.label })).toHaveAttribute(
      "href",
      fitsEveryStudent.cta.href,
    );
  });
});
