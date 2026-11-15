import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Each read path of the server wrapper, with the bank and the evidence report
 * faked. The rule under test: a SUCCESSFUL read that returns zero is "no
 * content available" (`none`); any error path (a throw, an integrity problem,
 * missing evidence) is "couldn't check" (`unknown`).
 */
const state = vi.hoisted(() => ({
  bank: [] as unknown[],
  problems: [] as string[],
  throwFrom: null as null | "bank" | "evidence",
}));

vi.mock("@/server/exam-bank", () => ({
  getPatternReadiness: () => ({}),
  isPublicationGateEnforced: () => false,
  getExamBank: () => {
    if (state.throwFrom === "bank") throw new Error("boom");
    return state.bank;
  },
}));
vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: () => {
    if (state.throwFrom === "evidence") throw new Error("evidence missing");
    return { problems: state.problems, approvals: new Map() };
  },
}));

import { getStudioAvailability } from "@/server/practice-studio-availability";

function numeracyQuestion(i: number) {
  return {
    id: `n-${i}`,
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: `Prompt ${i}`,
    options: [],
    visuals: [],
    metadata: { subject: "numeracy", strand: "Number", estimatedTimeSeconds: 60 },
  };
}

const cell = () =>
  getStudioAvailability().subjects.find((s) => s.yearLevel === 3 && s.examStyle === "naplan_style" && s.subject === "numeracy")!;

beforeEach(() => {
  state.bank = [];
  state.problems = [];
  state.throwFrom = null;
});

describe("getStudioAvailability read paths", () => {
  it("successful read with content: ready", () => {
    state.bank = Array.from({ length: 6 }, (_, i) => numeracyQuestion(i));
    expect(getStudioAvailability().integrity).toBe("ok");
    expect(cell().state).toBe("ready");
  });

  it("successful read that returns zero: no content available, not couldn't check", () => {
    const result = getStudioAvailability();
    expect(result.integrity).toBe("ok");
    expect(cell()).toMatchObject({ state: "none", reason: "no_content", uniqueQuestions: 0 });
  });

  it("integrity problem: couldn't check, even though the served bank is then empty", () => {
    state.problems = ["manifest mismatch"];
    expect(getStudioAvailability().integrity).toBe("unknown");
    expect(cell()).toMatchObject({ state: "unknown", uniqueQuestions: null, strands: [] });
  });

  it("evidence read throws: couldn't check", () => {
    state.throwFrom = "evidence";
    state.bank = Array.from({ length: 6 }, (_, i) => numeracyQuestion(i));
    expect(cell()).toMatchObject({ state: "unknown", uniqueQuestions: null });
  });

  it("bank read throws: couldn't check", () => {
    state.throwFrom = "bank";
    expect(cell()).toMatchObject({ state: "unknown", uniqueQuestions: null });
  });

  it("only ever surfaces Year 3 and Year 5", () => {
    state.bank = Array.from({ length: 6 }, (_, i) => numeracyQuestion(i));
    const years = new Set(getStudioAvailability().subjects.map((s) => s.yearLevel));
    expect([...years].sort()).toEqual([3, 5]);
  });
});
