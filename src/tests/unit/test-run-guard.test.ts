import { describe, expect, it } from "vitest";

import { describeExit, evaluateRun, type JsonReport } from "../../../scripts/test-run-report";

/**
 * The guard that everything else in CI is trusted through
 * (`scripts/verify-test-run.mts`, spec §25 / §12.7 step 5).
 *
 * A guard nobody has watched fail is indistinguishable from a guard that
 * cannot. So the central case here is not synthetic: it is the exact report
 * shape observed on this project's RLS suite, where a worker fork exited
 * mid-run and vitest printed
 *
 *     Test Files  11 passed (12)
 *          Tests  150 passed (196)
 *
 * — every word of which says "passed", while a whole file's tests sat in the
 * report as `pending`, counted in neither total. The backfill reconciliation in
 * §12.7 step 5 is only worth what the suite proving it is worth, which is
 * nothing at all if the suite can be skipped without turning CI red.
 */

const FILES = ["tests/rls/a.test.ts", "tests/rls/b.test.ts"];
const identity = (path: string): string => path;

function report(overrides: Partial<JsonReport> = {}): JsonReport {
  return {
    numTotalTests: 4,
    numPassedTests: 4,
    numFailedTests: 0,
    testResults: [
      {
        name: "tests/rls/a.test.ts",
        assertionResults: [{ status: "passed" }, { status: "passed" }],
      },
      {
        name: "tests/rls/b.test.ts",
        assertionResults: [{ status: "passed" }, { status: "passed" }],
      },
    ],
    ...overrides,
  };
}

describe("a complete, clean run passes", () => {
  it("accepts every file reporting every test as passed", () => {
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report(),
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems).toEqual([]);
    expect(result.filesReported).toBe(2);
    expect(result.testsConcluded).toBe(4);
  });

  it("accepts skipped and todo tests as concluded", () => {
    /* Skipping is a decision someone made; a crashed worker is not. The guard
       must not conflate them, or every `it.skip` becomes a CI failure and the
       guard gets switched off. */
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report({
        numTotalTests: 4,
        testResults: [
          {
            name: "tests/rls/a.test.ts",
            assertionResults: [{ status: "passed" }, { status: "skipped" }],
          },
          {
            name: "tests/rls/b.test.ts",
            assertionResults: [{ status: "todo" }, { status: "passed" }],
          },
        ],
      }),
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems).toEqual([]);
  });
});

describe("the observed false-green pattern is refused", () => {
  it("fails when a file on disk reported nothing, even with exit code 0", () => {
    /* THE case. vitest exited 0, every reported test passed, and one file's
       results are simply absent. Before this guard that was a green build. */
    const result = evaluateRun({
      expectedFiles: FILES,
      report: {
        numTotalTests: 2,
        numPassedTests: 2,
        numFailedTests: 0,
        testResults: [
          {
            name: "tests/rls/a.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
        ],
      },
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain("tests/rls/b.test.ts");
    expect(result.problems[0]).toContain("reported no results");
  });

  it("fails when a file's tests are left pending, even with exit code 0", () => {
    /* The other half of the same crash: the file appears in the report, but its
       tests never concluded. `pending` is in neither the passed nor the failed
       total, which is exactly how 46 unrun tests hid behind "150 passed". */
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report({
        numTotalTests: 4,
        numPassedTests: 2,
        testResults: [
          {
            name: "tests/rls/a.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "tests/rls/b.test.ts",
            assertionResults: [
              { status: "pending", title: "refuses an edit to an answer version" },
              { status: "pending" },
            ],
          },
        ],
      }),
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems.some((p) => p.includes("non-terminal"))).toBe(true);
    expect(result.problems.some((p) => p.includes("never ran"))).toBe(true);
    expect(result.testsConcluded).toBe(2);
    expect(result.testsTotal).toBe(4);
  });

  it("names the first unfinished test so the crashed file is identifiable", () => {
    /* The plain summary does not say which file died; finding out meant re-running
       under a JSON reporter by hand. The guard has the report already. */
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report({
        testResults: [
          {
            name: "tests/rls/a.test.ts",
            assertionResults: [{ status: "passed" }, { status: "passed" }],
          },
          {
            name: "tests/rls/b.test.ts",
            assertionResults: [
              { status: "passed" },
              { status: "pending", title: "the one that did not run" },
            ],
          },
        ],
      }),
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems.join(" ")).toContain("the one that did not run");
  });
});

describe("ordinary failures still fail", () => {
  it("reports a non-zero vitest exit", () => {
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report(),
      exitCode: 1,
      normalise: identity,
    });
    expect(result.problems).toContain("vitest exited 1");
  });

  it("reports a death by signal rather than treating null as success", () => {
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report(),
      exitCode: null,
      normalise: identity,
    });
    expect(result.problems.some((p) => p.includes("signal"))).toBe(true);
  });

  it("reports failed tests", () => {
    const result = evaluateRun({
      expectedFiles: FILES,
      report: report({ numFailedTests: 1 }),
      exitCode: 1,
      normalise: identity,
    });
    expect(result.problems.some((p) => p.includes("1 test(s) failed"))).toBe(true);
  });
});

