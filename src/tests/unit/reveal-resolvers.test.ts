import { describe, expect, it } from "vitest";

import {
  hasAnyElementCorrect,
  resolveBlankState,
  resolveBooleanOptionState,
  resolveDragDropItemState,
  resolveDropdownFieldState,
  resolveHotspotRegionState,
  resolveNumberEntryState,
  resolveOptionState,
  resolveOrderState,
  resolvePairState,
  resolveShortAnswerState,
  typeSupportsPartialCredit,
} from "@/features/exam-engine/question-renderers/reveal-resolvers";
import type { QuestionReveal } from "@/features/exam-engine/types";
import type { AnswerKey } from "@/schemas/question.schema";

function reveal(answerKey: AnswerKey): QuestionReveal {
  return { status: "incorrect", answerKey };
}

describe("resolveOptionState (single_option / multiple_options)", () => {
  const singleKey: AnswerKey = { kind: "single_option", optionId: "opt-a" };

  it("no reveal: chosen -> selected, unchosen -> idle", () => {
    expect(resolveOptionState(undefined, "opt-a", true)).toBe("selected");
    expect(resolveOptionState(undefined, "opt-b", false)).toBe("idle");
  });

  it("revealed: chosen+correct -> correct", () => {
    expect(resolveOptionState(reveal(singleKey), "opt-a", true)).toBe("correct");
  });

  it("revealed: chosen+incorrect -> incorrect", () => {
    expect(resolveOptionState(reveal(singleKey), "opt-b", true)).toBe("incorrect");
  });

  it("revealed: unchosen+correct -> missed", () => {
    expect(resolveOptionState(reveal(singleKey), "opt-a", false)).toBe("missed");
  });

  it("revealed: unchosen+incorrect -> idle", () => {
    expect(resolveOptionState(reveal(singleKey), "opt-c", false)).toBe("idle");
  });

  it("multiple_options: every chosen-correct id is 'correct'", () => {
    const key: AnswerKey = { kind: "multiple_options", optionIds: ["opt-a", "opt-c"] };
    expect(resolveOptionState(reveal(key), "opt-a", true)).toBe("correct");
    expect(resolveOptionState(reveal(key), "opt-b", true)).toBe("incorrect");
    expect(resolveOptionState(reveal(key), "opt-c", false)).toBe("missed");
  });
});

describe("resolveBooleanOptionState (true_false)", () => {
  const key: AnswerKey = { kind: "boolean", value: true };

  it("resolves the chosen-correct value as correct, the unchosen-correct value as missed", () => {
    expect(resolveBooleanOptionState(reveal(key), true, true)).toBe("correct");
    expect(resolveBooleanOptionState(reveal(key), false, true)).toBe("incorrect");
    expect(resolveBooleanOptionState(reveal(key), true, false)).toBe("missed");
  });
});

describe("resolveDropdownFieldState", () => {
  const key: AnswerKey = { kind: "dropdown", fields: [{ id: "f1", correctOptionId: "were" }] };

  it("correct/incorrect on the chosen option, missed on the whole control when left unanswered", () => {
    expect(resolveDropdownFieldState(reveal(key), "f1", "were")).toBe("correct");
    expect(resolveDropdownFieldState(reveal(key), "f1", "was")).toBe("incorrect");
    // "missed" styles the select control itself, not an unselected <option>
    // inside it — the renderer never tries to dashed-highlight a row inside
    // a closed dropdown, only the control as a whole.
    expect(resolveDropdownFieldState(reveal(key), "f1", undefined)).toBe("missed");
  });

  it("a field with no matching answer-key entry has no correct target, so it's idle rather than missed", () => {
    expect(resolveDropdownFieldState(reveal(key), "unknown-field", undefined)).toBe("idle");
  });
});

describe("resolveBlankState (fill_blank)", () => {
  const key: AnswerKey = {
    kind: "fill_blank",
    blanks: [{ id: "b1", acceptedAnswers: ["3", "three"] }],
    caseSensitive: false,
    trimWhitespace: true,
  };

  it("uses the exact same normaliseText rule the real scorer grades with (case/whitespace insensitive by default)", () => {
    expect(resolveBlankState(reveal(key), "b1", "Three")).toBe("correct");
    expect(resolveBlankState(reveal(key), "b1", "  3  ")).toBe("correct");
    expect(resolveBlankState(reveal(key), "b1", "four")).toBe("incorrect");
  });

  it("empty/whitespace-only submission is treated as unchosen, not incorrect", () => {
    expect(resolveBlankState(reveal(key), "b1", "")).toBe("idle");
    expect(resolveBlankState(reveal(key), "b1", "   ")).toBe("idle");
  });
});

describe("resolveNumberEntryState", () => {
  const key: AnswerKey = { kind: "number", value: 56, tolerance: 1 };

  it("uses the same tolerance formula scoreNumberEntry grades with", () => {
    expect(resolveNumberEntryState(reveal(key), 56)).toBe("correct");
    expect(resolveNumberEntryState(reveal(key), 57)).toBe("correct");
    expect(resolveNumberEntryState(reveal(key), 58)).toBe("incorrect");
    expect(resolveNumberEntryState(undefined, undefined)).toBe("idle");
  });
});

describe("resolveShortAnswerState", () => {
  const key: AnswerKey = { kind: "text", acceptableAnswers: ["leaves"], caseSensitive: false, trimWhitespace: true };

  it("correct/incorrect via normaliseText, same as scoreShortAnswer", () => {
    expect(resolveShortAnswerState(reveal(key), "Leaves")).toBe("correct");
    expect(resolveShortAnswerState(reveal(key), "leafs")).toBe("incorrect");
  });
});

