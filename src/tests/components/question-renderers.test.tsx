import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import {
  DragDropRenderer,
  DropdownRenderer,
  EssayRenderer,
  FillBlankRenderer,
  HotspotRenderer,
  LabelDiagramRenderer,
  MatchingRenderer,
  MultipleChoiceRenderer,
  MultipleSelectRenderer,
  NumberEntryRenderer,
  OrderingRenderer,
  ReadingComprehensionRenderer,
  ShortAnswerRenderer,
  TrueFalseRenderer,
} from "@/features/exam-engine/question-renderers";
import { scoreOrdering } from "@/features/exam-engine/scoring";
import { toCandidateQuestion } from "@/features/exam-engine/types";
import type {
  CandidateAnswer,
  CandidateQuestion,
  QuestionRendererComponent,
} from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/** The full authoring question — only used where a test needs the answer
    key itself (scoring assertions), never passed to a renderer. */
function findAuthoring(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

/** What a renderer actually receives: the answer key stripped out. */
function find(id: string): CandidateQuestion {
  return toCandidateQuestion(findAuthoring(id));
}

function Harness({
  Renderer,
  question,
  initial,
  onChange,
}: {
  Renderer: QuestionRendererComponent;
  question: CandidateQuestion;
  initial?: CandidateAnswer;
  onChange?: (answer: CandidateAnswer) => void;
}) {
  const [answer, setAnswer] = useState<CandidateAnswer | undefined>(initial);
  return (
    <Renderer
      question={question}
      answer={answer}
      onAnswerChange={(value) => {
        onChange?.(value);
        setAnswer(value);
      }}
    />
  );
}

describe("MultipleChoiceRenderer", () => {
  const q = find("showcase-multiple-choice");
  it("renders the prompt and reports the chosen option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={MultipleChoiceRenderer} question={q} onChange={onChange} />);
    expect(screen.getByText("Which number is closest to 50?")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "48" }));
    expect(onChange).toHaveBeenCalledWith("n48");
  });
  it("restores the current answer", () => {
    render(<MultipleChoiceRenderer question={q} answer="n48" />);
    expect(screen.getByRole("radio", { name: "48" })).toBeChecked();
  });
});

describe("MultipleSelectRenderer", () => {
  const q = find("showcase-multiple-select");
  it("toggles checkboxes and reports an array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Harness Renderer={MultipleSelectRenderer} question={q} initial={["n12"]} onChange={onChange} />,
    );
    expect(screen.getByRole("checkbox", { name: "12" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "20" }));
    expect(onChange).toHaveBeenLastCalledWith(["n12", "n20"]);
  });
});

describe("NumberEntryRenderer", () => {
  const q = find("showcase-number-entry");
  it("reports a numeric answer", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={NumberEntryRenderer} question={q} onChange={onChange} />);
    await user.type(screen.getByLabelText(/multiplied by 6/i), "42");
    expect(onChange).toHaveBeenLastCalledWith(42);
  });
});

describe("FillBlankRenderer", () => {
  const q = find("showcase-fill-blank");
  it("labels each blank and reports responses", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={FillBlankRenderer} question={q} onChange={onChange} />);
    await user.type(screen.getByLabelText("Number of triangle sides"), "3");
    expect(onChange).toHaveBeenLastCalledWith({ triangle: "3" });
  });

  it("removes the blank entirely when cleared back to empty, rather than leaving an empty string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={FillBlankRenderer} question={q} onChange={onChange} />);
    const input = screen.getByLabelText("Number of triangle sides");
    await user.type(input, "3");
    expect(onChange).toHaveBeenLastCalledWith({ triangle: "3" });
    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("treats a whitespace-only entry the same as cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={FillBlankRenderer} question={q} onChange={onChange} />);
    await user.type(screen.getByLabelText("Number of triangle sides"), "   ");
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("keeps a different blank's answer when one blank is cleared (partial attempt)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={FillBlankRenderer} question={q} onChange={onChange} />);
    await user.type(screen.getByLabelText("Number of triangle sides"), "3");
    await user.type(screen.getByLabelText("Number of hexagon sides"), "six");
    expect(onChange).toHaveBeenLastCalledWith({ triangle: "3", hexagon: "six" });
    await user.clear(screen.getByLabelText("Number of triangle sides"));
    expect(onChange).toHaveBeenLastCalledWith({ hexagon: "six" });
  });

  it("persists cleared state across navigation (re-render with the cleared answer)", () => {
    const { rerender } = render(
      <FillBlankRenderer question={q} answer={{ triangle: "3" }} />,
    );
    expect(screen.getByLabelText("Number of triangle sides")).toHaveValue("3");
    rerender(<FillBlankRenderer question={q} answer={{}} />);
    expect(screen.getByLabelText("Number of triangle sides")).toHaveValue("");
  });
});

describe("DropdownRenderer", () => {
  const q = find("showcase-dropdown");
  it("selects a value per field", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={DropdownRenderer} question={q} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText(/3 . 4 = 12/), "mult");
    expect(onChange).toHaveBeenLastCalledWith({ "sentence-a": "mult" });
  });
});

