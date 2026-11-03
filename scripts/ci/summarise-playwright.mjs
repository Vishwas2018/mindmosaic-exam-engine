#!/usr/bin/env node
// Reads a Playwright JSON report and prints a verification record: SHA, counts, skips, retries/flaky, failures.
// Usage: node scripts/ci/summarise-playwright.mjs <label> <report.json> [--require-spec <substring>]...
// Exit 1 if there is any unexpected (failed) test, any test that ran zero times, or a required spec did not run.
// Flaky (passed only after a retry) is REPORTED and does not fail this script, but it is never hidden.
import { readFileSync } from "node:fs";

const [label, file, ...rest] = process.argv.slice(2);
const required = rest.flatMap((arg, i) =>
  arg === "--require-spec" ? [rest[i + 1]] : [],
);
const report = JSON.parse(readFileSync(file, "utf8"));

const tests = [];
const walk = (suite, trail) => {
  const here =
    suite.title && suite.title !== suite.file ? [...trail, suite.title] : trail;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? [])
      tests.push({
        file: spec.file,
        title: [...here, spec.title].join(" > "),
        t,
      });
  }
  for (const child of suite.suites ?? []) walk(child, here);
};
for (const s of report.suites ?? []) walk(s, []);

const out = { passed: 0, failed: 0, flaky: 0, skipped: 0, retried: 0 };
const failures = [];
const flaky = [];
const skipped = [];
for (const { file: f, title, t } of tests) {
  const results = t.results ?? [];
  if (results.length > 1) out.retried += 1;
  if (t.status === "expected") out.passed += 1;
  else if (t.status === "skipped")
    ((out.skipped += 1), skipped.push(`${f} > ${title}`));
  else if (t.status === "flaky")
    ((out.flaky += 1),
      flaky.push(`${f} > ${title} (attempts: ${results.length})`));
  else
    ((out.failed += 1),
      failures.push(
        `${f} > ${title}: ${(results.at(-1)?.error?.message ?? "")
          .replace(/\u001b\[[0-9;]*m/g, "")
          .split("\n")[0]
          .slice(0, 300)}`,
      ));
}
const ranSpecs = new Set(tests.map((x) => x.file));
const missing = required.filter(
  (r) => ![...ranSpecs].some((f) => f.includes(r)),
);

const lines = [
  `## ${label}`,
  `- SHA: ${process.env.GITHUB_SHA ?? "(local)"}  runner: ${process.env.RUNNER_OS ?? process.platform}  node: ${process.version}`,
  `- tests: ${tests.length}  passed: ${out.passed}  failed: ${out.failed}  flaky (passed on retry): ${out.flaky}  skipped: ${out.skipped}  tests with >1 attempt: ${out.retried}`,
  `- duration: ${Math.round((report.stats?.duration ?? 0) / 1000)} s  workers: ${report.config?.workers}  configured retries: ${report.config?.projects?.[0]?.retries}`,
  ...(missing.length
    ? [`- REQUIRED SPEC DID NOT RUN: ${missing.join(", ")}`]
    : []),
  ...(failures.length
    ? ["", "### Failures", ...failures.map((x) => `- ${x}`)]
    : []),
  ...(flaky.length
    ? [
        "",
        "### Flaky (investigate; a retry-pass is not a clean pass)",
        ...flaky.map((x) => `- ${x}`),
      ]
    : []),
  ...(skipped.length
    ? ["", "### Skipped", ...skipped.map((x) => `- ${x}`)]
    : []),
];
console.log(lines.join("\n"));
process.exit(
  out.failed > 0 || missing.length > 0 || tests.length === 0 ? 1 : 0,
);
