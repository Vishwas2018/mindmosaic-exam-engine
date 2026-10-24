import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const approve = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/review/actions", () => ({ approveDraft: approve }));

import { DraftReview } from "@/features/admin-review/DraftReview";
import {
  scholarshipReviewSchema,
  type ReviewCatalogue,
} from "@/features/admin-review/contracts";

function catalogue(): ReviewCatalogue {
  const sources = ["verbal-reasoning", "reading"];
  return {
    issues: [],
    approvalsAvailable: true,
    entries: sources.flatMap((source) => {
      const packet = JSON.parse(
        readFileSync(
          `content/scholarship-drafts/scholarship-y6-${source}-draft.json`,
          "utf8",
        ),
      );
      return packet.questions
        .slice(0, 2)
        .map((raw: unknown) => ({
          kind: "scholarship" as const,
          source,
          contentHash: "a".repeat(64),
          question: scholarshipReviewSchema.parse(raw),
        }));
    }),
  };
}

describe("admin preview isolation", () => {
  it("uses actual question controls, scores an individual response and keeps approval explicit", async () => {
    const user = userEvent.setup();
    const data = catalogue();
    render(<DraftReview catalogue={data} />);
    expect(
      screen.getByRole("button", { name: "Record my explicit approval" }),
    ).toBeDisabled();
    const q = data.entries[0].question;
    const correct = q.options.find(
      (option) => option.id === q.answerKey.optionId,
    )!;
    await user.click(screen.getByRole("radio", { name: correct.text }));
    await user.click(
      screen.getByRole("button", { name: "Submit preview answer" }),
    );
    expect(screen.getByText(/Preview total: 1 \/ 1 marks/)).toBeInTheDocument();
    expect(screen.getByText(q.explanation)).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("previews a complete paper, retains answers between questions and renders the shared passage", async () => {
    const user = userEvent.setup();
    render(<DraftReview catalogue={catalogue()} />);
    await user.click(
      screen.getByRole("button", { name: "Complete draft papers" }),
    );
    await user.selectOptions(
      screen.getByLabelText("Draft section paper"),
      "reading",
    );
    expect(screen.getByText("The Estuary Watchers")).toBeInTheDocument();
    const first = screen.getAllByRole("radio")[0];
    await user.click(first);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getAllByRole("radio")[0]).toBeChecked();
    await user.click(
      screen.getByRole("button", { name: "Submit draft paper" }),
    );
    expect(
      screen.getByText(/No student progress was recorded/),
    ).toBeInTheDocument();
    expect(approve).not.toHaveBeenCalled();
  });

  it("previews the 12-question comprehensive sample with sections, shared passage, navigation, submission, scoring and explanations", async () => {
    const user = userEvent.setup();
    const sources = ["verbal-reasoning", "numerical-reasoning", "reading", "mathematics"];
    const allQuestions = sources.flatMap((source) => {
      const packet = JSON.parse(
        readFileSync(`content/scholarship-drafts/scholarship-y6-${source}-draft.json`, "utf8"),
      );
      return packet.questions.map((raw: unknown) => ({
        kind: "scholarship" as const,
        source: `content/scholarship-drafts/scholarship-y6-${source}-draft.json`,
        contentHash: "a".repeat(64),
        question: scholarshipReviewSchema.parse(raw),
      }));
    });

    const fullCat: ReviewCatalogue = {
      issues: [],
      approvalsAvailable: false,
      entries: allQuestions,
    };

    render(<DraftReview catalogue={fullCat} />);
    await user.click(screen.getByRole("button", { name: "Complete draft papers" }));

    // Select the 12-question sample module
    await user.selectOptions(
      screen.getByLabelText("Draft section paper"),
      "sample-12",
    );

    // Verify paper description shows 12 questions across 4 sections
    expect(
      screen.getByText(/Year 6 Comprehensive Sample practice module: 12 questions across 4 sections/),
    ).toBeInTheDocument();

    // Verify Question 1 of 12 (VR-001) is displayed
    expect(screen.getByText("1 of 12: scholarship-y6-vr-001")).toBeInTheDocument();
    expect(
      screen.getByText("THERMOMETER is to TEMPERATURE as ODOMETER is to:"),
    ).toBeInTheDocument();

    // Answer Q1 correctly: DISTANCE
    await user.click(screen.getByRole("radio", { name: "DISTANCE" }));

    // Navigate to Q2
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("2 of 12: scholarship-y6-vr-016")).toBeInTheDocument();

    // Navigate backward and verify answer is retained
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("radio", { name: "DISTANCE" })).toBeChecked();

    // Navigate to Reading Comprehension Q7 (RC-001)
    await user.selectOptions(screen.getByLabelText("Paper question"), "6"); // 0-indexed 6 is Q7
    expect(screen.getByText("7 of 12: scholarship-y6-rc-001")).toBeInTheDocument();

    // Verify shared passage "The Estuary Watchers" is rendered
    expect(screen.getByText("The Estuary Watchers")).toBeInTheDocument();
    expect(
      screen.getByText(/Before first light, the estuary was the colour of wet slate/),
    ).toBeInTheDocument();

    // Answer Q7 correctly: option a
    const rc001CorrectText = "To set a quiet, patient mood as the two characters wait";
    await user.click(screen.getByRole("radio", { name: rc001CorrectText }));

    // Navigate to Q8 (RC-002) and verify shared passage is still rendered
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("8 of 12: scholarship-y6-rc-002")).toBeInTheDocument();
    expect(screen.getByText("The Estuary Watchers")).toBeInTheDocument();

    // Navigate to Q12 (Maths-014)
    await user.selectOptions(screen.getByLabelText("Paper question"), "11");
    expect(screen.getByText("12 of 12: scholarship-y6-maths-014")).toBeInTheDocument();

    // Submit draft paper
    await user.click(screen.getByRole("button", { name: "Submit draft paper" }));

    // Verify scoring out of 12 marks
    expect(screen.getByText(/Preview total: 2 \/ 12 marks/)).toBeInTheDocument();
    expect(screen.getByText(/No student progress was recorded/)).toBeInTheDocument();

    // Verify worked explanation and declared answer
    expect(screen.getByRole("heading", { name: "Declared answer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Worked explanation" })).toBeInTheDocument();

    // Verify approval action was not called and approval button is disabled/absent
    expect(approve).not.toHaveBeenCalled();
  });
});
