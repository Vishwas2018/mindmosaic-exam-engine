import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { ExamQuestion } from "@/features/exam-engine/components";
import { toCandidateQuestion } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * ExamQuestion (the shell) and the question-type renderers must never
 * both render the same stimulus or visual — see the ownership comment in
 * ExamQuestion.tsx. These are DOM-count assertions rather than snapshot
 * tests specifically so a regression (either side re-adding its own copy)
 * fails loudly.
 */
function find(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

function findInBank(id: string): Question {
  const question = questionBank.find((item) => item.id === id);
  if (!question) throw new Error(`Missing production question ${id}`);
  return question;
}

describe("ExamQuestion rendering ownership", () => {
  it("renders a reading-comprehension passage exactly once", () => {
    const question = find("showcase-reading-mcq");
    render(<ExamQuestion question={toCandidateQuestion(question)} />);
    expect(screen.getAllByText(/Mia planted bean seeds/)).toHaveLength(1);
    expect(
      screen.getAllByRole("region", { name: /Mia's Garden/ }),
    ).toHaveLength(1);
  });

  it("renders a label-diagram visual exactly once", () => {
    const question = find("showcase-label-diagram");
    const { container } = render(
      <ExamQuestion question={toCandidateQuestion(question)} />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(screen.getAllByRole("img", { name: /Parts of a plant/i })).toHaveLength(1);
  });

  it("renders a hotspot visual exactly once", () => {
    const question = find("showcase-hotspot");
    const { container } = render(
      <ExamQuestion question={toCandidateQuestion(question)} />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("renders an ordinary question's visual exactly once", () => {
    const question = findInBank("g3-nap-num-data-001");
    expect(question.visuals.length).toBeGreaterThan(0);
    const { container } = render(
      <ExamQuestion question={toCandidateQuestion(question)} />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(question.visuals.length);
  });

  it("renders the prompt and instructions exactly once", () => {
    const question = find("showcase-fill-blank");
    render(<ExamQuestion question={toCandidateQuestion(question)} />);
    expect(screen.getAllByText(question.prompt)).toHaveLength(1);
  });
});
