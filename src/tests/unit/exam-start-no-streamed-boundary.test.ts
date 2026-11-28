import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * D-018. The exam start panels used useSearchParams(), which needs a Suspense boundary, so their markup streamed in a
 * hidden segment that React 19.2 reveals up to ~300 ms late. A signed-in student's auth update inside that window
 * made React client-render the boundary while the hidden server copy was still in the document: two `start-exam`
 * buttons, one enabled and one disabled. Reproduced against a production build in 5 of 6 loads.
 *
 * The pages now read the query on the server and render the panels without a boundary. This pins both halves.
 */
const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const panels = [
  "src/features/exam-engine/components/ExamConfigurator.tsx",
  "src/features/exam-engine/exam-patterns/components/ExamPatternStarter.tsx",
];
const pages = ["src/app/practice/[program]/page.tsx", "src/app/exams/[patternId]/page.tsx"];

describe("exam start panels render without a streamed Suspense boundary (D-018)", () => {
  it.each(panels)("%s does not read the query on the client", (file) => {
    expect(read(file)).not.toMatch(/useSearchParams/);
  });

  it.each(pages)("%s reads the query on the server and wraps nothing in Suspense", (file) => {
    const source = read(file);
    expect(source).toMatch(/searchParams: Promise</);
    expect(source).not.toMatch(/<Suspense\b/);
  });
});
