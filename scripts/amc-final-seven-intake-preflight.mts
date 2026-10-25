import "./lib/allow-server-only.mts";
import { readFile } from "node:fs/promises";

import {
  FINAL_SEVEN_IDS,
  evaluateAllDraftReadiness,
  evaluateFinalSevenIntake,
  loadFinalSevenIntakeWorld,
  type ExpectedHashes,
} from "./lib/amc-final-seven-intake.mjs";

/**
 * READ-ONLY preflight for ingesting the seven outstanding AMC questions.
 *
 *   npx tsx scripts/amc-final-seven-intake-preflight.mts [--ids a,b] [--expected-hashes <manifest.csv>] [--all-drafts] [--json]
 *
 * There is no write mode. `--execute` and any other unknown flag are refused.
 * Exit codes: 0 every requested question is ready, 3 at least one blocker
 * (expected today), 2 invalid arguments, 1 internal error.
 */
const argv = process.argv.slice(2);
const known = new Set(["--ids", "--expected-hashes", "--all-drafts", "--json"]);
const valued = new Set(["--ids", "--expected-hashes"]);

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

let ids: string[] | undefined;
let expectedFile: string | undefined;
let allDrafts = false;
let json = false;
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index];
  if (arg === "--execute") fail("There is no execute mode. This tool never writes; intake needs a separately authorised change.");
  if (!known.has(arg)) fail(`Unknown argument: ${arg}`);
  if (valued.has(arg)) {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`${arg} needs a value.`);
    index += 1;
    if (arg === "--ids") ids = value.split(",").map((id) => id.trim());
    else expectedFile = value;
  } else if (arg === "--all-drafts") allDrafts = true;
  else json = true;
}

function parseExpected(csv: string): ExpectedHashes[] {
  const rows = csv.trim().split(/\r?\n/).map((line) => line.match(/"((?:[^"]|"")*)"|([^,]+)/g)?.map((cell) => cell.replace(/^"|"$/g, "").replaceAll('""', '"')) ?? []);
  const header = rows[0];
  const col = (name: string): number => {
    const found = header.indexOf(name);
    if (found < 0) fail(`Expected-hash manifest lacks a '${name}' column.`);
    return found;
  };
  const [q, r, s, c, m] = ["questionId", "revision", "sourceQuestionHash", "contentHash", "sourceManifestHash"].map(col);
  return rows.slice(1).map((row) => ({ questionId: row[q], revision: Number(row[r]), sourceQuestionHash: row[s], contentHash: row[c], sourceManifestHash: row[m] }));
}

const world = await loadFinalSevenIntakeWorld();
const expected = expectedFile ? parseExpected(await readFile(expectedFile, "utf8")) : undefined;
const report = evaluateFinalSevenIntake(world, { ids, expected });
const drafts = allDrafts ? evaluateAllDraftReadiness(world) : undefined;

if (json) {
  process.stdout.write(JSON.stringify({ report, drafts }, null, 2) + "\n");
} else {
  console.log(`AMC final-seven intake preflight (dry run; writes performed: ${report.writesPerformed}).`);
  console.log(`Allow-list: ${FINAL_SEVEN_IDS.length} IDs. Requested: ${report.requestedIds.length}.`);
  if (!expected) console.log("No external expected-hash manifest supplied: hashes were checked against the committed registry only.");
  for (const rejected of report.rejectedIds) console.log(`REJECTED  ${rejected.code}: ${rejected.message}`);
  for (const result of report.results) {
    console.log(`${result.ready ? "READY   " : "BLOCKED "} ${result.questionId}  skill='${result.facts.skill ?? ""}'  blueprint=${result.facts.blueprint ?? "n/a"}`);
    for (const item of result.blockers) console.log(`           - ${item.code}: ${item.message}`);
  }
  if (drafts) {
    const bad = drafts.filter((draft) => draft.taxonomy !== "ok" || draft.blueprint !== "ok");
    console.log(`All ${drafts.length} AMC drafts: taxonomy and blueprint ready ${drafts.length - bad.length}, not ready ${bad.length}.`);
    for (const draft of bad) console.log(`  ${draft.questionId}  taxonomy=${draft.taxonomy} blueprint=${draft.blueprint}  ${draft.detail.join("; ")}`);
  }
  console.log(report.ready ? "Result: every requested question is ready." : "Result: NOT ready. No file was written.");
}
process.exitCode = report.ready ? 0 : 3;
