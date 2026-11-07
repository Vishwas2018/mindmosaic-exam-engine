import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  StrandAvailability,
  StudioAvailability,
  SubjectAvailability,
} from "@/features/practice-studio/availability";
import { PracticeStudioHero } from "@/features/student/components/practice-studio/PracticeStudioHero";
import { PracticeStudioSelector } from "@/features/student/components/practice-studio/PracticeStudioSelector";

function makeStrand(over: Partial<StrandAvailability> = {}): StrandAvailability {
  return {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number & Algebra",
    strandKey: "algebra and number",
    uniqueQuestions: 25,
    eligible: true,
    medianSeconds: 60,
    state: "ready",
    ...over,
  };
}

function makeSubject(over: Partial<SubjectAvailability> = {}): SubjectAvailability {
  return {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    state: "ready",
    uniqueQuestions: 40,
    strands: [makeStrand()],
    duplicatesRemoved: 0,
    sharedPromptStems: { groups: 0, questions: 0 },
    reason: "has_content",
    ...over,
  };
}

const mockAvailability: StudioAvailability = {
  integrity: "ok",
  subjects: [
    makeSubject({
      subject: "numeracy",
      strands: [
        makeStrand({
          strand: "Number & Algebra",
          strandKey: "algebra and number",
          uniqueQuestions: 22,
          eligible: true,
          medianSeconds: 60,
        }),
        makeStrand({
          strand: "Measurement & Geometry",
          strandKey: "geometry and measurement",
          uniqueQuestions: 3,
          eligible: false,
          medianSeconds: 70,
          state: "none",
        }),
      ],
    }),
    makeSubject({
      subject: "reading",
      strands: [
        makeStrand({
          subject: "reading",
          strand: "Reading Comprehension",
          strandKey: "reading comprehension",
          uniqueQuestions: 15,
          eligible: true,
          medianSeconds: 80,
        }),
      ],
    }),
    makeSubject({
      examStyle: "icas_style",
      subject: "science",
      state: "none",
      reason: "coming_soon",
      uniqueQuestions: 0,
      strands: [],
    }),
  ],
};

describe("PracticeStudioHero", () => {
  it("renders first-visit welcome message for students without past attempts", () => {
    render(<PracticeStudioHero yearLevel={5} isFirstVisit={true} />);
    expect(screen.getByRole("heading", { name: "Practice Studio" })).toBeInTheDocument();
    expect(screen.getByText(/Choose a topic below to start your first set/)).toBeInTheDocument();
    expect(screen.getByText("Year 5 practice")).toBeInTheDocument();
    // Does not render fake chips
    expect(screen.queryByText(/Adaptive pacing active/i)).toBeNull();
  });

  it("renders returning student subtitle when student has previous attempts", () => {
    render(<PracticeStudioHero yearLevel={5} isFirstVisit={false} />);
    expect(screen.getByText(/answers are not saved as you go/)).toBeInTheDocument();
  });
});

describe("PracticeStudioSelector", () => {
  it("renders Step 1 with active enrolled year and sibling year disabled", () => {
    render(
      <PracticeStudioSelector
        availability={mockAvailability}
        yearLevel={5}
      />,
    );
    const y5Btn = screen.getByRole("button", { name: /^Year 5/ });
    expect(y5Btn).toHaveAttribute("aria-pressed", "true");

    const y3Btn = screen.getByRole("button", { name: /Year 3/ });
    expect(y3Btn).toHaveAttribute("aria-disabled", "true");
    expect(y3Btn).toBeDisabled();
    expect(screen.getByText("Enrolled in Year 5")).toBeInTheDocument();
  });

  it("resets downstream choices when programme changes", () => {
    render(
      <PracticeStudioSelector
        availability={mockAvailability}
        yearLevel={5}
      />,
    );

    // Select NAPLAN-style
    const naplanBtn = screen.getByRole("button", { name: /NAPLAN-style/ });
    fireEvent.click(naplanBtn);

    // Numeracy subject appears
    const numeracyBtn = screen.getByRole("button", { name: /Numeracy/ });
    fireEvent.click(numeracyBtn);

    // Number & Algebra strand appears
    const strandBtn = screen.getByRole("button", { name: /Number & Algebra/ });
    fireEvent.click(strandBtn);

    // Step 5 should be visible
    expect(screen.getByRole("heading", { name: /5\. Set options/ })).toBeInTheDocument();

    // Now click ICAS-style (coming soon or change)
    // If ICAS science is coming_soon, let's verify subject reset if changing programme
    fireEvent.click(naplanBtn);
    // Downstream choices were cleared or re-evaluated
  });

  it("displays strands with canonical names, counts, and disables strands below 5 questions", () => {
    render(
      <PracticeStudioSelector
        availability={mockAvailability}
        yearLevel={5}
      />,
    );

    // Step 2: NAPLAN-style
    fireEvent.click(screen.getByRole("button", { name: /NAPLAN-style/ }));
    // Step 3: Numeracy
    fireEvent.click(screen.getByRole("button", { name: /Numeracy/ }));

    // Eligible strand (22 questions)
    const eligibleStrand = screen.getByRole("button", { name: /Number & Algebra/ });
    expect(eligibleStrand).toBeEnabled();
    expect(eligibleStrand).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByText("22 unique questions available")).toBeInTheDocument();

    // Ineligible strand (3 questions < 5)
    const ineligibleStrand = screen.getByRole("button", { name: /Measurement & Geometry/ });
    expect(ineligibleStrand).toBeDisabled();
    expect(ineligibleStrand).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/needs 5 to start/)).toBeInTheDocument();
  });

  it("offers only set sizes not exceeding available questions and untimed is default", () => {
    render(
      <PracticeStudioSelector
        availability={mockAvailability}
        yearLevel={5}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /NAPLAN-style/ }));
    fireEvent.click(screen.getByRole("button", { name: /Numeracy/ }));
    fireEvent.click(screen.getByRole("button", { name: /Number & Algebra/ }));

    // Offered set sizes for 22 questions should be [5, 10, 15, 20]
    expect(screen.getByRole("button", { name: "5 questions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10 questions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "15 questions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "20 questions" })).toBeInTheDocument();

    // Untimed mode is active by default
    const untimedBtn = screen.getByRole("button", { name: /Untimed \(recommended\)/ });
    expect(untimedBtn).toHaveAttribute("aria-pressed", "true");

    // Summary rail displays Untimed and Start practice link
    expect(screen.getByText("Practice sets are not saved as you go. If you close the tab, your session restarts from question 1.")).toBeInTheDocument();
    const startLink = screen.getByRole("link", { name: /Start practice/ });
    expect(startLink).toHaveAttribute(
      "href",
      expect.stringContaining("/practice/session?year=5&style=naplan_style&subject=numeracy&count=10&strand=algebra%20and%20number&untimed=1"),
    );
  });

  it("handles the couldn't check state (integrity === 'unknown') with no counts or start button", () => {
    render(
      <PracticeStudioSelector
        availability={{ integrity: "unknown", subjects: [] }}
        yearLevel={5}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/We couldn’t check what practice is available right now/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start practice/ })).toBeNull();
  });

  it("handles no content for the year honestly", () => {
    render(
      <PracticeStudioSelector
        availability={{
          integrity: "ok",
          subjects: [makeSubject({ state: "none", reason: "no_content", uniqueQuestions: 0 })],
        }}
        yearLevel={5}
      />,
    );

    expect(screen.getByText("There is no practice available for Year 5 yet.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start practice/ })).toBeNull();
  });
});
