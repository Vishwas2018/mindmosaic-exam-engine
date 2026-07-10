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
import type { QuestionRendererComponent } from "@/features/exam-engine/types";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

function find(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

function Harness({
  Renderer,
  question,
  initial,
  onChange,
}: {
  Renderer: QuestionRendererComponent;
  question: Question;
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
  const q = find("showcase-ordering");
  it("reorders with keyboard-accessible buttons", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness Renderer={OrderingRenderer} question={q} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Move 42 down" }));
    expect(onChange).toHaveBeenLastCalledWith(["n7", "n42", "n88", "n19"]);
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
