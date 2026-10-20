import "./lib/allow-server-only.mts";
import { readFile, writeFile } from "node:fs/promises";
import { buildAmcReviewTarget } from "./lib/amc-review-sources.mjs";

/**
 * Re-pins the reviewed source snapshot of AMC items whose draft content was
 * deliberately revised. The pin is DERIVED from the current draft (never typed),
 * and only after the first-party solver registry has independently recomputed
 * the answer of the revised draft against that exact pin. Usage:
 *   npx tsx scripts/amc-rebind-pins.mts roadmap-amc-y3-005 [more ids]
 * Human approval is never created or reused here: the item's old approval and
 * manifest must already have been retired, and it needs a fresh signature.
 */
const BINDINGS = "src/features/question-factory/correctness/amc-content-bindings.ts";
const ids = process.argv.slice(2);
if (ids.length === 0) throw new Error("Name at least one AMC question id.");
let text = await readFile(BINDINGS, "utf8");
for (const id of ids) {
  const year = /^roadmap-amc-y([35])-/.exec(id)?.[1];
  if (!year) throw new Error(`Not an AMC id: ${id}`);
  const sourceFile = `content/roadmap-drafts/amc-y${year}-draft.json` as "content/roadmap-drafts/amc-y3-draft.json" | "content/roadmap-drafts/amc-y5-draft.json";
  const packet = JSON.parse(await readFile(sourceFile, "utf8")) as { questions: { id: string }[] };
  const raw = packet.questions.find((q) => q.id === id);
  if (!raw) throw new Error(`Draft not found: ${id}`);
  const target = buildAmcReviewTarget(raw, sourceFile);
  const pattern = new RegExp(`("${id}": ")[a-f0-9]{64}(")`);
  if (!pattern.test(text)) throw new Error(`No pin line for ${id}`);
  text = text.replace(pattern, `$1${target.source.sourceQuestionHash}$2`);
  console.log(`${id} re-pinned to ${target.source.sourceQuestionHash}; now run the AMC attestation tests: the first-party solver must still agree.`);
}
await writeFile(BINDINGS, text, "utf8");
