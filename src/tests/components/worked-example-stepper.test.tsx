import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { WorkedExampleStepper } from "@/features/curriculum/lessons/components/WorkedExampleStepper";
import type { WorkedExampleSection } from "@/features/curriculum/lessons/schema";

const mockWorkedExample: WorkedExampleSection = {
  kind: "worked_example",
  id: "test-we",
  heading: "Solving Odd and Even Sums",
  problem: "Is 14 + 27 odd or even?",
  steps: [
    {
      stepNumber: 1,
      label: "Check first number (14)",
      working: "14 ends in 4, so it is even.",
      why: "The ones digit determines parity.",
    },
    {
      stepNumber: 2,
      label: "Check second number (27)",
      working: "27 ends in 7, so it is odd.",
      why: "7 leaves 1 leftover when paired.",
    },
    {
      stepNumber: 3,
      label: "Apply addition rule",
      working: "Even + Odd = Odd (14 + 27 = 41).",
      why: "The single leftover remains unpaired.",
    },
  ],
  finalAnswer: "14 + 27 = 41, which is an ODD number.",
  commonError: {
    mistake: "Adding the tens digits instead of checking ones digits.",
    whyItHappens: "Looking left-to-right.",
    howToAvoid: "Check the rightmost digit first.",
  },
};

describe("WorkedExampleStepper Component", () => {
  it("renders problem statement and starts at Step 1", () => {
    render(<WorkedExampleStepper section={mockWorkedExample} />);

    expect(screen.getByText("Is 14 + 27 odd or even?")).toBeInTheDocument();
    expect(screen.getByText("Check first number (14)")).toBeInTheDocument();
    expect(screen.getByText("The ones digit determines parity.")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("advances step by step on Next step button clicks and reveals final answer on last step", async () => {
    const user = userEvent.setup();
    render(<WorkedExampleStepper section={mockWorkedExample} />);

    // Step 1 -> Click Next
    const nextBtn = screen.getByRole("button", { name: /Next step/i });
    await user.click(nextBtn);

    // Step 2
    expect(screen.getByText("Check second number (27)")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();

    // Step 2 -> Click Next
    await user.click(screen.getByRole("button", { name: /Next step/i }));

    // Step 3 (Last Step)
    expect(screen.getByText("Apply addition rule")).toBeInTheDocument();
    expect(screen.getByText("14 + 27 = 41, which is an ODD number.")).toBeInTheDocument();
    expect(screen.getByText(/Common Mistake to Watch Out For/i)).toBeInTheDocument();
  });

  it("toggles between step-by-step and show all steps view", async () => {
    const user = userEvent.setup();
    render(<WorkedExampleStepper section={mockWorkedExample} />);

    const toggleBtn = screen.getByRole("button", { name: /Show all steps/i });
    await user.click(toggleBtn);

    // All steps should be simultaneously visible
    expect(screen.getByText("Check first number (14)")).toBeInTheDocument();
    expect(screen.getByText("Check second number (27)")).toBeInTheDocument();
    expect(screen.getByText("Apply addition rule")).toBeInTheDocument();
    expect(screen.getByText("14 + 27 = 41, which is an ODD number.")).toBeInTheDocument();

    // Toggle back
    await user.click(screen.getByRole("button", { name: /Step-by-step view/i }));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });
});
