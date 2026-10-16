/**
 * Prints the first-party attestation result for every in-scope scholarship
 * numerical-reasoning item (nr-021..nr-040): the independently recomputed value,
 * the keyed option, and whether they agree. Exits non-zero if any item is not
 * attested, so a disagreement is surfaced as a defect rather than forced.
 *
 *   npx tsx scripts/report-scholarship-attestation.mts
 */
import { readFile } from "node:fs/promises";

import {
  isScholarshipAttestedItem,
  verifyFirstPartyScholarshipAttestation,
  type ScholarshipQuestionLike,
} from "../src/features/question-factory/correctness/scholarship-attestation";

const PACKET = "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json";

const packet = JSON.parse(await readFile(PACKET, "utf8")) as { questions: ScholarshipQuestionLike[] };
const items = packet.questions.filter((question) => isScholarshipAttestedItem(question));

let failures = 0;
console.log("| item | recomputed | keyed option | result |");
console.log("| --- | --- | --- | --- |");
for (const question of items) {
  const result = verifyFirstPartyScholarshipAttestation(question);
  const key = question.answerKey.kind === "single_option" ? question.answerKey.optionId : "?";
  const keyedText = question.options?.find((option) => option.id === key)?.text ?? "?";
  if (!result.ok) failures += 1;
  console.log(
    `| ${question.id} | ${result.computedValue ?? "-"} | ${key} (${keyedText}) | ${result.ok ? "attested" : `FAILED: ${result.error}`} |`,
  );
}
console.log(`\n${items.length - failures}/${items.length} attested, ${failures} failed.`);
process.exit(failures === 0 && items.length === 20 ? 0 : 1);
