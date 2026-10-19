import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { toCandidateQuestion } from "@/features/exam-engine/types/candidate-question";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import type { Question } from "@/schemas/question.schema";

const mockQuestion: Question = {
  id: "scholarship-y6-vr-001",
  type: "multiple_choice",
  yearLevel: 6,
  examStyle: "scholarship_style",
  status: "published",
  origin: "original_seed",
  prompt: "SOLAR is to SUN as LUNAR is to:",
  options: [
    { id: "a", text: "EARTH" },
    { id: "b", text: "STAR" },
    { id: "c", text: "PLANET" },
    { id: "d", text: "COMET" },
    { id: "e", text: "MOON" },
  ],
  visuals: [],
  answerKey: {
    kind: "single_option",
    optionId: "e",
  },
  explanation: "Solar relates to the Sun, while lunar relates to the Moon.",
  metadata: {
    subject: "verbal_reasoning",
    strand: "Verbal Reasoning",
    topic: "Verbal Reasoning",
    skill: "vr-analogies",
    difficulty: "medium",
    marks: 1,
    estimatedTimeSeconds: 40,
    tags: ["scholarship"],
    locale: "en-AU",
    source: "original",
    schemaVersion: 1,
  },
};

describe("Confidence Mode", () => {
  it("omits explanation from candidate question in standard (timed) mode", () => {
    const candidate = toCandidateQuestion(mockQuestion);
    expect(candidate.explanation).toBeUndefined();
    expect("explanation" in candidate).toBe(false);
  });

  it("includes explanation in candidate question when confidenceMode is true", () => {
    const candidate = toCandidateQuestion(mockQuestion, { confidenceMode: true });
    expect(candidate.explanation).toBe(mockQuestion.explanation);
  });

  it("renders explanation in ExamQuestion only after answering in Confidence Mode", () => {
    const candidate = toCandidateQuestion(mockQuestion, { confidenceMode: true });

    // Unanswered: explanation should not be visible yet
    const { rerender } = render(
      React.createElement(ExamQuestion, {
        question: candidate,
        answer: undefined,
        onAnswerChange: () => {},
      }),
    );
    expect(screen.queryByText(/Explanation/i)).toBeNull();

    // Answered: explanation panel should appear
    rerender(
      React.createElement(ExamQuestion, {
        question: candidate,
        answer: "e",
        onAnswerChange: () => {},
      }),
    );
    expect(screen.getByText(/Explanation/i)).toBeDefined();
    expect(
      screen.getByText("Solar relates to the Sun, while lunar relates to the Moon."),
    ).toBeDefined();
  });
});
