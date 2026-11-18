import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ChildLearningHub } from "@/features/parent-dashboard";
import { PREVIEW_PROGRAMMES_YEAR3 } from "@/features/parent-dashboard/fixtures";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
  loginCode: "K7XJ-2P9R",
};

const mockSiblings = [
  { id: "child-aisha", name: "Aisha" },
  { id: "child-kabir", name: "Kabir" },
  { id: "child-maya", name: "Maya" },
];

describe("ChildLearningHub Component", () => {
  it("renders heading and subtitle with child name and year level", () => {
    render(
      <ChildLearningHub
        child={mockChild}
        siblings={mockSiblings}
        programmes={PREVIEW_PROGRAMMES_YEAR3}
        isLocalPreview={false}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Learning for Aisha" })).toBeInTheDocument();
    expect(screen.getByText(/What is available at Year 3, and how to get her going/i)).toBeInTheDocument();
  });

  it("displays preview isolation banner explaining that parent preview does not mutate student attempts", () => {
    render(
      <ChildLearningHub
        child={mockChild}
        siblings={mockSiblings}
        programmes={PREVIEW_PROGRAMMES_YEAR3}
        isLocalPreview={true}
      />,
    );

    expect(
      screen.getByText(/Anything you open here is a preview for you\./i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not appear in her results, and it does not use up a paper\./i),
    ).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
  });

  it("renders programme cards with distinct states: Ready, Not written yet, and We couldn't check", () => {
    render(
      <ChildLearningHub
        child={mockChild}
        siblings={mockSiblings}
        programmes={PREVIEW_PROGRAMMES_YEAR3}
      />,
    );

    // Section heading
    expect(screen.getByRole("heading", { level: 2, name: "What Year 3 can practise" })).toBeInTheDocument();

    // Ready programmes
    expect(screen.getByRole("heading", { level: 3, name: "NAPLAN-style Numeracy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "NAPLAN-style Reading" })).toBeInTheDocument();
    const readyBadges = screen.getAllByText("Ready");
    expect(readyBadges.length).toBeGreaterThanOrEqual(2);

    // "Have a look" preview links
    const previewLinks = screen.getAllByRole("link", { name: "Have a look" });
    expect(previewLinks.length).toBeGreaterThanOrEqual(2);
    expect(previewLinks[0]).toHaveAttribute(
      "href",
      "/parent/children/child-aisha/learning/preview?programme=naplan-numeracy-y3",
    );

    // Not written yet
    expect(screen.getByRole("heading", { level: 3, name: "ICAS-style Science" })).toBeInTheDocument();
    expect(screen.getByText("Not written yet")).toBeInTheDocument();
    expect(
      screen.getByText(/There are no questions for this one at Year 3 yet/i),
    ).toBeInTheDocument();

    // We couldn't check
    expect(screen.getByRole("heading", { level: 3, name: "ICAS-style Digital Technologies" })).toBeInTheDocument();
    expect(screen.getByText("We couldn’t check")).toBeInTheDocument();
    expect(
      screen.getByText(/We could not work out what is available here just now/i),
    ).toBeInTheDocument();
  });

  it("renders 'Help Aisha get started' instructions including student login code", () => {
    render(
      <ChildLearningHub
        child={mockChild}
        siblings={mockSiblings}
        programmes={PREVIEW_PROGRAMMES_YEAR3}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Help Aisha get started" })).toBeInTheDocument();
    expect(screen.getByText("K7XJ-2P9R")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "1 · Sit with her the first time" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "2 · Start with a practice set" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "3 · Move to a timed paper later" })).toBeInTheDocument();
  });

  it("provides a navigation link to the dedicated child writing practice page", () => {
    render(
      <ChildLearningHub
        child={mockChild}
        siblings={mockSiblings}
        programmes={PREVIEW_PROGRAMMES_YEAR3}
      />,
    );

    const writingLink = screen.getByRole("link", { name: /View Writing →/i });
    expect(writingLink).toHaveAttribute("href", "/parent/children/child-aisha/writing");
  });
});
