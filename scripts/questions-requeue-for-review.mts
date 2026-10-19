/**
 * `questions:requeue-for-review` — returns judgement-based candidates that the semantic gate quarantined for want of an
 * independent review to the review queue, so a different-provider review can be ingested (questions:review-prompt,
 * questions:review-ingest). Moves candidates only; records no review and advances no lifecycle state.
 *
 * Usage: questions:requeue-for-review --candidate-ids <id1,id2,...>
 * Exit codes: 0 all requeued, 3 at least one refused, 2 invalid arguments.
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { requeueQuarantinedForExternalReview } from "../src/features/question-factory/review/requeue-for-review";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

const flag = process.argv.indexOf("--candidate-ids");
const raw = flag >= 0 ? process.argv[flag + 1] : undefined;
if (!raw) {
  process.stderr.write("Usage: questions:requeue-for-review --candidate-ids <id1,id2,...>\n");
  process.exit(2);
}
const repository = new FsFactoryRepository(getWorkspaceRoot());
let refused = 0;
for (const id of raw.split(",").map((value) => value.trim()).filter(Boolean)) {
  const result = await requeueQuarantinedForExternalReview(id, repository);
  if (result.outcome === "refused") refused += 1;
  process.stdout.write(`${id}: ${result.outcome}${result.outcome === "refused" ? ` (${result.reason})` : ""}\n`);
}
process.exitCode = refused ? 3 : 0;
