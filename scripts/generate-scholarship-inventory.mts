/**
 * Deterministic, read-only audit of all 160 Scholarship Year 6 questions.
 *
 * Writes docs/reviews/scholarship-2026-10-18/scholarship-160-inventory.json.
 *
 *   npx tsx scripts/generate-scholarship-inventory.mts            regenerate the committed inventory
 *   npx tsx scripts/generate-scholarship-inventory.mts --check    verify without writing; exit 1 if stale
 *
 * The output contains no wall-clock value: it is a pure function of the committed source files, so two runs on the
 * same revision are byte-identical and `--check` can fail a stale committed inventory. Fields that cannot be
 * established from primary evidence are written as `not_established` with the missing source named.
 */
import "./lib/allow-server-only.mts";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { REVIEW_DIR, buildInventory, fsReader, serialiseInventory } from "./lib/scholarship-audit-core";

const outPath = `${REVIEW_DIR}/scholarship-160-inventory.json`;
const checkOnly = process.argv.includes("--check");

const { document, failures, contradictions } = buildInventory({ reader: fsReader });
const text = serialiseInventory(document);

if (failures.length > 0) {
  console.error(`Machine key check FAILED for ${failures.length} item(s):`);
  for (const f of failures) console.error(`  ${f.id}: ${f.reason}`);
}
if (contradictions.length > 0) {
  console.error(`Contradictory claims detected (${contradictions.length}):`);
  for (const c of contradictions) console.error(`  ${c}`);
}

if (checkOnly) {
  const committed = existsSync(outPath) ? readFileSync(outPath, "utf8").replace(/\r\n/g, "\n") : null;
  if (committed !== text) {
    console.error(`STALE: ${outPath} does not match a fresh deterministic regeneration. Run without --check and commit the result.`);
    process.exit(1);
  }
  if (failures.length > 0 || contradictions.length > 0) process.exit(1);
  console.log(`OK: ${outPath} is current (${(document.items as unknown[]).length} items).`);
} else {
  writeFileSync(outPath, text);
  console.log(`Wrote ${outPath} with ${(document.items as unknown[]).length} items. auditStatus=${String(document.auditStatus)}`);
  if (failures.length > 0 || contradictions.length > 0) process.exit(1);
}
