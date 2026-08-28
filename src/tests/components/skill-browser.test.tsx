import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SkillBrowser } from "@/features/student/components/SkillBrowser";
import type { SkillSummary } from "@/features/exam-engine/selection";

const SKILLS: SkillSummary[] = [
  { subject: "numeracy", skill: "Fractions", questionCount: 5 },
  { subject: "numeracy", skill: "Decimals", questionCount: 6 },
  { subject: "reading", skill: "Inference", questionCount: 7 },
  { subject: "reading", skill: "Vocabulary", questionCount: 2 }, // < 5 questions: should be excluded
];

describe("SkillBrowser", () => {
  it("renders nothing when there are no skills or no skills with >=5 questions", () => {
    const { container: c1 } = render(<SkillBrowser skills={[]} />);
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      <SkillBrowser skills={[{ subject: "reading", skill: "Vocabulary", questionCount: 2 }]} />,
    );
    expect(c2).toBeEmptyDOMElement();
  });

  it("hides skills with fewer than five questions", () => {
    render(<SkillBrowser skills={SKILLS} />);
    // "Vocabulary" has only 2 questions, so it must not be rendered anywhere
    expect(screen.queryByText("Vocabulary")).not.toBeInTheDocument();
  });

  it("defaults to single subject view (numeracy) and links to count=5 session", () => {
    render(<SkillBrowser skills={SKILLS} />);

    expect(screen.getByRole("link", { name: /Fractions/ })).toHaveAttribute(
      "href",
      "/practice/session?subject=numeracy&skill=Fractions&count=5",
    );
    expect(screen.getByText("Decimals")).toBeInTheDocument();
    // Reading skill not in initial numeracy view
    expect(screen.queryByText("Inference")).not.toBeInTheDocument();
  });

  it("filters skills by subject chips", async () => {
    const user = userEvent.setup();
    render(<SkillBrowser skills={SKILLS} />);

    await user.click(screen.getByTestId("skill-subject-filter-reading"));
    expect(screen.getByText("Inference")).toBeInTheDocument();
    expect(screen.queryByText("Fractions")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("skill-subject-filter-all"));
    expect(screen.getByText("Inference")).toBeInTheDocument();
    expect(screen.getByText("Fractions")).toBeInTheDocument();
  });

  it("filters skills using the search input", async () => {
    const user = userEvent.setup();
    render(<SkillBrowser skills={SKILLS} />);

    const searchInput = screen.getByTestId("skill-search-input");
    await user.type(searchInput, "Frac");

    expect(screen.getByText("Fractions")).toBeInTheDocument();
    expect(screen.queryByText("Decimals")).not.toBeInTheDocument();
  });

  it("shows count summary of available 5+ question skills", () => {
    render(<SkillBrowser skills={SKILLS} />);
    expect(screen.getByTestId("skill-count-summary")).toHaveTextContent(
      "Showing 2 of 2 skills with 5+ questions",
    );
  });

  it("supports pagination / Show more when skills exceed page size", async () => {
    const user = userEvent.setup();
    const manySkills: SkillSummary[] = Array.from({ length: 15 }, (_, i) => ({
      subject: "numeracy",
      skill: `Skill ${i + 1}`,
      questionCount: 5,
    }));

    render(<SkillBrowser skills={manySkills} pageSize={5} />);

    expect(screen.getByText("Showing 5 of 15 skills with 5+ questions")).toBeInTheDocument();
    expect(screen.getByTestId("show-more-skills")).toHaveTextContent("Show more (10 remaining)");

    await user.click(screen.getByTestId("show-more-skills"));
    expect(screen.getByText("Showing 10 of 15 skills with 5+ questions")).toBeInTheDocument();
  });
});
