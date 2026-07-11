import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { DragDropRenderer } from "@/features/exam-engine/question-renderers";
import { toCandidateQuestion } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

const ITEM_MIME_TYPE = "application/x-mindmosaic-item-id";

function find(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

/** A minimal DataTransfer stand-in — jsdom's is incomplete for drag/drop. */
function createDataTransfer(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries(entries));
  return {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? "",
    get types() {
      return [...store.keys()];
    },
  };
}

describe("DragDropRenderer external drag validation", () => {
  const question = find("showcase-drag-drop");
  const candidate = toCandidateQuestion(question);

  it("accepts a valid drag from this question's own item", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);

    const item = screen.getByText("4", { selector: "span" });
    const zone = screen.getByText("Even numbers", { selector: "p" }).closest("div")!;
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(item, { dataTransfer });
    fireEvent.drop(zone, { dataTransfer });

    expect(onChange).toHaveBeenCalledWith({ n4: "even" });
  });

  it("ignores arbitrary external text/plain and mutates nothing", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);

    const zone = screen.getByText("Even numbers", { selector: "p" }).closest("div")!;
    const dataTransfer = createDataTransfer({ "text/plain": "n4" });

    fireEvent.drop(zone, { dataTransfer });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a drop carrying an unknown item id", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);

    const zone = screen.getByText("Even numbers", { selector: "p" }).closest("div")!;
    const dataTransfer = createDataTransfer({
      [ITEM_MIME_TYPE]: `${question.id} not-a-real-item`,
    });

    fireEvent.drop(zone, { dataTransfer });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a drop carrying an item from a different question", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);

    const zone = screen.getByText("Even numbers", { selector: "p" }).closest("div")!;
    const dataTransfer = createDataTransfer({
      [ITEM_MIME_TYPE]: `some-other-question n4`,
    });

    fireEvent.drop(zone, { dataTransfer });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores a malformed payload with no separator", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);

    const zone = screen.getByText("Even numbers", { selector: "p" }).closest("div")!;
    const dataTransfer = createDataTransfer({ [ITEM_MIME_TYPE]: "garbage" });

    fireEvent.drop(zone, { dataTransfer });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves an already-placed item to a new zone without creating a duplicate entry", () => {
    /* Placed items are no longer draggable (only the "Items" pool is), so
       moving one between zones goes through the always-available
       keyboard/select fallback — this exercises place()'s single-key
       overwrite, the same code path a valid drag drop uses. */
    const onChange = vi.fn();
    render(
      <DragDropRenderer question={candidate} answer={{ n4: "odd" }} onAnswerChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("4"), { target: { value: "even" } });
    expect(onChange).toHaveBeenLastCalledWith({ n4: "even" });
    expect(Object.keys(onChange.mock.calls.at(-1)?.[0] ?? {})).toHaveLength(1);
  });

  it("keeps the accessible keyboard fallback working alongside drag validation", () => {
    const onChange = vi.fn();
    render(<DragDropRenderer question={candidate} onAnswerChange={onChange} />);
    fireEvent.change(screen.getByLabelText("7"), { target: { value: "odd" } });
    expect(onChange).toHaveBeenCalledWith({ n7: "odd" });
  });
});
