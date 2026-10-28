import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {samplePracticeFixtures} from "@/content/visual-fixtures/bar-model/sample-practice.server";

const ROOT = join(import.meta.dirname, "..", "..", "..");

describe("sample practice security — no answer keys reach the client", () => {
  it("fixture index carries the server-only import", () => {
    const source = readFileSync(join(ROOT, "src/content/visual-fixtures/bar-model/index.ts"), "utf8");
    expect(source).toContain('import "server-only"');
  });

  it("sample-practice.server module carries the server-only import", () => {
    const source = readFileSync(
      join(ROOT, "src/content/visual-fixtures/bar-model/sample-practice.server.ts"),
      "utf8",
    );
    expect(source).toContain('import "server-only"');
  });

  it("answer-stripped fixtures contain no privateAnswerKey or workedExplanation", () => {
    const fixtures = [...samplePracticeFixtures(3), ...samplePracticeFixtures(5)];
    expect(fixtures).toHaveLength(30);
    for (const fixture of fixtures) {
      const keys = Object.keys(fixture);
      expect(keys).not.toContain("privateAnswerKey");
      expect(keys).not.toContain("workedExplanation");
    }
  });

  it("every fixture has the fields safe for client consumption", () => {
    const fixtures = samplePracticeFixtures(3);
    for (const fixture of fixtures) {
      expect(fixture.name).toMatch(/^pilot-y3-/);
      expect(fixture.yearLevel).toBe(3);
      expect(typeof fixture.prompt).toBe("string");
      expect(fixture.prompt.length).toBeGreaterThan(0);
      expect(fixture.visual).toBeTruthy();
    }
  });
});
