import { describe, expect, it } from "vitest";

import {
  parsePracticeSessionParams,
  practiceSessionParamsSchema,
} from "@/features/exam-engine/practice-mode/practice-params.schema";

describe("practiceSessionParamsSchema", () => {
  it("parses valid standard practice params with forgiving defaults", () => {
    const params = new URLSearchParams(
      "subject=numeracy&year=3&style=naplan_style&skill=Fractions&count=10&seed=test-123&extended=1",
    );
    const result = parsePracticeSessionParams(params);

    expect(result.ok).toBe(true);
    if (result.ok && result.mode === "standard") {
      expect(result.params).toEqual({
        mode: "standard",
        subject: "numeracy",
        year: 3,
        style: "naplan_style",
        skill: "Fractions",
        count: 10,
        seed: "test-123",
        extended: true,
        launchId: null,
        curriculumCode: null,
      });
    }
  });

  it("parses opaque drill practice params containing only mode and launchId", () => {
    const params = new URLSearchParams(
      "mode=drill&launchId=opaque-drill-uuid-123",
    );
    const result = parsePracticeSessionParams(params);

    expect(result.ok).toBe(true);
    if (result.ok && result.mode === "drill") {
      expect(result.params).toEqual({
        mode: "drill",
        launchId: "opaque-drill-uuid-123",
      });
    }
  });

  it("ignores extra/tampered query params in drill mode (opaque contract)", () => {
    const params = new URLSearchParams(
      "mode=drill&launchId=opaque-drill-uuid-123&subject=science&skill=Gravity&count=100&extended=1&seed=injected",
    );
    const result = parsePracticeSessionParams(params);

    expect(result.ok).toBe(true);
    if (result.ok && result.mode === "drill") {
      // Result contains only mode and launchId; extra params cannot pollute the drill contract
      expect(result.params).toEqual({
        mode: "drill",
        launchId: "opaque-drill-uuid-123",
      });
    }
  });

  it("rejects drill mode with missing launchId", () => {
    const params = new URLSearchParams("mode=drill");
    const result = parsePracticeSessionParams(params);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe("drill");
      expect(result.error).toContain("launchId");
    }
  });

  it("rejects drill mode with empty launchId", () => {
    const params = new URLSearchParams("mode=drill&launchId=");
    const result = parsePracticeSessionParams(params);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.mode).toBe("drill");
      expect(result.error).toContain("launchId");
    }
  });

  it("validates directly with practiceSessionParamsSchema for drill mode", () => {
    const parsed = practiceSessionParamsSchema.safeParse({
      mode: "drill",
      launchId: "drill-123",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe("drill");
      expect(parsed.data.launchId).toBe("drill-123");
    }
  });

  it("falls back to sensible defaults on empty params in standard mode", () => {
    const params = new URLSearchParams("");
    const result = parsePracticeSessionParams(params);

    expect(result).toEqual({
      ok: true,
      mode: "standard",
      params: {
        subject: "mixed",
        year: "mixed",
        style: "mixed",
        skill: null,
        count: 8,
        mode: "standard",
        seed: null,
        extended: false,
        launchId: null,
        curriculumCode: null,
      },
    });
  });
});