describe("resolvePairState (matching / label_diagram)", () => {
  const key: AnswerKey = {
    kind: "matching",
    pairs: [
      { sourceId: "s1", targetId: "t1" },
      { sourceId: "s2", targetId: "t2" },
    ],
  };

  it("correct/incorrect/missed by source id", () => {
    expect(resolvePairState(reveal(key), "s1", "t1")).toBe("correct");
    expect(resolvePairState(reveal(key), "s1", "t2")).toBe("incorrect");
    expect(resolvePairState(reveal(key), "s2", undefined)).toBe("missed");
  });
});

describe("resolveOrderState (ordering)", () => {
  const key: AnswerKey = { kind: "ordering", optionIds: ["a", "b", "c"] };

  it("per-position correctness, no 'missed' concept", () => {
    expect(resolveOrderState(reveal(key), 0, "a")).toBe("correct");
    expect(resolveOrderState(reveal(key), 0, "b")).toBe("incorrect");
    expect(resolveOrderState(undefined, 0, "a")).toBe("idle");
  });
});

describe("resolveDragDropItemState", () => {
  const key: AnswerKey = { kind: "drag_drop", placements: { i1: "z1", i2: "z2" } };

  it("correct/incorrect/missed by item id", () => {
    expect(resolveDragDropItemState(reveal(key), "i1", "z1")).toBe("correct");
    expect(resolveDragDropItemState(reveal(key), "i1", "z2")).toBe("incorrect");
    expect(resolveDragDropItemState(reveal(key), "i2", undefined)).toBe("missed");
  });
});

describe("resolveHotspotRegionState", () => {
  const key: AnswerKey = { kind: "hotspot", regionIds: ["r1"] };

  it("correct/incorrect/missed by region id", () => {
    expect(resolveHotspotRegionState(reveal(key), "r1", true)).toBe("correct");
    expect(resolveHotspotRegionState(reveal(key), "r2", true)).toBe("incorrect");
    expect(resolveHotspotRegionState(reveal(key), "r1", false)).toBe("missed");
  });
});

describe("typeSupportsPartialCredit", () => {
  it("true for multi-element types, false for single-value types", () => {
    expect(typeSupportsPartialCredit("multiple_select")).toBe(true);
    expect(typeSupportsPartialCredit("fill_blank")).toBe(true);
    expect(typeSupportsPartialCredit("matching")).toBe(true);
    expect(typeSupportsPartialCredit("ordering")).toBe(true);
    expect(typeSupportsPartialCredit("drag_drop")).toBe(true);
    expect(typeSupportsPartialCredit("label_diagram")).toBe(true);
    expect(typeSupportsPartialCredit("multiple_choice")).toBe(false);
    expect(typeSupportsPartialCredit("number_entry")).toBe(false);
    expect(typeSupportsPartialCredit("essay")).toBe(false);
  });
});

describe("hasAnyElementCorrect — presentation-only, never touches scoring", () => {
  it("multiple_options: true when at least one chosen id is correct", () => {
    const key: AnswerKey = { kind: "multiple_options", optionIds: ["a", "c"] };
    expect(hasAnyElementCorrect(reveal(key), ["a", "b"])).toBe(true);
    expect(hasAnyElementCorrect(reveal(key), ["b", "d"])).toBe(false);
  });

  it("fill_blank: true when at least one blank matches, using normaliseText", () => {
    const key: AnswerKey = {
      kind: "fill_blank",
      blanks: [
        { id: "b1", acceptedAnswers: ["3"] },
        { id: "b2", acceptedAnswers: ["4"] },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    };
    expect(hasAnyElementCorrect(reveal(key), { b1: "3", b2: "9" })).toBe(true);
    expect(hasAnyElementCorrect(reveal(key), { b1: "9", b2: "9" })).toBe(false);
  });

  it("matching: true when at least one pair matches", () => {
    const key: AnswerKey = {
      kind: "matching",
      pairs: [
        { sourceId: "s1", targetId: "t1" },
        { sourceId: "s2", targetId: "t2" },
      ],
    };
    expect(hasAnyElementCorrect(reveal(key), { s1: "t1", s2: "wrong" })).toBe(true);
    expect(hasAnyElementCorrect(reveal(key), { s1: "wrong", s2: "wrong" })).toBe(false);
  });

  it("ordering: true when at least one position matches", () => {
    const key: AnswerKey = { kind: "ordering", optionIds: ["a", "b", "c"] };
    expect(hasAnyElementCorrect(reveal(key), ["a", "c", "b"])).toBe(true);
    expect(hasAnyElementCorrect(reveal(key), ["c", "a", "b"])).toBe(false);
  });

  it("drag_drop: true when at least one placement matches", () => {
    const key: AnswerKey = { kind: "drag_drop", placements: { i1: "z1", i2: "z2" } };
    expect(hasAnyElementCorrect(reveal(key), { i1: "z1", i2: "wrong" })).toBe(true);
    expect(hasAnyElementCorrect(reveal(key), { i1: "wrong", i2: "wrong" })).toBe(false);
  });

  it("false for an unanswered response", () => {
    const key: AnswerKey = { kind: "multiple_options", optionIds: ["a"] };
    expect(hasAnyElementCorrect(reveal(key), undefined)).toBe(false);
    expect(hasAnyElementCorrect(reveal(key), null)).toBe(false);
  });

  it("false for a single_option/single_option key — that type isn't partial-credit-eligible, never reached with a reveal in practice, but must fail closed rather than throw", () => {
    const key: AnswerKey = { kind: "single_option", optionId: "a" };
    expect(hasAnyElementCorrect(reveal(key), "a")).toBe(false);
  });
});
