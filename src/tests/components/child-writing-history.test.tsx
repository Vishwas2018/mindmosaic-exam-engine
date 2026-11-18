import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  ChildWritingHistory,
  type WritingPromptItem,
  type WritingSubmissionItem,
} from "@/features/parent-dashboard";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
};

const sampleSubmissions: WritingSubmissionItem[] = [
  {
    id: "sub-1",
    taskId: "the-lost-key",
    taskTitle: "Narrative Writing — The Lost Key",
    genre: "narrative",
    submittedAt: "Yesterday at 4:15 pm",
    status: "pending_parent_review",
  },
  {
    id: "sub-2",
    taskId: "school-uniforms",
    taskTitle: "Persuasive Writing — School Uniforms",
    genre: "persuasive",
    submittedAt: "3 Nov 2026",
    status: "marked",
    marksEarned: 38,
    marksAvailable: 48,
  },
];

const samplePrompts: WritingPromptItem[] = [
  {
    id: "prompt-1",
    title: "The Mystery Box",
    genre: "narrative",
    prompt:
      "Imagine you found an old wooden box hidden at the back of a cupboard. Write a narrative about what was inside and what happened next.",
  },
  {
    id: "prompt-2",
    title: "Weekend Homework",
    genre: "persuasive",
    prompt:
      "Should primary students have homework on weekends? Write a persuasive text giving your reasons and convincing the reader.",
  },
];

describe("ChildWritingHistory Component", () => {
  it("renders heading and subtitle for child writing", () => {
    render(
      <ChildWritingHistory
        child={mockChild}
        submissions={sampleSubmissions}
        availablePrompts={samplePrompts}
        isLocalPreview={true}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Aisha’s Writing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
  });

  it("renders pending submissions awaiting parent review with mark action", () => {
    render(
      <ChildWritingHistory
        child={mockChild}
        submissions={sampleSubmissions}
        availablePrompts={samplePrompts}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Awaiting your marking" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 task")).toBeInTheDocument();
    expect(screen.getByText("Narrative Writing — The Lost Key")).toBeInTheDocument();
    expect(screen.getByText("Needs your review")).toBeInTheDocument();

    const markLink = screen.getByRole("link", { name: /Mark with rubric →/i });
    expect(markLink).toHaveAttribute("href", "/writing/mark/sub-1");
  });

  it("renders previously marked writing with scores", () => {
    render(
      <ChildWritingHistory
        child={mockChild}
        submissions={sampleSubmissions}
        availablePrompts={samplePrompts}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Previously marked writing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Persuasive Writing — School Uniforms")).toBeInTheDocument();
    expect(screen.getByText("38 of 48 marks")).toBeInTheDocument();
    expect(screen.getByText("Marked")).toBeInTheDocument();
  });

  it("renders approved writing prompts list", () => {
    render(
      <ChildWritingHistory
        child={mockChild}
        submissions={sampleSubmissions}
        availablePrompts={samplePrompts}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Approved writing prompts at Year 3" }),
    ).toBeInTheDocument();
    expect(screen.getByText("The Mystery Box")).toBeInTheDocument();
    expect(screen.getByText("Weekend Homework")).toBeInTheDocument();
  });
});
