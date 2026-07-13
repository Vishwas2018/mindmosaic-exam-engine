import { describe, expect, it } from "vitest";

import {
  extremeEntries,
  firstDuplicateLabel,
  tableCellByRowLabel,
  validateTableShape,
} from "@/features/question-factory/correctness/visual-lookup";

/**
 * Direct unit tests for the table-shape validator and label-duplication
 * helper. A malformed row width can never reach the correctness gate
 * through the normal pipeline — `checkAgainstProductionSchema` already
 * rejects it upstream during structural validation — so `validateTableShape`
 * is defense-in-depth for any other caller (e.g. a future gate) that reads
 * table data directly. Exercised here in isolation from the full
 * schema+dispatcher pipeline.
 */
describe("firstDuplicateLabel", () => {
  it("returns undefined when every label is unique", () => {
    expect(firstDuplicateLabel(["Monday", "Tuesday", "Wednesday"])).toBeUndefined();
  });

  it("detects an exact duplicate", () => {
    expect(firstDuplicateLabel(["Monday", "Tuesday", "Monday"])).toBe("Monday");
  });

  it("detects a whitespace/case canonicalisation collision", () => {
    expect(firstDuplicateLabel(["Monday", " monday "])).toBe(" monday ");
  });
});

describe("validateTableShape", () => {
  const table = (headers: readonly string[], rows: readonly (readonly (string | number)[])[]) => ({
    id: "t-1",
    type: "table" as const,
    altText: "test table",
    data: { headers: [...headers], rows: rows.map((row) => [...row]), rowHeaders: false },
  });

  it("accepts a well-formed table", () => {
    expect(validateTableShape(table(["Day", "Attendance"], [["Monday", 120], ["Tuesday", 95]]))).toBeUndefined();
  });

  it("rejects a table with a duplicate header", () => {
    const issue = validateTableShape(table(["Day", "Attendance", "Attendance"], [["Monday", 120, 121]]));
    expect(issue?.kind).toBe("duplicate_header");
  });

  it("rejects a table with a malformed (inconsistent) row width", () => {
    const issue = validateTableShape(table(["Day", "Attendance"], [["Monday", 120], ["Tuesday"]]));
    expect(issue?.kind).toBe("malformed_row_width");
  });

  it("rejects a table with a duplicate row label", () => {
    const issue = validateTableShape(table(["Day", "Attendance"], [["Monday", 120], ["Monday", 130]]));
    expect(issue?.kind).toBe("duplicate_row_label");
  });

  it("checks header duplication before row-shape issues, deterministically", () => {
    const issue = validateTableShape(table(["Day", "Day"], [["Monday", 120], ["Tuesday"]]));
    expect(issue?.kind).toBe("duplicate_header");
  });
});

describe("tableCellByRowLabel — ambiguity never resolved to the first match", () => {
  const dupHeaderTable = {
    id: "t-2",
    type: "table" as const,
    altText: "duplicate header table",
    data: { headers: ["Day", "Attendance", "Attendance"], rows: [["Monday", 120, 121]], rowHeaders: false },
  };

  it("returns undefined rather than the first match when the column header is ambiguous", () => {
    expect(tableCellByRowLabel(dupHeaderTable, "Monday", "Attendance")).toBeUndefined();
  });

  const dupRowTable = {
    id: "t-3",
    type: "table" as const,
    altText: "duplicate row table",
    data: { headers: ["Day", "Attendance"], rows: [["Monday", 120], ["Monday", 130]], rowHeaders: false },
  };

  it("returns undefined rather than the first match when the row label is ambiguous", () => {
    expect(tableCellByRowLabel(dupRowTable, "Monday", "Attendance")).toBeUndefined();
  });

  const cleanTable = {
    id: "t-4",
    type: "table" as const,
    altText: "clean table",
    data: { headers: ["Day", "Attendance"], rows: [["Monday", 120], ["Tuesday", 95]], rowHeaders: false },
  };

  it("resolves a unique row/column combination normally", () => {
    expect(tableCellByRowLabel(cleanTable, "Monday", "Attendance")).toBe(120);
  });
});

describe("extremeEntries — ties never silently resolved", () => {
  it("returns every entry tied at the maximum", () => {
    const values = [
      { label: "Apples", value: 20 },
      { label: "Bananas", value: 20 },
      { label: "Cherries", value: 15 },
    ];
    const extremes = extremeEntries(values, "max");
    expect(extremes).toHaveLength(2);
    expect(extremes.map((e) => e.label).sort()).toEqual(["Apples", "Bananas"]);
  });

  it("returns a single entry when there is no tie", () => {
    const values = [
      { label: "Apples", value: 10 },
      { label: "Bananas", value: 20 },
    ];
    expect(extremeEntries(values, "max")).toEqual([{ label: "Bananas", value: 20 }]);
  });
});
