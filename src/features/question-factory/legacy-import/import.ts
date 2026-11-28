import * as fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashJson } from "../provenance/content-hash";
import { FsFactoryRepository } from "../storage";
import { preflightLegacyImport } from "./preflight";
import { buildLegacyRecord } from "./record";
import type { LegacySourceReader } from "./source";
import { legacyImportManifestSchema } from "./manifest";

const journalSchema = z.object({
  version: z.literal(1), manifestHash: z.string(), importedAt: z.iso.datetime(),
  status: z.enum(["prepared", "committed"]),
  candidates: z.array(z.object({ id: z.string(), recordHash: z.string() }).strict()),
  manifest: legacyImportManifestSchema,
}).strict();

async function atomicJournal(file: string, data: unknown) {
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await fs.open(temp, "wx");
    try { await handle.writeFile(JSON.stringify(data, null, 2) + "\n"); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}

/**
 * Explicit apply path. Preflight is re-run under the exclusive legacy transaction lock.
 * Prepared journal precedes all creates. Partial failure leaves only generated records;
 * retry with the identical manifest resumes without overwrite, transition or evidence inheritance.
 * No automatic stale-lock stealing. This is resumable batch commit, not all-or-nothing rollback.
 */
export async function importLegacyBatch(raw: unknown, source: LegacySourceReader, workspace: string) {
  const repository = new FsFactoryRepository(workspace);
  // First check is read-only: a malformed request must not create even a lock directory.
  await preflightLegacyImport(raw, source, repository);
  const folder = path.join(workspace, ".legacy-import");
  await fs.mkdir(folder, { recursive: true });
  const lockPath = path.join(folder, "lock.json");
  const token = randomUUID();
  const lock = await fs.open(lockPath, "wx").catch(() => { throw new Error("legacy_import_locked: inspect transaction and lock owner before recovery; no lock is stolen"); });
  try {
    await lock.writeFile(JSON.stringify({ token, pid: process.pid, startedAt: new Date().toISOString() }));
    const plan = await preflightLegacyImport(raw, source, repository);
    for (const entry of plan.items.filter(entry => entry.replay)) {
      let metadata: { candidateId?: string; compartment?: string };
      try { metadata = JSON.parse(await fs.readFile(path.join(workspace, ".metadata", `${entry.item.id}.json`), "utf8")); }
      catch { throw new Error(`legacy_metadata_recovery_required:${entry.item.id}`); }
      if (metadata.candidateId !== entry.item.id || metadata.compartment !== entry.existingCompartment) throw new Error(`legacy_metadata_recovery_required:${entry.item.id}`);
    }
    const file = path.join(folder, `${plan.manifestHash}.json`);
    let prior: z.infer<typeof journalSchema> | null = null;
    try { prior = journalSchema.parse(JSON.parse(await fs.readFile(file, "utf8"))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (prior && (prior.manifestHash !== plan.manifestHash || hashJson(prior.manifest) !== plan.manifestHash)) throw new Error("transaction_manifest_conflict");
    const importedAt = prior?.importedAt ?? new Date().toISOString();
    if (plan.items.some(entry => entry.replay && entry.existingImportedAt !== importedAt)) throw new Error("transaction_import_time_conflict");
    const records = plan.items.map(entry => buildLegacyRecord(plan, entry, importedAt));
    const candidates = records.map(record => ({ id: record.candidateId, recordHash: hashJson(record) }));
    if (prior && hashJson(prior.candidates) !== hashJson(candidates)) throw new Error("transaction_record_conflict");
    if (!prior && plan.items.some(entry => entry.replay)) throw new Error("missing_transaction_journal");
    const journal = { version: 1 as const, manifestHash: plan.manifestHash, manifest: plan.manifest, importedAt, status: "prepared" as const, candidates };
    if (!prior) await atomicJournal(file, journal);
    if (prior?.status === "committed" && plan.items.some(entry => !entry.replay)) throw new Error("committed_transaction_missing_records");
    for (const [index, entry] of plan.items.entries()) {
      if (entry.replay) continue;
      const created = await repository.create("generated", entry.item.id, records[index]);
      if (!created.ok) throw new Error(`legacy_create_refused:${entry.item.id}:${created.reason}`);
    }
    if (prior?.status !== "committed") await atomicJournal(file, { ...journal, status: "committed" });
    return { status: "imported" as const, manifestHash: plan.manifestHash, importedAt, candidates: candidates.map(entry => entry.id), replayed: plan.items.every(entry => entry.replay) };
  } finally {
    await lock.close();
    const owner = JSON.parse(await fs.readFile(lockPath, "utf8"));
    if (owner.token === token) await fs.rm(lockPath);
  }
}
