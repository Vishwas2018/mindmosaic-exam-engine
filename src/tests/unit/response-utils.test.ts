import { describe, expect, it } from "vitest";

import {
  isBlankRecord,
  isBlankString,
  isUnansweredResponse,
  normaliseRecordResponse,
} from "@/features/exam-engine/types/response-utils";

describe("isBlankString", () => {
  it("is true for empty and whitespace-only strings", () => {
    expect(isBlankString("")).toBe(true);
    expect(isBlankString("   ")).toBe(true);
    expect(isBlankString("\t\n")).toBe(true);
  });

  it("is false once any non-whitespace character is present", () => {
    expect(isBlankString("a")).toBe(false);
    expect(isBlankString("  a  ")).toBe(false);
  });
});

describe("isBlankRecord", () => {
  it("is true for an empty record", () => {
    expect(isBlankRecord({})).toBe(true);
  });

  it("is true when every value is blank", () => {
    expect(isBlankRecord({ a: "", b: "   " })).toBe(true);
  });

  it("is false when at least one value is non-blank (partial attempt)", () => {
    expect(isBlankRecord({ a: "", b: "answered" })).toBe(false);
  });
});

describe("normaliseRecordResponse", () => {
  it("drops blank-valued keys and keeps non-blank ones", () => {
    expect(normaliseRecordResponse({ a: "3", b: "", c: "   ", d: "six" })).toEqual({
      a: "3",
      d: "six",
    });
  });

  it("returns an empty record when every value is blank", () => {
    expect(normaliseRecordResponse({ a: "", b: "  " })).toEqual({});
  });

  it("does not mutate its input", () => {
    const input = { a: "" };
    normaliseRecordResponse(input);
    expect(input).toEqual({ a: "" });
  });
});

describe("isUnansweredResponse", () => {
  it("treats missing and null as unanswered", () => {
    expect(isUnansweredResponse(undefined)).toBe(true);
    expect(isUnansweredResponse(null)).toBe(true);
  });

  it("treats an empty or whitespace-only string as unanswered", () => {
    expect(isUnansweredResponse("")).toBe(true);
    expect(isUnansweredResponse("   ")).toBe(true);
    expect(isUnansweredResponse("typed")).toBe(false);
  });

  it("treats an empty array as unanswered", () => {
    expect(isUnansweredResponse([])).toBe(true);
    expect(isUnansweredResponse(["n1"])).toBe(false);
  });

  it("treats a record with only blank values as unanswered — the clearing fix", () => {
    expect(isUnansweredResponse({})).toBe(true);
    expect(isUnansweredResponse({ triangle: "" })).toBe(true);
    expect(isUnansweredResponse({ triangle: "  " })).toBe(true);
  });

  it("treats a partially completed multi-field record as answered", () => {
    expect(isUnansweredResponse({ triangle: "3", hexagon: "" })).toBe(false);
  });

  it("treats numbers and booleans as always answered", () => {
    expect(isUnansweredResponse(0)).toBe(false);
    expect(isUnansweredResponse(false)).toBe(false);
  });
});
