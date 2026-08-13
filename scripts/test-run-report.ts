/**
 * The completeness rules behind `scripts/verify-test-run.mts`, separated from
 * the process-spawning half so they can be tested against the failure they
 * exist to catch.
 *
 * That separation is not ceremony. The guard's whole value is that it fails
 * when a suite silently does not run, and a guard nobody has ever seen fail is
 * indistinguishable from a guard that cannot. `src/tests/unit/test-run-guard.test.ts`
 * feeds it the exact shape of report observed in the wild — twelve files
 * expected, eleven reporting, the twelfth's tests left `pending` — and asserts
 * it refuses.
 */

export interface AssertionResult {
  readonly status: string;
  readonly title?: string;
}

export interface FileResult {
  readonly name: string;
  readonly assertionResults?: readonly AssertionResult[];
}

export interface JsonReport {
  readonly numTotalTests?: number;
  readonly numPassedTests?: number;
  readonly numFailedTests?: number;
  readonly testResults?: readonly FileResult[];
}

/**
 * Statuses that mean "this test reached a conclusion".
 *
 * `pending` is deliberately absent, and is the crux: a crashed worker leaves
 * its file's tests as `pending`, which is counted in neither vitest's passed
 * total nor its failed total, so the summary line reports a smaller number
 * beside an unchanged parenthesised total and calls the run green.
 */
const TERMINAL = new Set(["passed", "failed", "skipped", "todo"]);

export interface RunEvaluation {
  /** Empty when the run was complete and clean. */
  readonly problems: readonly string[];
  readonly filesExpected: number;
  readonly filesReported: number;
  readonly testsConcluded: number;
  readonly testsTotal: number;
}

export interface RunInput {
  /** Repo-relative, forward-slashed paths of every test file found on disk. */
  readonly expectedFiles: readonly string[];
  readonly report: JsonReport;
  /** vitest's own exit status; null when it died by signal. */
  readonly exitCode: number | null;
  /** Normalises a reporter-emitted absolute path to the expectedFiles form. */
  readonly normalise: (path: string) => string;
}

export function evaluateRun(input: RunInput): RunEvaluation {
  const problems: string[] = [];
  const { expectedFiles, report, exitCode, normalise } = input;

  if (exitCode !== 0) {
    problems.push(`vitest exited ${exitCode ?? "by signal"}`);
  }

  const results = report.testResults ?? [];
  const reported = new Set(results.map((file) => normalise(file.name)));

  const missing = expectedFiles.filter((file) => !reported.has(file));
  if (missing.length > 0) {
    problems.push(
      `${missing.length} test file(s) on disk reported no results — a worker almost ` +
        `certainly died: ${missing.join(", ")}`,
    );
  }

  let concluded = 0;
  for (const file of results) {
    const assertions = file.assertionResults ?? [];
    for (const assertion of assertions) {
      if (TERMINAL.has(assertion.status)) concluded += 1;
    }
    const unfinished = assertions.filter((assertion) => !TERMINAL.has(assertion.status));
    if (unfinished.length > 0) {
      problems.push(
        `${normalise(file.name)} left ${unfinished.length} test(s) non-terminal ` +
          `(first: "${unfinished[0]!.title ?? "?"}" as ${unfinished[0]!.status})`,
      );
    }
  }

  /* Falls back to the concluded count when the reporter omits the total, so a
     malformed report cannot manufacture a passing comparison against itself. */
  const total = report.numTotalTests ?? concluded;
  if (concluded !== total) {
    problems.push(
      `only ${concluded} of ${total} tests reported a result — ${total - concluded} never ran`,
    );
  }

  if ((report.numFailedTests ?? 0) > 0) {
    problems.push(`${report.numFailedTests} test(s) failed`);
  }

  return {
    problems,
    filesExpected: expectedFiles.length,
    filesReported: reported.size,
    testsConcluded: concluded,
    testsTotal: total,
  };
}
