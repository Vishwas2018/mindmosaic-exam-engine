import { describe, expect, it } from "vitest";

import {
  STRAND_FLOOR,
  aboutMinutes,
  buildStudioAvailability,
  medianOf,
  offeredSetSizes,
  strandKey,
  type StudioProgramme,
} from "@/features/practice-studio/availability";
import type { Question } from "@/schemas/question.schema";

let counter = 0;
function q(over: {
  id?: string;
  yearLevel?: 3 | 5;
  examStyle?: "naplan_style" | "icas_style" | "amc_style";
  subject?: string;
  strand?: string;
  prompt?: string;
  stimulus?: string;
  seconds?: number;
  options?: string[];
}): Question {
  counter += 1;
  return {
    id: over.id ?? `t-${counter}`,
    yearLevel: over.yearLevel ?? 3,
    examStyle: over.examStyle ?? "naplan_style",
    prompt: over.prompt ?? `Unique prompt ${counter}`,
    stimulus: over.stimulus ? { body: over.stimulus, attribution: "MindMosaic original" } : undefined,
    options: (over.options ?? []).map((text, i) => ({ id: `o${i}`, text })),
    visuals: [],
    metadata: {
      subject: over.subject ?? "numeracy",
      strand: over.strand ?? "Number",
      estimatedTimeSeconds: over.seconds ?? 60,
    },
  } as unknown as Question;
}

function many(n: number, over: Parameters<typeof q>[0] = {}): Question[] {
  return Array.from({ length: n }, () => q(over));
}

const live = (over: Partial<StudioProgramme> = {}): StudioProgramme => ({
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  status: "live",
  ...over,
});

const build = (bank: Question[], programmes: StudioProgramme[], integrity: "ok" | "unknown" = "ok") =>
  buildStudioAvailability({ bank, integrity, programmes });

