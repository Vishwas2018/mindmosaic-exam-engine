/**
 * Checks a returned external review of the scholarship answer-withheld packet. Read-only: it writes nothing and
 * records no evidence.
 *
 *   npx tsx scripts/verify-scholarship-external-review.mts <external-review-<provider>.json>
 *     [--packet-dir docs/reviews/scholarship-2026-10-18/external-review]
 *
 * Exit codes: 0 valid (summary printed), 1 invalid (problems printed), 2 usage.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { checkScholarshipExternalResponse, type DeclaredItem } from "../src/features/question-factory/review/scholarship-external-packet";

const args = process.argv.slice(2);
const dirFlag = args.indexOf("--packet-dir");
const packetDir = dirFlag >= 0 ? args[dirFlag + 1] : "docs/reviews/scholarship-2026-10-18/external-review";
const file = args.find((value, index) => !value.startsWith("--") && args[index - 1] !== "--packet-dir");
if (!file) {
  process.stderr.write("Usage: verify-scholarship-external-review <response.json> [--packet-dir <dir>]\n");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(path.join(packetDir, "packet-manifest.json"), "utf8"));
const declared: DeclaredItem[] = [];
for (const name of ["verbal-reasoning", "reading"]) {
  const packet = JSON.parse(await readFile(`content/scholarship-drafts/scholarship-y6-${name}-draft.json`, "utf8"));
  for (const q of packet.questions) declared.push({ id: q.id, key: q.answerKey.optionId, difficulty: q.metadata.difficulty });
}
const report = checkScholarshipExternalResponse(JSON.parse(await readFile(file, "utf8")), manifest, declared);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.valid ? 0 : 1;
