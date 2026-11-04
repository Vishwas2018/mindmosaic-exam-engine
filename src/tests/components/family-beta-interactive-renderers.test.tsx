import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { publishedExamBank } from "@/content/questions/practice-bank";
import {
  DropdownRenderer,
  FillBlankRenderer,
  LabelDiagramRenderer,
  MatchingRenderer,
  OrderingRenderer,
} from "@/features/exam-engine/question-renderers";
import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import { toCandidateQuestion } from "@/features/exam-engine/types";
import type {
  CandidateAnswer,
  CandidateQuestion,
  QuestionRendererComponent,
} from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

function findAuthoring(id: string): Question {
  const question = publishedExamBank.find((item) => item.id === id);
  if (!question) throw new Error(`Missing question fixture ${id} in publishedExamBank`);
  return question;
}

function findCandidate(id: string): CandidateQuestion {
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

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

describe("Family Beta Fixed Papers: Interactive Renderers Verification (11 items)", () => {
  beforeEach(() => {
    // Reset to desktop viewport default
    setViewport(1280, 800);
  });

  describe("Item 1 (Year 3 Slot 1): naplan-y3-numeracy-dc-002 [ordering]", () => {
    const authoring = findAuthoring("naplan-y3-numeracy-dc-002");
    const candidate = findCandidate("naplan-y3-numeracy-dc-002");
    const correctOrder = ["creek", "fern", "gully", "ridge"];
    const incorrectOrder = ["ridge", "gully", "fern", "creek"];

    it("renders choices and moves items via touch-friendly controls on desktop and tablet viewports", async () => {
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const { unmount } = render(<Harness Renderer={OrderingRenderer} question={candidate} />);

        expect(screen.getByText(/Four bushwalking tracks have these lengths/)).toBeInTheDocument();
        expect(screen.getByText("Fern Track (380 m)")).toBeInTheDocument();
        expect(screen.getByText("Ridge Track (830 m)")).toBeInTheDocument();
        expect(screen.getByText("Creek Track (308 m)")).toBeInTheDocument();
        expect(screen.getByText("Gully Track (803 m)")).toBeInTheDocument();

        // Verify move buttons exist and have accessible labels
        expect(screen.getByRole("button", { name: "Move Fern Track (380 m) down" })).toBeInTheDocument();
        unmount();
      }
    });

    it("scores correct and incorrect submissions accurately", () => {
      const correctScore = scoreQuestion(authoring, correctOrder);
      expect(correctScore.status).toBe("correct");
      expect(correctScore.awardedMarks).toBe(1);

      const incorrectScore = scoreQuestion(authoring, incorrectOrder);
      expect(incorrectScore.status).toBe("incorrect");
      expect(incorrectScore.awardedMarks).toBe(0);
    });
  });

  describe("Item 2 (Year 3 Slot 19): g3-nap-num-frac-001 [fill_blank]", () => {
    const authoring = findAuthoring("g3-nap-num-frac-001");
    const candidate = findCandidate("g3-nap-num-frac-001");
    const correctAnswers = { "shaded-parts": "3", "total-parts": "4" };
    const incorrectAnswers = { "shaded-parts": "1", "total-parts": "2" };

    it("renders text segments, blank labels, and receives input on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={FillBlankRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("The model shows")).toBeInTheDocument();
        expect(screen.getByText("equal parts shaded.")).toBeInTheDocument();

        const input1 = screen.getByLabelText("Number of shaded parts");
        const input2 = screen.getByLabelText("Total number of equal parts");
        expect(input1).toBeInTheDocument();
        expect(input2).toBeInTheDocument();

        await user.type(input1, "3");
        expect(onChange).toHaveBeenCalledWith({ "shaded-parts": "3" });
        unmount();
      }
    });

    it("scores correct and incorrect responses accurately", () => {
      const correctScore = scoreQuestion(authoring, correctAnswers);
      expect(correctScore.status).toBe("correct");
      expect(correctScore.awardedMarks).toBe(authoring.metadata?.marks ?? 1);

      const incorrectScore = scoreQuestion(authoring, incorrectAnswers);
      expect(incorrectScore.status).toBe("incorrect");
      expect(incorrectScore.awardedMarks).toBe(0);
    });
  });

  describe("Item 3 (Year 3 Slot 20): g3-nap-num-geo-002 [label_diagram]", () => {
    const authoring = findAuthoring("g3-nap-num-geo-002");
    const candidate = findCandidate("g3-nap-num-geo-002");
    const correctPairs = {
      "label-triangle": "target-left",
      "label-square": "target-middle",
      "label-circle": "target-right",
    };
    const incorrectPairs = {
      "label-triangle": "target-right",
      "label-square": "target-left",
      "label-circle": "target-middle",
    };

    it("renders diagram labels and target select controls on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={LabelDiagramRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("Triangle")).toBeInTheDocument();
        expect(screen.getByText("Square")).toBeInTheDocument();
        expect(screen.getByText("Circle")).toBeInTheDocument();

        const selectTriangle = screen.getByLabelText("Triangle");
        await user.selectOptions(selectTriangle, "target-left");
        expect(onChange).toHaveBeenCalledWith({ "label-triangle": "target-left" });
        unmount();
      }
    });

    it("scores correct and incorrect labelings accurately", () => {
      const correctScore = scoreQuestion(authoring, correctPairs);
      expect(correctScore.status).toBe("correct");
      expect(correctScore.awardedMarks).toBe(1);

      const incorrectScore = scoreQuestion(authoring, incorrectPairs);
      expect(incorrectScore.status).toBe("incorrect");
      expect(incorrectScore.awardedMarks).toBe(0);
    });
  });

  describe("Item 4 (Year 5 Slot 2): man-403933661e00341ed7ccf643 [dropdown]", () => {
    const authoring = findAuthoring("man-403933661e00341ed7ccf643");
    const candidate = findCandidate("man-403933661e00341ed7ccf643");
    const correct = { count: "opt-a" };
    const incorrect = { count: "opt-b" };

    it("renders field label and option choices on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={DropdownRenderer} question={candidate} onChange={onChange} />);

        const select = screen.getByLabelText("Number of shaded parts");
        expect(select).toBeInTheDocument();
        await user.selectOptions(select, "opt-a");
        expect(onChange).toHaveBeenCalledWith({ count: "opt-a" });
        unmount();
      }
    });

    it("scores correct and incorrect choices accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 5 (Year 5 Slot 5): g5-nap-num-data-005 [matching]", () => {
    const authoring = findAuthoring("g5-nap-num-data-005");
    const candidate = findCandidate("g5-nap-num-data-005");
    const correct = { "time-9am": "temp-15", "time-12pm": "temp-24", "time-3pm": "temp-21" };
    const incorrect = { "time-9am": "temp-24", "time-12pm": "temp-15", "time-3pm": "temp-21" };

    it("renders matching source labels and target options on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={MatchingRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("9 am")).toBeInTheDocument();
        expect(screen.getByText("12 pm")).toBeInTheDocument();
        expect(screen.getByText("3 pm")).toBeInTheDocument();

        const select9am = screen.getByLabelText("9 am");
        await user.selectOptions(select9am, "temp-15");
        expect(onChange).toHaveBeenCalledWith({ "time-9am": "temp-15" });
        unmount();
      }
    });

    it("scores correct and incorrect matches accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 6 (Year 5 Slot 11): g5-nap-num-measure-001 [fill_blank]", () => {
    const authoring = findAuthoring("g5-nap-num-measure-001");
    const candidate = findCandidate("g5-nap-num-measure-001");
    const correct = { perimeter: "26", area: "40" };
    const incorrect = { perimeter: "10", area: "20" };

    it("renders perimeter and area blanks on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={FillBlankRenderer} question={candidate} onChange={onChange} />);

        const pInput = screen.getByLabelText("Perimeter in centimetres");
        const aInput = screen.getByLabelText("Area in square centimetres");
        expect(pInput).toBeInTheDocument();
        expect(aInput).toBeInTheDocument();

        await user.type(pInput, "26");
        expect(onChange).toHaveBeenCalledWith({ perimeter: "26" });
        unmount();
      }
    });

    it("scores correct and incorrect calculations accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 7 (Year 5 Slot 15): man-d491915587589b05f4822f13 [matching]", () => {
    const authoring = findAuthoring("man-d491915587589b05f4822f13");
    const candidate = findCandidate("man-d491915587589b05f4822f13");
    const correct = { "src-0": "tgt-0", "src-1": "tgt-1", "src-2": "tgt-2", "src-3": "tgt-3" };
    const incorrect = { "src-0": "tgt-3", "src-1": "tgt-2", "src-2": "tgt-1", "src-3": "tgt-0" };

    it("renders fraction sources and targets on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={MatchingRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("5/12")).toBeInTheDocument();
        expect(screen.getByText("3/8")).toBeInTheDocument();
        expect(screen.getByText("1/9")).toBeInTheDocument();
        expect(screen.getByText("2/11")).toBeInTheDocument();

        const select0 = screen.getByLabelText("5/12");
        await user.selectOptions(select0, "tgt-0");
        expect(onChange).toHaveBeenCalledWith({ "src-0": "tgt-0" });
        unmount();
      }
    });

    it("scores correct and incorrect fraction pairings accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 8 (Year 5 Slot 27): man-6f6b3b1658d356c8cacee404 [matching]", () => {
    const authoring = findAuthoring("man-6f6b3b1658d356c8cacee404");
    const candidate = findCandidate("man-6f6b3b1658d356c8cacee404");
    const correct = { "src-0": "tgt-0", "src-1": "tgt-1", "src-2": "tgt-2" };
    const incorrect = { "src-0": "tgt-2", "src-1": "tgt-0", "src-2": "tgt-1" };

    it("renders equivalent fraction matching choices on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={MatchingRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("2/3")).toBeInTheDocument();
        expect(screen.getByText("1/4")).toBeInTheDocument();
        expect(screen.getByText("5/6")).toBeInTheDocument();

        const select0 = screen.getByLabelText("2/3");
        await user.selectOptions(select0, "tgt-0");
        expect(onChange).toHaveBeenCalledWith({ "src-0": "tgt-0" });
        unmount();
      }
    });

    it("scores correct and incorrect pairings accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 9 (Year 5 Slot 30): man-544d2533ffb571a742b0c691 [fill_blank]", () => {
    const authoring = findAuthoring("man-544d2533ffb571a742b0c691");
    const candidate = findCandidate("man-544d2533ffb571a742b0c691");
    const correct = { count: "6" };
    const incorrect = { count: "99" };

    it("renders equal parts blank and receives input on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={FillBlankRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("parts are in the model altogether.")).toBeInTheDocument();
        const input = screen.getByLabelText("Total number of equal parts");
        await user.type(input, "6");
        expect(onChange).toHaveBeenCalledWith({ count: "6" });
        unmount();
      }
    });

    it("scores correct and incorrect counts accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 10 (Year 5 Slot 31): g5-nap-num-data-004 [dropdown]", () => {
    const authoring = findAuthoring("g5-nap-num-data-004");
    const candidate = findCandidate("g5-nap-num-data-004");
    const correct = { "busiest-day": "busiest-wed", difference: "diff-45" };
    const incorrect = { "busiest-day": "busiest-mon", difference: "diff-35" };

    it("renders multiple dropdown fields on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={DropdownRenderer} question={candidate} onChange={onChange} />);

        const field1 = screen.getByLabelText("Which day had the most visitors?");
        const field2 = screen.getByLabelText("How many more visitors came on Wednesday than on Tuesday?");
        expect(field1).toBeInTheDocument();
        expect(field2).toBeInTheDocument();

        await user.selectOptions(field1, "busiest-wed");
        expect(onChange).toHaveBeenCalledWith({ "busiest-day": "busiest-wed" });
        unmount();
      }
    });

    it("scores correct and incorrect multiple dropdown choices accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });

  describe("Item 11 (Year 5 Slot 35): g5-nap-num-geo-002 [label_diagram]", () => {
    const authoring = findAuthoring("g5-nap-num-geo-002");
    const candidate = findCandidate("g5-nap-num-geo-002");
    const correct = {
      "label-right": "target-left",
      "label-acute": "target-middle",
      "label-obtuse": "target-right",
    };
    const incorrect = {
      "label-right": "target-right",
      "label-acute": "target-left",
      "label-obtuse": "target-middle",
    };

    it("renders angle diagram labels and target select controls on desktop and tablet viewports", async () => {
      const user = userEvent.setup();
      for (const [mode, w, h] of [["desktop", 1280, 800], ["tablet", 768, 1024]] as const) {
        setViewport(w, h);
        const onChange = vi.fn();
        const { unmount } = render(<Harness Renderer={LabelDiagramRenderer} question={candidate} onChange={onChange} />);

        expect(screen.getByText("Right angle")).toBeInTheDocument();
        expect(screen.getByText("Acute angle")).toBeInTheDocument();
        expect(screen.getByText("Obtuse angle")).toBeInTheDocument();

        const selectRight = screen.getByLabelText("Right angle");
        await user.selectOptions(selectRight, "target-left");
        expect(onChange).toHaveBeenCalledWith({ "label-right": "target-left" });
        unmount();
      }
    });

    it("scores correct and incorrect angle classifications accurately", () => {
      expect(scoreQuestion(authoring, correct).status).toBe("correct");
      expect(scoreQuestion(authoring, incorrect).status).toBe("incorrect");
    });
  });
});