describe("practice studio availability", () => {
  it("joins catalogue `language` to bank `language_conventions`", () => {
    const result = build(
      many(6, { subject: "language_conventions", strand: "Grammar" }),
      [live({ subject: "language" })],
    );
    expect(result.subjects[0].state).toBe("ready");
    expect(result.subjects[0].uniqueQuestions).toBe(6);
  });

  it("keeps ICAS Year 5 Science as none (coming soon), whatever the bank holds", () => {
    const programme = live({ yearLevel: 5, examStyle: "icas_style", subject: "science", status: "coming_soon" });
    expect(build(many(8, { yearLevel: 3, examStyle: "icas_style", subject: "science" }), [programme]).subjects[0])
      .toMatchObject({ state: "none", reason: "coming_soon", uniqueQuestions: 0 });
    expect(build(many(8, { yearLevel: 5, examStyle: "icas_style", subject: "science" }), [programme]).subjects[0].state)
      .toBe("none");
  });

  it("does not surface AMC: only supplied programmes appear", () => {
    const bank = [...many(10, { examStyle: "amc_style", subject: "amc_mathematics" }), ...many(6)];
    const result = build(bank, [live()]);
    expect(result.subjects).toHaveLength(1);
    expect(result.subjects.every((s) => s.examStyle !== "amc_style")).toBe(true);
  });

  it("reports a live programme with no questions as none/no_content", () => {
    expect(build(many(6, { subject: "reading" }), [live()]).subjects[0])
      .toMatchObject({ state: "none", reason: "no_content", uniqueQuestions: 0 });
  });

  describe("strand labels (read time only)", () => {
    it("merges the mechanical variants", () => {
      expect(strandKey("Number")).toBe(strandKey("number"));
      expect(strandKey("Statistics and probability")).toBe(strandKey("Statistics & Probability"));
      expect(strandKey("Algebra & Patterns")).toBe(strandKey("Patterns & Algebra"));
      expect(strandKey("Measurement and geometry")).toBe(strandKey("Geometry & Measurement"));
    });

    it("does not merge editorially different strands", () => {
      const keys = new Set(["Number", "Number & Arithmetic", "Number and algebra"].map(strandKey));
      expect(keys.size).toBe(3);
    });

    it("counts Number and number as one strand with one canonical label", () => {
      const bank = [...many(3, { strand: "Number" }), ...many(3, { strand: "number" })];
      const strands = build(bank, [live()]).subjects[0].strands;
      expect(strands).toHaveLength(1);
      expect(strands[0]).toMatchObject({ strand: "Number", uniqueQuestions: 6, eligible: true });
    });

    it("keeps Number and Number & Arithmetic as separate rows", () => {
      const bank = [...many(5, { strand: "Number" }), ...many(5, { strand: "Number & Arithmetic" })];
      expect(build(bank, [live()]).subjects[0].strands.map((s) => s.strand))
        .toEqual(["Number", "Number and Arithmetic"]);
    });

    it("is independent of bank order", () => {
      const bank = [...many(2, { strand: "Patterns & Algebra" }), ...many(3, { strand: "Algebra & Patterns" })];
      const a = build(bank, [live()]).subjects[0].strands[0].strand;
      const b = build([...bank].reverse(), [live()]).subjects[0].strands[0].strand;
      expect(a).toBe(b);
      expect(a).toBe("Algebra and Patterns");
    });
  });

  describe("floor", () => {
    it(`offers a strand at ${STRAND_FLOOR} questions and not at ${STRAND_FLOOR - 1}`, () => {
      const at = build(many(STRAND_FLOOR, { strand: "A" }), [live()]).subjects[0];
      const below = build(many(STRAND_FLOOR - 1, { strand: "A" }), [live()]).subjects[0];
      expect(at.strands[0].eligible).toBe(true);
      expect(at.state).toBe("ready");
      expect(below.strands[0]).toMatchObject({ eligible: false, state: "none", uniqueQuestions: 4 });
      expect(below).toMatchObject({ state: "none", reason: "no_strand_reaches_floor" });
    });

    it("counts a subject ready when any one strand clears the floor", () => {
      const bank = [...many(2, { strand: "Small" }), ...many(6, { strand: "Big" })];
      const subject = build(bank, [live()]).subjects[0];
      expect(subject.state).toBe("ready");
      expect(subject.strands.find((s) => s.strand === "Small")?.eligible).toBe(false);
    });
  });

  describe("duplicates", () => {
    it("counts identical content under different ids once", () => {
      const bank = [
        ...many(4, { strand: "A" }),
        q({ id: "dup-1", strand: "A", prompt: "What is 2 + 2?", options: ["3", "4"] }),
        q({ id: "dup-2", strand: "A", prompt: "  what is 2 + 2?  ", options: ["3", "4"] }),
      ];
      const strand = build(bank, [live()]).subjects[0].strands[0];
      expect(strand.uniqueQuestions).toBe(5);
      expect(strand.eligible).toBe(true);
    });

    it("lets duplicates drop a strand below the floor", () => {
      const bank = Array.from({ length: 6 }, (_, i) => q({ id: `d${i}`, strand: "A", prompt: "Same", options: ["x"] }));
      expect(build(bank, [live()]).subjects[0].strands[0]).toMatchObject({ uniqueQuestions: 1, eligible: false });
    });

    it("does not merge the same prompt over different passages", () => {
      const bank = [
        q({ id: "p1", subject: "reading", strand: "Literature", prompt: "What is the main idea?", stimulus: "A" }),
        q({ id: "p2", subject: "reading", strand: "Literature", prompt: "What is the main idea?", stimulus: "B" }),
      ];
      expect(build(bank, [live({ subject: "reading" })]).subjects[0].strands[0].uniqueQuestions).toBe(2);
    });
  });

  describe("fail closed", () => {
    const programmes = [
      live(),
      live({ yearLevel: 5, examStyle: "icas_style", subject: "science", status: "coming_soon" }),
    ];

    it("treats unknown integrity as unknown, with no counts at all", () => {
      const result = build(many(30), programmes, "unknown");
      expect(result.integrity).toBe("unknown");
      const [numeracy] = result.subjects;
      expect(numeracy).toMatchObject({ state: "unknown", uniqueQuestions: null, strands: [], reason: "unchecked" });
      expect(numeracy.uniqueQuestions).not.toBe(0);
    });

    it("reports an empty bank as unknown, never none", () => {
      const result = build([], programmes);
      expect(result.integrity).toBe("unknown");
      expect(result.subjects[0].state).toBe("unknown");
      expect(result.subjects[0].state).not.toBe("none");
    });

    it("never offers a set size or a time for an unknown entry", () => {
      const [entry] = build([], programmes).subjects;
      expect(offeredSetSizes(entry.uniqueQuestions)).toEqual([]);
      expect(aboutMinutes({ medianSeconds: null, uniqueQuestions: entry.uniqueQuestions }, 10)).toBeNull();
    });

    it("keeps a coming-soon programme as none even when the bank cannot be checked", () => {
      expect(build([], programmes).subjects[1]).toMatchObject({ state: "none", reason: "coming_soon" });
    });

    it("keeps none and unknown on different states and reasons", () => {
      const none = build(many(6, { subject: "reading" }), [live()]).subjects[0];
      const unknown = build([], [live()]).subjects[0];
      expect(none.reason).not.toBe(unknown.reason);
      expect(none.state).not.toBe(unknown.state);
    });
  });

  describe("set size and time", () => {
    it("never offers a size larger than the unique count", () => {
      expect(offeredSetSizes(4)).toEqual([]);
      expect(offeredSetSizes(5)).toEqual([5]);
      expect(offeredSetSizes(12)).toEqual([5, 10]);
      expect(Math.max(...offeredSetSizes(19))).toBeLessThanOrEqual(19);
      expect(offeredSetSizes(null)).toEqual([]);
    });

    it("uses the median of the slice, not the mean", () => {
      expect(medianOf([30, 30, 30, 30, 900])).toBe(30);
      expect(medianOf([10, 20, 30, 40])).toBe(25);
      expect(medianOf([])).toBeNull();
    });

    it("rounds 'about N minutes' to 5 and never below 5", () => {
      expect(aboutMinutes({ medianSeconds: 75, uniqueQuestions: 40 }, 10)).toBe(15);
      expect(aboutMinutes({ medianSeconds: 45, uniqueQuestions: 40 }, 5)).toBe(5);
      expect(aboutMinutes({ medianSeconds: 60, uniqueQuestions: 40 }, 20)).toBe(20);
    });

    it("refuses a time for a set larger than the slice or an invalid size", () => {
      expect(aboutMinutes({ medianSeconds: 60, uniqueQuestions: 8 }, 10)).toBeNull();
      expect(aboutMinutes({ medianSeconds: 60, uniqueQuestions: 8 }, 0)).toBeNull();
    });

    it("computes the median from unique questions only", () => {
      const bank = [
        ...Array.from({ length: 5 }, (_, i) => q({ id: `m${i}`, seconds: 40 + i, prompt: `P${i}` })),
        q({ id: "z-dup", seconds: 900, prompt: "P0" }),
      ];
      expect(build(bank, [live()]).subjects[0].strands[0].medianSeconds).toBe(42);
    });
  });
});
