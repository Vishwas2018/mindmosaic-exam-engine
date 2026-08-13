/**
 * `npm run test:ci` / `npm run test:rls:ci` — run a vitest project and prove the
 * run was COMPLETE, not merely non-failing.
 *
 * WHY THIS EXISTS. A vitest worker fork can exit mid-run. When it does, vitest
 * reports the crashed file as *missing* rather than failing:
 *
 *     Test Files  11 passed (12)
 *          Tests  150 passed (196)
 *         Errors  1 error
 *
 * Every line of that says "passed". Forty-six tests did not run, and the only
 * signal is a parenthesised total and a separate "Unhandled Errors" block above
 * the summary — both easy to read past in CI log output, where nobody is
 * reading at all unless the step is red. This was observed repeatedly on this
 * project's RLS suite, on files that vary between runs; and once, at the start
 * of a session, in its worst form: the same crash with **exit code 0**, which
 * would have let CI pass with an entire suite unrun.
 *
 * A reconciliation gate that can be silently skipped is not a gate. Since the
 * whole point of the Phase 2 backfill work is "the shadow-verify says the data
 * matches", the suite that proves it has to be provably complete first.
 *
 * WHAT IT CHECKS. Four things, each catching a different failure:
 *
 *   1. vitest's own exit code — an ordinary failing test.
 *   2. Every test file ON DISK reported results. This is the "11 passed (12)"
 *      case. The expected set comes from globbing the same patterns the vitest
 *      config includes, so it needs no hand-maintained count that would drift.
 *   3. No test is left non-terminal. A crashed worker leaves its file's tests
 *      as `pending` in the JSON report, which is neither passed nor failed and
 *      is counted in neither summary number.
 *   4. The per-file assertion count adds up to the reported total, so a file
 *      that reported partially is caught even if every assertion it did report
 *      passed.
 *
 * It spawns vitest itself rather than being a separate CI step over a report
 * left behind by an earlier one. Two steps would need `if: always()` to run
 * after a red test step, and a guard that only runs when someone remembered a
 * YAML key is the same class of problem it exists to solve.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { evaluateRun, type JsonReport } from "./test-run-report";

interface ProjectSpec {
  /** vitest config to run. */
  readonly config: string;
  /** Directory walked for test files. */
  readonly root: string;
  /** A file is a test file if its path matches this. */
  readonly matches: RegExp;
  /** Extra args, e.g. selecting one project inside a multi-project config. */
  readonly args: readonly string[];
}

const PROJECTS: Record<string, ProjectSpec> = {
  /* The unit config declares two projects (`unit` and `question-factory-fs`)
     over one include pattern split by an explicit file list, so globbing
     src/tests for *.test.ts(x) is the union of both — which is what a bare
     `vitest run` executes. */
  unit: {
    config: "vitest.config.ts",
    root: "src/tests",
    matches: /\.test\.tsx?$/,
    args: [],
  },
  rls: {
    config: "vitest.rls.config.ts",
    root: "tests/rls",
    matches: /\.test\.ts$/,
    args: [],
  },
};


const projectName = process.argv[2];
const project = projectName === undefined ? undefined : PROJECTS[projectName];
if (project === undefined) {
  console.error(
    `Usage: tsx scripts/verify-test-run.mts <${Object.keys(PROJECTS).join("|")}> [-- extra vitest args]`,
  );
  process.exit(2);
}

const repoRoot = resolve(import.meta.dirname, "..");
const passthrough = process.argv.slice(3);

function listTestFiles(dir: string): string[] {
  const absolute = join(repoRoot, dir);
  const found: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) {
      found.push(...listTestFiles(relative(repoRoot, path)));
    } else if (project!.matches.test(entry)) {
      found.push(normalise(path));
    }
  }
  return found;
}

/** Repo-relative, forward-slashed — the JSON reporter emits absolute paths. */
function normalise(path: string): string {
  return relative(repoRoot, resolve(path)).split("\\").join("/");
}

const expectedFiles = listTestFiles(project.root).sort();
if (expectedFiles.length === 0) {
  console.error(`No test files found under ${project.root}. Refusing to report a vacuous pass.`);
  process.exit(2);
}

const reportDir = mkdtempSync(join(tmpdir(), "vitest-guard-"));
const reportPath = join(reportDir, "report.json");

try {
  /* Two reporters: the default so a human still sees ordinary vitest output,
     and json so this script has something to check. */
  const run = spawnSync(
    process.execPath,
    [
      join(repoRoot, "node_modules", "vitest", "vitest.mjs"),
      "run",
      "--config",
      project.config,
      "--reporter=default",
      "--reporter=json",
      `--outputFile=${reportPath}`,
      ...project.args,
      ...passthrough,
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  let report: JsonReport;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8")) as JsonReport;
  } catch (cause) {
    /* No report at all is itself a complete-run failure, and must not be
       downgraded to "well, vitest exited 0". */
    console.error(`\nCould not read the vitest JSON report at ${reportPath}: ${String(cause)}`);
    process.exit(1);
  }

  const { problems, filesExpected, filesReported, testsConcluded, testsTotal } = evaluateRun({
    expectedFiles,
    report,
    exitCode: run.status,
    normalise,
  });

  if (problems.length > 0) {
    console.error(`\nINCOMPLETE TEST RUN (${projectName}):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error(
      `\nExpected ${filesExpected} file(s); ${filesReported} reported; ` +
        `${testsConcluded}/${testsTotal} tests concluded.\n`,
    );
    process.exit(1);
  }

  console.log(
    `\nComplete run (${projectName}): ${filesExpected} file(s), ${testsTotal} test(s), ` +
      `all concluded, none failed.\n`,
  );
} finally {
  rmSync(reportDir, { recursive: true, force: true });
}
