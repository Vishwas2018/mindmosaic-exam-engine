import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Static guards against the exact regression the bundle-size fix
 * addressed: /exam, /results and /showcase must never import the
 * production question bank directly, and must never import from the
 * exam-engine components *barrel* (which re-exports ExamConfigurator —
 * and therefore the bank — even for consumers who only want one small
 * component). ExamConfigurator itself, and the home page that renders
 * it, are exempt: they are the one legitimate place selection happens.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("client route bundle boundaries", () => {
  const routesWithoutBankAccess = [
    "src/app/exam/page.tsx",
    "src/app/results/page.tsx",
    "src/app/showcase/page.tsx",
  ];

  it.each(routesWithoutBankAccess)(
    "%s does not import the production question bank directly",
    (path) => {
      const source = readSource(path);
      expect(source).not.toMatch(/from ["']@\/content\/questions\/question-bank["']/);
    },
  );

  it.each(routesWithoutBankAccess)(
    "%s does not import through the exam-engine components barrel",
    (path) => {
      const source = readSource(path);
      expect(source).not.toMatch(
        /from ["']@\/features\/exam-engine\/components["']/,
      );
    },
  );

  it("the home page is the one place ExamConfigurator (and the bank it needs) is imported", () => {
    const source = readSource("src/app/page.tsx");
    expect(source).toMatch(
      /from ["']@\/features\/exam-engine\/components\/ExamConfigurator["']/,
    );
  });
});
