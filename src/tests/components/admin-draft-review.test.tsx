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
});
