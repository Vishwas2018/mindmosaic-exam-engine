import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PracticeStudioDrillModules } from "@/features/student/components/practice-studio/PracticeStudioDrillModules";
import { PracticeStudioAccuracyCard } from "@/features/student/components/practice-studio/PracticeStudioAccuracyCard";
import { MyProgressHero } from "@/features/student/components/progress/MyProgressHero";
import { ExamCentreHero } from "@/features/student/components/exam-centre/ExamCentreHero";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const thin = {
  subject: "numeracy",
  label: "Numeracy",
  percent: 90,
  marksEarned: 9,
  marksAvailable: 10,
  sets: 1,
  sufficientEvidence: false,
};

describe("no invented progress on the student side", () => {
  it("Practice Studio drill modules show no example mastery numbers", () => {
    render(<PracticeStudioDrillModules effectiveYear={5} />);
    expect(document.body).not.toHaveTextContent(/mastery/i);
    expect(document.body).not.toHaveTextContent(/\b(88|74|79|92|81)%/);
  });

  it("the progress hero does not state a NAPLAN testing window it cannot know", () => {
    render(<MyProgressHero questionsAnswered={12} recommendedFocus={null} />);
    expect(document.body).not.toHaveTextContent(/testing cycle|target window/i);
    expect(document.body).not.toHaveTextContent(/mastery/i);
  });

  it("a single set never produces an average, a focus or a percentage claim", () => {
    render(<PracticeStudioAccuracyCard mastery={[thin]} />);
    expect(screen.getByText(/not enough finished sets for an average yet/i)).toBeInTheDocument();
    expect(screen.getByText("9 of 10 marks")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/90%/);
  });

  it("the Exam Centre tile is an average of marks, not readiness", () => {
    render(<ExamCentreHero averageMarks={71} />);
    expect(screen.getByText(/your marks, averaged across subjects/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/readiness|mastery/i);
  });
});
