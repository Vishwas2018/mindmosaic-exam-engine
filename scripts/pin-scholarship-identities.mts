import "./lib/allow-server-only.mts";
import { readFile, writeFile } from "node:fs/promises";
import { isScholarshipAttestedItem } from "@/features/question-factory/correctness/scholarship-attestation";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance";

/**
 * Records, for every current Year 6 scholarship draft, the hash of its complete candidate content
 * (draft + solver sidecar, exactly as scripts/ingest-scholarship-drafts.mts submits it). Ingestion
 * preserves a draft id only when the submitted content still hashes to its pin. A pin grants no
 * correctness, review or approval: every gate and the human approval still apply.
 * Re-run after any deliberate content change; the item then needs fresh review and approval.
 */
const FILES = ["numerical-reasoning", "verbal-reasoning", "reading", "mathematics"];
const pins: Record<string, string> = {};
for (const f of FILES) {
  const packet = JSON.parse(await readFile(`content/scholarship-drafts/scholarship-y6-${f}-draft.json`, "utf8"));
  for (const raw of packet.questions) {
    const side = packet.parameters?.[raw.id];
    // First-party attested items are verified by hash-bound recompute; candidate sidecar logic is never submitted for them.
    const merged = side && typeof side.solver === "string" && !isScholarshipAttestedItem(raw) ? { ...raw, solverParams: {
      solver: side.solver, solverParams: side.solverParams ?? {},
      ...((side.ruleOrientation ?? side.solverParams?.ruleOrientation) ? { ruleOrientation: side.ruleOrientation ?? side.solverParams?.ruleOrientation } : {}),
      ...(side.targetOption ? { targetOption: side.targetOption } : {}),
      ...(side.correctValue !== undefined ? { correctValue: side.correctValue } : {}),
    } } : raw;
    pins[raw.id] = hashJson(candidateQuestionSchema.parse(merged));
  }
}
const sorted = Object.fromEntries(Object.entries(pins).sort(([a], [b]) => a.localeCompare(b)));
await writeFile("src/features/question-factory/correctness/scholarship-identity-pins.json", JSON.stringify(sorted, null, 2) + "\n");
console.log(`${Object.keys(sorted).length} scholarship identities pinned.`);
