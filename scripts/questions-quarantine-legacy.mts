/**
 * `questions:quarantine-legacy` — explicit, auditable quarantine of published
 * manifests that carry NO human approval of any kind (pre-governance legacy).
 *
 * Dry-run by default; `--apply` moves the manifests. Nothing is approved,
 * rewritten or deleted:
 *   - each manifest file is moved byte-for-byte to
 *     content/quarantine/legacy-unapproved/manifests/<id>.json (git sees a rename);
 *   - content/quarantine/legacy-unapproved/ledger.json records every quarantined
 *     id, reason, original path and the sha256 of the preserved bytes;
 *   - active assembly (`questions:assemble-bank`) is unchanged and still refuses
 *     any invalid active manifest. Quarantined items are simply not active.
 *
 * Refuses (exit 1, nothing moved) if a candidate fails assembly for any reason
 * other than "no approval at all": a tampered, mismatching, schema-invalid or
 * AMC/scholarship manifest is an integrity failure, never legacy.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { assemblePublishedQuestions } from "../src/features/question-factory/publication";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

const MANIFESTS = "content/question-factory/published-manifests";
const QUARANTINE = "content/quarantine/legacy-unapproved";
const REASON = "no_human_approval_pre_governance";
const apply = process.argv.includes("--apply");
const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

async function main(): Promise<number> {
  const repository = new FsFactoryRepository(getWorkspaceRoot());
  const approvalDir = path.join(process.cwd(), "content/publication-approvals");
  const approvals = await Promise.all((await readdir(approvalDir)).filter((f) => f.endsWith(".json")).sort()
    .map(async (f) => JSON.parse(await readFile(path.join(approvalDir, f), "utf8"))));
  const assembled = await assemblePublishedQuestions(repository, approvals);
  const approvedIds = new Set(assembled.questions.map((q) => q.id));
  const approvalIds = new Set(approvals.map((a) => (a as { questionId?: string }).questionId));

  type Manifest = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const toMove: { id: string; bytes: Buffer; manifest: Manifest }[] = [];
  const refused: string[] = [];
  for (const file of (await readdir(MANIFESTS)).filter((f) => f.endsWith(".json")).sort()) {
    const id = file.replace(/\.json$/, "");
    const bytes = await readFile(path.join(MANIFESTS, file));
    const manifest = JSON.parse(bytes.toString("utf8"));
    const questionId: string = manifest?.question?.id ?? manifest?.questionId ?? id;
    if (approvedIds.has(questionId)) continue;
    const subject = manifest?.question?.metadata?.subject;
    const noApproval = manifest.humanApproval === undefined && manifest.approvedBy === undefined && !approvalIds.has(questionId);
    const protectedProgramme = subject === "amc_mathematics" || String(questionId).startsWith("scholarship-") || String(questionId).startsWith("roadmap-amc-");
    if (!noApproval || protectedProgramme) { refused.push(`${id}: ${protectedProgramme ? "protected programme" : "carries approval evidence that fails validation"}`); continue; }
    toMove.push({ id, bytes, manifest });
  }
  process.stdout.write(`active approved: ${approvedIds.size}; quarantine candidates: ${toMove.length}; integrity refusals: ${refused.length}\n`);
  if (refused.length) { process.stderr.write(`Refusing; these are integrity failures, not legacy:\n${refused.join("\n")}\n`); return 1; }
  if (!apply) { process.stdout.write("dry run: pass --apply to move manifests.\n"); return 0; }

  const ledgerPath = path.join(QUARANTINE, "ledger.json");
  let ledger: { entries: Record<string, any>[] } = { entries: [] }; // eslint-disable-line @typescript-eslint/no-explicit-any
  try { ledger = JSON.parse(await readFile(ledgerPath, "utf8")); } catch { /* first run */ }
  await mkdir(path.join(QUARANTINE, "manifests"), { recursive: true });
  const known = new Set(ledger.entries.map((e) => e.candidateId));
  for (const { id, bytes, manifest } of toMove) {
    if (known.has(id)) throw new Error(`Already quarantined: ${id}`);
    await rename(path.join(MANIFESTS, `${id}.json`), path.join(QUARANTINE, "manifests", `${id}.json`));
    ledger.entries.push({
      candidateId: id,
      questionId: manifest?.question?.id ?? manifest?.questionId ?? id,
      subject: manifest?.question?.metadata?.subject ?? null,
      yearLevel: manifest?.question?.yearLevel ?? null,
      manifestRevision: manifest.revision ?? null,
      originalPath: `${MANIFESTS}/${id}.json`,
      preservedPath: `${QUARANTINE}/manifests/${id}.json`,
      sha256: sha256(bytes),
      reason: REASON,
    });
  }
  ledger.entries.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  const out = {
    schemaVersion: 1,
    purpose: "Pre-governance published manifests holding no human approval. Preserved unchanged, excluded from active assembly and learner delivery. Quarantine is NOT approval and is reversible only by a governed re-review.",
    authorisation: "Repository owner release instruction of 2026-10-17 (quarantine only; no content approval).",
    count: ledger.entries.length,
    entries: ledger.entries,
  };
  await writeFile(ledgerPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  process.stdout.write(`quarantined ${toMove.length}; ledger now ${ledger.entries.length} entries.\n`);
  return 0;
}

main().then((c) => { process.exitCode = c; }).catch((e) => { process.stderr.write(`internal_error: ${e instanceof Error ? e.message : String(e)}\n`); process.exitCode = 1; });
