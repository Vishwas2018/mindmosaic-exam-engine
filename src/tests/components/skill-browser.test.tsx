import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SkillBrowser } from "@/features/student/components/SkillBrowser";
import type { SkillSummary } from "@/features/exam-engine/selection";

const SKILLS: SkillSummary[] = [
  { subject: "numeracy", skill: "Fractions", questionCount: 5 },
  { subject: "reading", skill: "Inference", questionCount: 3 },
];

describe("SkillBrowser", () => {
  it("renders nothing when there are no skills", () => {
    const { container } = render(<SkillBrowser skills={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links each skill to a scoped practice session", () => {
    render(<SkillBrowser skills={SKILLS} />);
    expect(screen.getByRole("link", { name: /Fractions/ })).toHaveAttribute(
      "href",
      "/practice/session?subject=numeracy&skill=Fractions",
    );
    expect(screen.getByText("Numeracy · 5 questions")).toBeInTheDocument();
  });

  it("filters skills by subject", async () => {
    const user = userEvent.setup();
    render(<SkillBrowser skills={SKILLS} />);

    await user.click(screen.getByTestId("skill-subject-filter-reading"));
    expect(screen.getByText("Inference")).toBeInTheDocument();
    expect(screen.queryByText("Fractions")).not.toBeInTheDocument();
  });
});
