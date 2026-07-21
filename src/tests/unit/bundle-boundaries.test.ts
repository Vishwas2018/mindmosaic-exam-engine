import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Static guards against the exact regression the bundle-size fix
 * addressed: /exam, /results and /showcase must never import the
 * production question bank directly, and must never import from the
 * exam-engine components *barrel* (which re-exports ExamConfigurator —
 * and therefore the bank — even for consumers who only want one small
 * component). ExamConfigurator itself, and the /practice/[program] route
 * that renders it (the catalogue browse page at /practice never imports
 * it — it only links to programs — and the marketing root at "/" never
 * imports it either), are exempt: /practice/[program] is the one
 * legitimate place selection happens.
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

  it("the practice/[program] route is the one place ExamConfigurator (and the bank it needs) is imported", () => {
    const source = readSource("src/app/practice/[program]/page.tsx");
    expect(source).toMatch(
      /from ["']@\/features\/exam-engine\/components\/ExamConfigurator["']/,
    );
  });

  it("the practice catalogue page does not import ExamConfigurator directly", () => {
    const source = readSource("src/app/practice/page.tsx");
    expect(source).not.toMatch(
      /from ["']@\/features\/exam-engine\/components\/ExamConfigurator["']/,
    );
  });

  it("the marketing root page does not import ExamConfigurator directly", () => {
    const source = readSource("src/app/page.tsx");
    expect(source).not.toMatch(
      /from ["']@\/features\/exam-engine\/components\/ExamConfigurator["']/,
    );
  });
});
