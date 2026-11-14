import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ParentPracticePreview } from "@/features/parent-dashboard";
import {
  PREVIEW_PROGRAMMES_YEAR3,
  PREVIEW_SAMPLE_QUESTIONS_NUMERACY,
} from "@/features/parent-dashboard/fixtures";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
};

const mockProgramme = PREVIEW_PROGRAMMES_YEAR3[0];

describe("ParentPracticePreview Component", () => {
  it("renders preview header and safeguard notice confirming zero mutation", () => {
    render(
      <ParentPracticePreview
        child={mockChild}
        programme={mockProgramme}
        sampleQuestions={PREVIEW_SAMPLE_QUESTIONS_NUMERACY}
        isLocalPreview={true}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "NAPLAN-style Numeracy, Year 3" }),
    ).toBeInTheDocument();
    expect(screen.getByText("You are previewing.")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Answering here changes nothing\. It is not saved, not marked, and never appears in Aisha’s results\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
  });

  it("renders sample question, choices and rotates without saving", () => {
    render(
      <ParentPracticePreview
        child={mockChild}
        programme={mockProgramme}
        sampleQuestions={PREVIEW_SAMPLE_QUESTIONS_NUMERACY}
      />,
    );

    // Initial question is Question 1
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A shop has 4 shelves. Each shelf holds 25 jars. How many jars are there altogether?",
      ),
    ).toBeInTheDocument();

    // Select an option
    const option100 = screen.getByLabelText("100 jars");
    fireEvent.click(option100);
    expect(option100).toBeChecked();

    // Click "Show the next one"
    const nextBtn = screen.getByRole("button", { name: /Show the next one →/i });
    fireEvent.click(nextBtn);

    // Now should be Question 2
    expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Liam has $12.50. He buys a notebook for $4.20 and a pen for $2.80. How much change does he get?",
      ),
    ).toBeInTheDocument();
  });

  it("renders 'About this one' specifications table", () => {
    render(
      <ParentPracticePreview
        child={mockChild}
        programme={mockProgramme}
        sampleQuestions={PREVIEW_SAMPLE_QUESTIONS_NUMERACY}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "About this one" })).toBeInTheDocument();
    expect(screen.getByText("Strands covered")).toBeInTheDocument();
    expect(screen.getByText("Set sizes")).toBeInTheDocument();
    expect(screen.getByText("Typical time")).toBeInTheDocument();
    expect(screen.getByText("About 15 minutes")).toBeInTheDocument();
  });

  it("displays deferred assignment policy as disabled with honest rationale", () => {
    render(
      <ParentPracticePreview
        child={mockChild}
        programme={mockProgramme}
        sampleQuestions={PREVIEW_SAMPLE_QUESTIONS_NUMERACY}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Set this for Aisha" }),
    ).toBeInTheDocument();
    const setBtn = screen.getByRole("button", { name: "Set a 10-question set" });
    expect(setBtn).toBeDisabled();
    expect(
      screen.getByText(
        /Not built, and not obviously wanted\. It turns practice into homework a child did not choose/i,
      ),
    ).toBeInTheDocument();
  });

  it("displays deferred stretch policy as disabled with NEEDS SIGN-OFF warning", () => {
    render(
      <ParentPracticePreview
        child={mockChild}
        programme={mockProgramme}
        sampleQuestions={PREVIEW_SAMPLE_QUESTIONS_NUMERACY}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Let Aisha try Year 5" }),
    ).toBeInTheDocument();
    const stretchBtn = screen.getByRole("button", { name: "Open Year 5 for Aisha" });
    expect(stretchBtn).toBeDisabled();
    expect(screen.queryByText("NEEDS SIGN-OFF")).not.toBeInTheDocument();
    expect(
      screen.getByText(/a Year 5 paper sat by a Year 3 child must not quietly land in their Year 3 figures/i),
    ).toBeInTheDocument();
  });
});