describe("TrueFalseRenderer", () => {
  const q = find("showcase-true-false");
  it("reports the boolean choice", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={TrueFalseRenderer} question={q} onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "True" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("MatchingRenderer", () => {
  const q = find("showcase-matching");
  it("uses a labelled select per source", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={MatchingRenderer} question={q} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Frog"), "amphibian");
    expect(onChange).toHaveBeenLastCalledWith({ frog: "amphibian" });
  });
});

describe("OrderingRenderer", () => {
  const authoring = findAuthoring("showcase-ordering");
  const q = find("showcase-ordering");
  const idToText: Record<string, string> = { n42: "42", n7: "7", n88: "88", n19: "19" };
  const correctOrder =
    authoring.answerKey.kind === "ordering" ? authoring.answerKey.optionIds : [];

  /* Displayed order, read from the "Move X up" button labels in DOM order. */
  function displayedOrder(): string[] {
    return screen
      .getAllByRole("button", { name: /^Move .+ up$/ })
      .map((button) => button.getAttribute("aria-label")?.replace(/^Move | up$/g, "") ?? "");
  }

  /* Authored item order is [n42, n7, n88, n19]; the answer key order is
     [n7, n19, n42, n88]. The deterministic initial order rotates the
     authored order by one: [n7, n88, n19, n42] — matching neither. */
  const expectedInitialOrder = ["n7", "n88", "n19", "n42"].map((id) => idToText[id]);

  it("starts in a deterministic order that is not the correct answer", () => {
    render(<OrderingRenderer question={q} />);
    expect(displayedOrder()).not.toEqual(correctOrder.map((id) => idToText[id]));
  });

  it("renders the fixed-vector initial order for a known question id", () => {
    render(<OrderingRenderer question={q} />);
    expect(displayedOrder()).toEqual(expectedInitialOrder);
  });

  it("keeps the same initial order across a re-render (navigation)", () => {
    const { rerender } = render(<OrderingRenderer question={q} />);
    const before = displayedOrder();
    rerender(<OrderingRenderer question={q} />);
    expect(displayedOrder()).toEqual(before);
  });

  it("reorders with keyboard-accessible buttons", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={OrderingRenderer} question={q} onChange={onChange} />);
    /* Initial order is [n7, n88, n19, n42]; moving "42" up swaps it with "19". */
    await user.click(screen.getByRole("button", { name: "Move 42 up" }));
    expect(onChange).toHaveBeenLastCalledWith(["n7", "n88", "n42", "n19"]);
  });

  it("scores as unanswered until the learner moves an item", () => {
    expect(scoreOrdering(authoring, undefined).status).toBe("unanswered");
  });

  it("restores and scores the correct order once explicitly set", () => {
    render(<OrderingRenderer question={q} answer={correctOrder} />);
    expect(displayedOrder()).toEqual(correctOrder.map((id) => idToText[id]));
    expect(scoreOrdering(authoring, correctOrder).status).toBe("correct");
  });
});

describe("ShortAnswerRenderer", () => {
  const q = find("showcase-short-answer");
  it("reports typed text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={ShortAnswerRenderer} question={q} onChange={onChange} />);
    await user.type(screen.getByLabelText(/distance all the way around/i), "perimeter");
    expect(onChange).toHaveBeenLastCalledWith("perimeter");
  });
});

describe("ReadingComprehensionRenderer", () => {
  const q = find("showcase-reading-mcq");
  it("associates the question with the passage", () => {
    render(<ReadingComprehensionRenderer question={q} />);
    expect(screen.getByRole("region", { name: /Mia's Garden/ })).toBeInTheDocument();
    expect(screen.getByText(/Mia planted bean seeds/)).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /grow into strong plants/i }),
    ).toBeInTheDocument();
  });
});

describe("EssayRenderer", () => {
  const q = find("showcase-essay");
  it("shows a live word count and manual-review notice", async () => {
    const user = userEvent.setup();
    render(<Harness Renderer={EssayRenderer} question={q} initial="" />);
    expect(screen.getByText("0 words")).toBeInTheDocument();
    expect(screen.getByText(/Marked by a teacher/i)).toBeInTheDocument();
    await user.type(screen.getByRole("textbox"), "one two three");
    expect(screen.getByText("3 words")).toBeInTheDocument();
  });
});

describe("LabelDiagramRenderer", () => {
  const q = find("showcase-label-diagram");
  it("renders the diagram and a select per label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={LabelDiagramRenderer} question={q} onChange={onChange} />);
    expect(screen.getByRole("img", { name: /Parts of a plant/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Leaf"), "top");
    expect(onChange).toHaveBeenLastCalledWith({ leaf: "top" });
  });
});

describe("HotspotRenderer", () => {
  const q = find("showcase-hotspot");
  it("exposes keyboard-focusable region checkboxes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={HotspotRenderer} question={q} onChange={onChange} />);
    const region = screen.getByRole("checkbox", { name: "Large circle" });
    expect(region).toBeInTheDocument();
    await user.click(region);
    expect(onChange).toHaveBeenLastCalledWith(["large"]);
  });
});

describe("DragDropRenderer", () => {
  const q = find("showcase-drag-drop");
  it("provides an accessible placement menu fallback", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={DragDropRenderer} question={q} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("4"), "even");
    expect(onChange).toHaveBeenLastCalledWith({ n4: "even" });
  });
});
