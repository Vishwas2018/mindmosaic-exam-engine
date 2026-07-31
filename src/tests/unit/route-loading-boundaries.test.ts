import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A `loading.tsx` must never sit at or above a segment that calls
 * `notFound()`.
 *
 * Adding one wraps that whole subtree in Suspense, which makes the response
 * stream — and a streamed response has already sent its HTTP 200 headers
 * before a descendant server component gets far enough to call
 * `notFound()`. The branded 404 page still renders, so it looks right in a
 * browser, but the status code is 200. Crawlers index the "missing" page,
 * uptime checks see success, and the only thing that catches it is an
 * assertion on `response.status()`.
 *
 * This is not hypothetical: adding `src/app/practice/loading.tsx` silently
 * turned every unknown and coming-soon program slug from 404 into 200, and
 * `src/app/teacher/loading.tsx` did the same to the student and marking
 * drill-downs. The e2e suite caught the first because
 * `e2e/not-found.spec.ts` asserts the status; nothing covered the second,
 * because those routes need authentication.
 *
 * So the rule is enforced structurally here, where it costs no server and
 * no auth, rather than being left to whoever adds the next loading state.
 */

const APP_DIR = "src/app";

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(APP_DIR).map((file) => file.split(path.sep).join("/"));

/** Segment directory of every loading.tsx, e.g. "src/app/teacher". */
const loadingSegments = files
  .filter((file) => file.endsWith("/loading.tsx"))
  .map((file) => file.slice(0, -"/loading.tsx".length));

/** Comments discuss notFound() without calling it — including in this rule's own explanations. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Segment directory of every file that actually calls notFound() during
 * render. Only page and layout files can: a loading.tsx or error.tsx that
 * mentions it is describing this very rule.
 */
const notFoundSegments = files
  .filter((file) => /\/(page|layout)\.tsx?$/.test(file))
  .filter((file) => /\bnotFound\(\)/.test(stripComments(fs.readFileSync(file, "utf8"))))
  .map((file) => file.slice(0, file.lastIndexOf("/")));

describe("loading boundaries never swallow a 404 status", () => {
  it("finds the loading boundaries and notFound() segments it is meant to compare", () => {
    /* If either list is empty the test below passes vacuously, which would
       be worse than no test at all. */
    expect(loadingSegments.length).toBeGreaterThan(0);
    expect(notFoundSegments.length).toBeGreaterThan(0);
  });

  it.each(loadingSegments)("%s has no notFound() descendant", (loadingSegment) => {
    const offenders = notFoundSegments.filter(
      (segment) => segment === loadingSegment || segment.startsWith(`${loadingSegment}/`),
    );

    expect(
      offenders,
      `${loadingSegment}/loading.tsx wraps ${offenders.join(", ")} in Suspense, so their ` +
        `notFound() responses will stream as HTTP 200. Move the loading state down to a ` +
        `segment with no notFound() beneath it.`,
    ).toEqual([]);
  });
});
