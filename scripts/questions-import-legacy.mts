import "./lib/allow-server-only.mts";
import { readFile } from "node:fs/promises";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { FsFactoryRepository } from "../src/features/question-factory/storage";
import { GitLegacySourceReader, sha256 } from "../src/features/question-factory/legacy-import/source";
import { preflightLegacyImport } from "../src/features/question-factory/legacy-import/preflight";
import { importLegacyBatch } from "../src/features/question-factory/legacy-import/import";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("questions:import-legacy --manifest <json> --expected-manifest-sha256 <hash> [--repository <git-root>] [--dry-run | --apply]\nDefault: strictly no-write preflight. --apply creates generated import records only; never gates/stages/publishes. Unknown origin remains ineligible in Phase 1.");
    return;
  }
  const values = new Map<string, string>();
  let apply = false, dry = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--apply") { if (apply) throw new Error("duplicate_argument"); apply = true; }
    else if (arg === "--dry-run") { if (dry) throw new Error("duplicate_argument"); dry = true; }
    else if (["--manifest", "--expected-manifest-sha256", "--repository"].includes(arg) && args[i + 1] && !values.has(arg)) values.set(arg, args[++i]);
    else throw new Error(`invalid_argument:${arg}`);
  }
  if (apply && dry) throw new Error("conflicting_execution_modes");
  const file = values.get("--manifest"), expected = values.get("--expected-manifest-sha256");
  if (!file || !expected || !/^[a-f0-9]{64}$/.test(expected)) throw new Error("manifest_and_exact_sha256_required");
  const bytes = await readFile(file);
  if (sha256(bytes) !== expected) throw new Error("manifest_sha256_mismatch");
  const raw: unknown = JSON.parse(bytes.toString("utf8"));
  const source = new GitLegacySourceReader(values.get("--repository") ?? process.cwd());
  const workspace = getWorkspaceRoot();
  if (apply) console.log(JSON.stringify(await importLegacyBatch(raw, source, workspace)));
  else {
    const plan = await preflightLegacyImport(raw, source, new FsFactoryRepository(workspace));
    console.log(JSON.stringify({ status: "preflight_passed", writesPerformed: false, manifestSha256: expected, manifestHash: plan.manifestHash,
      items: plan.items.map(entry => ({ id: entry.item.id, candidateHash: entry.item.candidateHash, publicationContentHash: entry.item.publicationContentHash, replay: entry.replay })),
      independentReviewEligible: false, stagingEligible: false, publicationEligible: false }));
  }
}
main().catch(error => { console.error(JSON.stringify({ status: "rejected", message: error instanceof Error ? error.message : "legacy_import_error" })); process.exitCode = 2; });