describe("a malformed report cannot manufacture a pass", () => {
  it("does not treat a missing total as agreement with itself", () => {
    /* If numTotalTests is absent the guard falls back to the concluded count,
       which would make the totals check vacuous — so the file-level checks have
       to carry it. Here both files are missing entirely. */
    const result = evaluateRun({
      expectedFiles: FILES,
      report: { testResults: [] },
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems.some((p) => p.includes("reported no results"))).toBe(true);
  });

  it("counts an empty assertion list as a file that reported nothing useful", () => {
    const result = evaluateRun({
      expectedFiles: FILES,
      report: {
        numTotalTests: 4,
        testResults: [
          { name: "tests/rls/a.test.ts", assertionResults: [] },
          { name: "tests/rls/b.test.ts", assertionResults: [] },
        ],
      },
      exitCode: 0,
      normalise: identity,
    });
    expect(result.problems.some((p) => p.includes("never ran"))).toBe(true);
  });
});

describe("a crashed or silent run can never report success", () => {
  const complete = (): JsonReport => report();

  it("describes a Windows native crash by its status name instead of a bare number", () => {
    expect(describeExit(3221226505)).toBe("exit code 3221226505 (0xC0000409, STATUS_STACK_BUFFER_OVERRUN (native fast-fail abort))");
    expect(describeExit(3221225477)).toContain("STATUS_ACCESS_VIOLATION");
    expect(describeExit(1)).toBe("exit code 1");
    expect(describeExit(null, "SIGKILL")).toBe("killed by signal SIGKILL");
    expect(describeExit(null)).toContain("no exit code");
  });

  it("fails on a native crash exit code even when the report is otherwise complete", () => {
    const result = evaluateRun({ expectedFiles: FILES, report: complete(), exitCode: 3221226505, normalise: identity });
    expect(result.problems.join("\n")).toContain("0xC0000409");
  });

  it("fails when vitest was killed by a signal, whatever code it carries", () => {
    const result = evaluateRun({ expectedFiles: FILES, report: complete(), exitCode: 0, signal: "SIGKILL", normalise: identity });
    expect(result.problems.join("\n")).toContain("killed by signal SIGKILL");
  });

  it("fails when vitest could not be started", () => {
    const result = evaluateRun({ expectedFiles: FILES, report: { testResults: [] }, exitCode: null, spawnError: "spawn ENOENT", normalise: identity });
    expect(result.problems.join("\n")).toContain("could not be run: spawn ENOENT");
  });

  it("fails on the worst observed shape: a complete-looking report, exit code 0, and the crash text in the output", () => {
    const output = [
      " Test Files  2 passed (2)",
      "⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯",
      "Vitest caught 1 unhandled error during the test run.",
      "Error: [vitest-pool]: Worker forks emitted error.",
      "Caused by: Error: Worker exited unexpectedly",
      "     Errors  1 error",
    ].join("\n");
    const result = evaluateRun({ expectedFiles: FILES, report: complete(), exitCode: 0, outputText: output, normalise: identity });
    expect(result.problems.length).toBeGreaterThanOrEqual(3);
    expect(result.problems.join("\n")).toContain("exited unexpectedly");
  });

  it("stays quiet for a clean run with ordinary output", () => {
    const result = evaluateRun({
      expectedFiles: FILES, report: complete(), exitCode: 0, signal: null,
      outputText: " Test Files  2 passed (2)\n      Tests  4 passed (4)\n", normalise: identity,
    });
    expect(result.problems).toEqual([]);
  });
});
