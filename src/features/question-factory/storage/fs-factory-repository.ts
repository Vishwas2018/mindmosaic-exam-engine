import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { FACTORY_LIMITS } from "../config";
import { hashJson } from "../provenance";
import { FACTORY_IDENTIFIER_PATTERN } from "../shared/identifiers";
import { isFactoryCompartment } from "./compartments";
import type { FactoryCompartment } from "./compartments";
import type {
  CreateResult,
  FactoryRepository,
  MoveResult,
  ReconciliationEntry,
  ReconciliationReport,
  UpdateOptions,
  UpdateResult,
} from "./factory-repository";

const METADATA_DIR = ".metadata";
const TRANSACTIONS_DIR = ".transactions";
const QUARANTINE_REPORTS_DIR = ".quarantine-reports";
const LOCKS_DIR = ".locks";
const QUARANTINE_COMPARTMENT = "quarantined";
const CORRUPTION_PREVIEW_MAX_LENGTH = 120;

/**
 * How long a held lock is trusted before a later acquirer treats it as
 * abandoned (a crashed process, an unhandled exception between acquire and
 * release) and removes it — the same "recover from an interrupted
 * operation" convention `reconcile()` already applies to transaction
 * markers, just self-healing on the next acquisition attempt rather than
 * requiring an explicit `reconcile()` call, since a lock (unlike a
 * transaction marker) has no useful "resume" action, only "give up and
 * retry".
 */
const LOCK_STALE_MS = 30_000;
/** Poll interval while waiting for a held, non-stale lock. */
const LOCK_RETRY_DELAY_MS = 20;
/** Total time an acquisition attempt will wait before failing closed with `lock_timeout`, rather than hanging indefinitely. */
const LOCK_MAX_WAIT_MS = 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CorruptionReport {
  readonly candidateId: string;
  readonly sourceCompartment: FactoryCompartment;
  readonly quarantinedFileName: string;
  readonly errorCategory: "json_parse_error";
  readonly errorMessage: string;
  readonly contentPreview: string;
  readonly quarantinedAt: string;
}

interface CandidateMetadata {
  readonly candidateId: string;
  readonly compartment: FactoryCompartment;
  readonly updatedAt: string;
}

interface TransactionMarker {
  readonly candidateId: string;
  readonly from: FactoryCompartment;
  readonly to: FactoryCompartment;
  readonly startedAt: string;
}

function assertValidCandidateId(candidateId: string): void {
  if (
    candidateId.length === 0 ||
    candidateId.length > FACTORY_LIMITS.IDENTIFIER_MAX_LENGTH ||
    !FACTORY_IDENTIFIER_PATTERN.test(candidateId)
  ) {
    throw new Error(`Invalid candidate id '${candidateId}'.`);
  }
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isEexist(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "EEXIST"
  );
}

interface LockPayload {
  readonly candidateId: string;
  readonly acquiredAt: string;
}

/**
 * Atomic file-system-backed `FactoryRepository`. Every write goes through
 * a temp-file-then-rename so a reader never observes a partially written
 * file, and every move is a single logical transaction guarded by a
 * transaction marker so a crash mid-move is always recoverable via
 * `reconcile()`. Designed for later replacement by a database-backed
 * implementation of the same interface.
 */
export class FsFactoryRepository implements FactoryRepository {
  constructor(private readonly rootDir: string) {}

  async create(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
  ): Promise<CreateResult> {
    assertValidCandidateId(candidateId);

    const existingMetadata = await this.readMetadata(candidateId);
    if (existingMetadata) {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "duplicate_candidate",
        message: `Candidate '${candidateId}' already exists in compartment '${existingMetadata.compartment}'.`,
      };
    }

    const filePath = this.candidatePath(compartment, candidateId);
    const orphanedFile = await this.tryReadFile(filePath);
    if (orphanedFile !== undefined) {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "duplicate_candidate",
        message: `A file already exists at '${compartment}/${candidateId}.json' with no matching metadata record.`,
      };
    }

    await this.atomicWriteFile(filePath, JSON.stringify(data, null, 2));
    await this.writeMetadata({ candidateId, compartment, updatedAt: new Date().toISOString() });

    return { ok: true, candidateId, compartment };
  }

  /**
   * Reads and parses a candidate record. Fails closed on malformed JSON
   * rather than throwing an uncontrolled `SyntaxError`: the corrupted file
   * is quarantined (never overwriting an existing quarantined artefact —
   * see `quarantineCorruptedFile`) and `read()` returns `undefined`, the
   * same signal already used for "nothing readable at this location".
   * Corrupted content is never returned as if it were valid, and this
   * method never stages, reviews, or publishes anything.
   */
  async read(compartment: FactoryCompartment, candidateId: string): Promise<unknown | undefined> {
    assertValidCandidateId(candidateId);
    const filePath = this.candidatePath(compartment, candidateId);
    const raw = await this.tryReadFile(filePath);
    if (raw === undefined) return undefined;

    try {
      return JSON.parse(raw) as unknown;
    } catch (error) {
      if (compartment !== QUARANTINE_COMPARTMENT) {
        await this.quarantineCorruptedFile(compartment, candidateId, raw, error);
      }
      return undefined;
    }
  }

  async exists(compartment: FactoryCompartment, candidateId: string): Promise<boolean> {
    assertValidCandidateId(candidateId);
    return (await this.tryReadFile(this.candidatePath(compartment, candidateId))) !== undefined;
  }

  /**
   * Removes the full canonical record for a candidate: the compartment
   * data file (wherever it actually is — the caller-supplied compartment,
   * and separately the compartment metadata records if the two disagree,
   * so a candidate can't survive removal by existing in the "other"
   * directory), this candidate's own metadata record, and any in-flight
   * transaction marker it owns. Idempotent and safe to call on partial or
   * already-removed state (every step is a no-op if its target is
   * already gone). After a successful `remove()`, `create()` with the
   * same id is governed purely by its own duplicate-detection rules —
   * no stale metadata can make it fail. Never touches another
   * candidate's files, reports, or manifests.
   */
  async remove(compartment: FactoryCompartment, candidateId: string): Promise<void> {
    assertValidCandidateId(candidateId);

    const metadata = await this.readMetadata(candidateId);

    await fs.rm(this.candidatePath(compartment, candidateId), { force: true });
    if (metadata && metadata.compartment !== compartment) {
      await fs.rm(this.candidatePath(metadata.compartment, candidateId), { force: true });
    }

    await fs.rm(path.join(this.rootDir, METADATA_DIR, `${candidateId}.json`), { force: true });
    await this.clearTransactionMarker(candidateId);
  }

  async list(compartment: FactoryCompartment): Promise<readonly string[]> {
    const dir = this.compartmentDir(compartment);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch (error) {
      if (isEnoent(error)) return [];
      throw error;
    }
    return entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length))
      .sort();
  }

  async move(
    candidateId: string,
    from: FactoryCompartment,
    to: FactoryCompartment,
  ): Promise<MoveResult> {
    assertValidCandidateId(candidateId);
    if (from === to) {
      throw new Error(`move() requires 'from' and 'to' to differ (got '${from}' twice).`);
    }

    const lockOutcome = await this.acquireLock(candidateId);
    if (!lockOutcome.ok) {
      return {
        ok: false,
        candidateId,
        from,
        to,
        reason: "lock_timeout",
        message: lockOutcome.message,
      };
    }
    try {
      return await this.moveLocked(candidateId, from, to);
    } finally {
      await this.releaseLock(candidateId);
    }
  }

  /**
   * The actual move logic, run only while `move()` holds this candidate's
   * lock — see `acquireLock`/`releaseLock`. Read, expected-state
   * validation, and the atomic write/rename all happen here, under the
   * same lock, so two concurrent `move()` calls for the same candidate can
   * never both observe the pre-move state and race to write: one runs
   * this method to completion first: the other blocks in `acquireLock`
   * until the first releases, then re-reads metadata that already
   * reflects the first call's outcome.
   */
  private async moveLocked(
    candidateId: string,
    from: FactoryCompartment,
    to: FactoryCompartment,
  ): Promise<MoveResult> {
    const metadata = await this.readMetadata(candidateId);
    if (!metadata) {
      return {
        ok: false,
        candidateId,
        from,
        to,
        reason: "source_missing",
        message: `No known candidate '${candidateId}'.`,
      };
    }
    if (metadata.compartment === to) {
      // Already at the destination - most likely a replay of a move that
      // already completed (metadata is updated before the source is
      // removed, so this is the normal post-success state). Trust it only
      // if the destination file is actually there; otherwise fall through
      // to the mismatch below, since metadata and disk disagree.
      const alreadyThere = await this.tryReadFile(this.candidatePath(to, candidateId));
      if (alreadyThere !== undefined) {
        await fs.rm(this.candidatePath(from, candidateId), { force: true });
        await this.clearTransactionMarker(candidateId);
        return { ok: true, candidateId, from, to, replayed: true };
      }
    }

    if (metadata.compartment !== from) {
      return {
        ok: false,
        candidateId,
        from,
        to,
        reason: "state_metadata_mismatch",
        message: `Candidate '${candidateId}' is actually in '${metadata.compartment}', not '${from}'.`,
      };
    }

    const sourcePath = this.candidatePath(from, candidateId);
    const destinationPath = this.candidatePath(to, candidateId);

    const sourceContent = await this.tryReadFile(sourcePath);
    if (sourceContent === undefined) {
      return {
        ok: false,
        candidateId,
        from,
        to,
        reason: "source_missing",
        message: `Metadata says '${from}' but no file exists there.`,
      };
    }

    const destinationContent = await this.tryReadFile(destinationPath);
    if (destinationContent !== undefined) {
      if (destinationContent === sourceContent) {
        // Idempotent replay: the move already completed. Finish tidying
        // up (stale source / marker) and report success without
        // rewriting anything.
        await fs.rm(sourcePath, { force: true });
        await this.writeMetadata({ candidateId, compartment: to, updatedAt: new Date().toISOString() });
        await this.clearTransactionMarker(candidateId);
        return { ok: true, candidateId, from, to, replayed: true };
      }
      return {
        ok: false,
        candidateId,
        from,
        to,
        reason: "destination_exists",
        message: `A different candidate record already exists at '${to}/${candidateId}.json'.`,
      };
    }

    await this.writeTransactionMarker({ candidateId, from, to, startedAt: new Date().toISOString() });
    await this.atomicWriteFile(destinationPath, sourceContent);
    await this.writeMetadata({ candidateId, compartment: to, updatedAt: new Date().toISOString() });
    await fs.rm(sourcePath, { force: true });
    await this.clearTransactionMarker(candidateId);

    return { ok: true, candidateId, from, to, replayed: false };
  }

  /**
   * Rewrites a candidate's record in place within `compartment`, without
   * relocating it — the same-compartment counterpart to `move()`. A
   * single `atomicWriteFile` (temp-file-then-rename) already gives crash
   * safety here: unlike `move()`, there is only ever one file involved, so
   * no transaction marker is needed — a reader never observes a partially
   * written file, and an interruption before the rename leaves the
   * original record untouched.
   *
   * Content-hash-based idempotent replay, mirroring `move()`: if the
   * stored record already exactly matches `data` (by canonical,
   * key-order-independent hash — see `hashJson`), this is a safe replay of
   * an update that already completed, and nothing is rewritten. If
   * `options.expectedContentHash` is supplied and the currently stored
   * record's hash matches neither that value nor `data`'s own hash, the
   * write is refused as a conflict — the record changed out from under
   * the caller between its read and this call.
   *
   * Serialised per candidate via the same `acquireLock`/`releaseLock`
   * pair `move()` uses: the read, the expected-hash comparison, and the
   * atomic write all happen while holding the lock, so two concurrent
   * `update()` calls can never both pass the comparison against the same
   * pre-update content and silently overwrite each other. One completes
   * first; the other waits, then re-reads content that already reflects
   * the winner's write and — unless its own `data` happens to be a
   * byte-for-byte-equivalent replay — fails the hash comparison as a
   * genuine, deterministic conflict rather than winning by racing the
   * `atomicWriteFile` rename.
   */
  async update(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
    options: UpdateOptions = {},
  ): Promise<UpdateResult> {
    assertValidCandidateId(candidateId);

    const lockOutcome = await this.acquireLock(candidateId);
    if (!lockOutcome.ok) {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "lock_timeout",
        message: lockOutcome.message,
      };
    }
    try {
      return await this.updateLocked(compartment, candidateId, data, options);
    } finally {
      await this.releaseLock(candidateId);
    }
  }

  private async updateLocked(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
    options: UpdateOptions,
  ): Promise<UpdateResult> {
    const filePath = this.candidatePath(compartment, candidateId);

    const existingRaw = await this.tryReadFile(filePath);
    if (existingRaw === undefined) {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "source_missing",
        message: `No candidate record exists at '${compartment}/${candidateId}.json'.`,
      };
    }

    let existingParsed: unknown;
    try {
      existingParsed = JSON.parse(existingRaw);
    } catch {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "state_mismatch",
        message: `Existing record at '${compartment}/${candidateId}.json' is not valid JSON and cannot be safely updated in place.`,
      };
    }

    const existingHash = hashJson(existingParsed);
    const newHash = hashJson(data);
    if (existingHash === newHash) {
      // Idempotent replay: an earlier call already wrote this exact
      // logical content (possibly under a different key order or
      // whitespace), so there is nothing left to do.
      return { ok: true, candidateId, compartment, replayed: true };
    }

    if (options.expectedContentHash !== undefined && existingHash !== options.expectedContentHash) {
      return {
        ok: false,
        candidateId,
        compartment,
        reason: "state_mismatch",
        message: `Candidate '${candidateId}' in '${compartment}' no longer matches the content the caller last read — it was modified by another process between read and update.`,
      };
    }

    await this.atomicWriteFile(filePath, JSON.stringify(data, null, 2));

    const metadata = await this.readMetadata(candidateId);
    if (metadata && metadata.compartment === compartment) {
      await this.writeMetadata({ candidateId, compartment, updatedAt: new Date().toISOString() });
    }

    return { ok: true, candidateId, compartment, replayed: false };
  }

  async reconcile(): Promise<ReconciliationReport> {
    const entries: ReconciliationEntry[] = [];
    const transactionsDir = path.join(this.rootDir, TRANSACTIONS_DIR);

    let markerFiles: string[];
    try {
      markerFiles = await fs.readdir(transactionsDir);
    } catch (error) {
      if (isEnoent(error)) markerFiles = [];
      else throw error;
    }

    for (const fileName of markerFiles.filter((name) => name.endsWith(".json")).sort()) {
      const candidateId = fileName.slice(0, -".json".length);
      const markerPath = path.join(transactionsDir, fileName);

      let marker: TransactionMarker;
      try {
        marker = JSON.parse(await fs.readFile(markerPath, "utf8")) as TransactionMarker;
      } catch {
        await fs.rm(markerPath, { force: true });
        continue;
      }

      const destinationExists =
        (await this.tryReadFile(this.candidatePath(marker.to, candidateId))) !== undefined;

      if (destinationExists) {
        // The atomic rename to the destination already completed
        // durably before the interruption - finish the move.
        await fs.rm(this.candidatePath(marker.from, candidateId), { force: true });
        await this.writeMetadata({
          candidateId,
          compartment: marker.to,
          updatedAt: new Date().toISOString(),
        });
        await fs.rm(markerPath, { force: true });
        entries.push({
          candidateId,
          action: "completed_interrupted_move",
          from: marker.from,
          to: marker.to,
        });
      } else {
        // The destination never became durable, so the source was never
        // touched - roll back by discarding any partial temp file and
        // clearing the marker.
        await this.removeStrayTempFiles(marker.to, candidateId);
        await fs.rm(markerPath, { force: true });
        entries.push({
          candidateId,
          action: "rolled_back_interrupted_move",
          from: marker.from,
          to: marker.to,
        });
      }
    }

    return { entries, generatedAt: new Date().toISOString() };
  }

  private compartmentDir(compartment: FactoryCompartment): string {
    return path.join(this.rootDir, ...compartment.split("/"));
  }

  private candidatePath(compartment: FactoryCompartment, candidateId: string): string {
    return path.join(this.compartmentDir(compartment), `${candidateId}.json`);
  }

  private async tryReadFile(filePath: string): Promise<string | undefined> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (isEnoent(error)) return undefined;
      throw error;
    }
  }

  private async atomicWriteFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp-${randomUUID()}`;
    await fs.writeFile(tempPath, content, "utf8");
    await fs.rename(tempPath, filePath);
  }

  /**
   * Reads this candidate's metadata sidecar. Fails closed rather than
   * throwing: unparsable JSON, or JSON that parses but does not describe a
   * usable record (missing candidateId, or `compartment` naming something
   * other than one of `FACTORY_COMPARTMENTS`), is treated the same as no
   * metadata at all — callers already handle "no metadata" safely, and a
   * record that cannot be trusted for any decision must never be used for
   * one (e.g. blindly building a filesystem path from an invalid
   * `compartment` value).
   */
  private async readMetadata(candidateId: string): Promise<CandidateMetadata | undefined> {
    const raw = await this.tryReadFile(path.join(this.rootDir, METADATA_DIR, `${candidateId}.json`));
    if (raw === undefined) return undefined;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return undefined;
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("candidateId" in parsed) ||
      !("compartment" in parsed) ||
      typeof (parsed as { candidateId: unknown }).candidateId !== "string" ||
      (parsed as { candidateId: string }).candidateId.length === 0 ||
      typeof (parsed as { compartment: unknown }).compartment !== "string" ||
      !isFactoryCompartment((parsed as { compartment: string }).compartment)
    ) {
      return undefined;
    }

    return parsed as CandidateMetadata;
  }

  private async writeMetadata(metadata: CandidateMetadata): Promise<void> {
    await this.atomicWriteFile(
      path.join(this.rootDir, METADATA_DIR, `${metadata.candidateId}.json`),
      JSON.stringify(metadata, null, 2),
    );
  }

  private async writeTransactionMarker(marker: TransactionMarker): Promise<void> {
    await this.atomicWriteFile(
      path.join(this.rootDir, TRANSACTIONS_DIR, `${marker.candidateId}.json`),
      JSON.stringify(marker, null, 2),
    );
  }

  private async clearTransactionMarker(candidateId: string): Promise<void> {
    await fs.rm(path.join(this.rootDir, TRANSACTIONS_DIR, `${candidateId}.json`), { force: true });
  }

  private lockPath(candidateId: string): string {
    return path.join(this.rootDir, LOCKS_DIR, `${candidateId}.lock`);
  }

  /**
   * Acquires a durable, candidate-scoped, cross-process-safe lock: `fs.open`
   * with the `wx` flag (`O_CREAT | O_EXCL`) is a single atomic syscall on
   * every platform Node supports, including Windows — no in-memory mutex,
   * which would only serialise callers within this one process and do
   * nothing for two separate processes (or two separate
   * `FsFactoryRepository` instances) pointed at the same `rootDir`.
   *
   * Retries on contention (`EEXIST`) with a short poll interval, checking
   * staleness on every retry — a lock older than `LOCK_STALE_MS` is
   * assumed to belong to a crashed or hung holder and is removed so
   * acquisition can proceed, the same "recover from an interrupted
   * operation" principle `reconcile()` applies to transaction markers.
   * Fails closed with a deterministic `lock_timeout` reason (never hangs
   * indefinitely) if the lock cannot be acquired within `LOCK_MAX_WAIT_MS`.
   */
  private async acquireLock(
    candidateId: string,
  ): Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }> {
    const lockPath = this.lockPath(candidateId);
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    const deadline = Date.now() + LOCK_MAX_WAIT_MS;

    for (;;) {
      try {
        const handle = await fs.open(lockPath, "wx");
        try {
          const payload: LockPayload = { candidateId, acquiredAt: new Date().toISOString() };
          await handle.writeFile(JSON.stringify(payload), "utf8");
        } finally {
          await handle.close();
        }
        return { ok: true };
      } catch (error) {
        if (!isEexist(error)) throw error;

        if (await this.removeLockIfStale(lockPath)) {
          continue; // The stale lock is now gone - retry immediately.
        }
        if (Date.now() >= deadline) {
          return {
            ok: false,
            message: `Timed out after ${LOCK_MAX_WAIT_MS}ms waiting for the lock on candidate '${candidateId}' — another operation is still in progress.`,
          };
        }
        await sleep(LOCK_RETRY_DELAY_MS);
      }
    }
  }

  private async releaseLock(candidateId: string): Promise<void> {
    await fs.rm(this.lockPath(candidateId), { force: true });
  }

  /** Removes `lockPath` if it is missing, unparsable, or older than `LOCK_STALE_MS`; returns whether the path is now free. */
  private async removeLockIfStale(lockPath: string): Promise<boolean> {
    const raw = await this.tryReadFile(lockPath);
    if (raw === undefined) return true;

    let acquiredAtMs = Number.NaN;
    try {
      const parsed = JSON.parse(raw) as Partial<LockPayload>;
      if (typeof parsed.acquiredAt === "string") acquiredAtMs = Date.parse(parsed.acquiredAt);
    } catch {
      // Unparsable lock content is treated as stale below (Number.NaN comparison is always false, so falls through to removal).
    }

    if (Number.isNaN(acquiredAtMs) || Date.now() - acquiredAtMs > LOCK_STALE_MS) {
      await fs.rm(lockPath, { force: true });
      return true;
    }
    return false;
  }

  private async removeStrayTempFiles(
    compartment: FactoryCompartment,
    candidateId: string,
  ): Promise<void> {
    const dir = this.compartmentDir(compartment);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch (error) {
      if (isEnoent(error)) return;
      throw error;
    }
    const prefix = `${candidateId}.json.tmp-`;
    await Promise.all(
      entries
        .filter((name) => name.startsWith(prefix))
        .map((name) => fs.rm(path.join(dir, name), { force: true })),
    );
  }

  /**
   * Quarantines a candidate file that failed `JSON.parse`. Transactional in
   * the same sense as `move()`: the corrupted bytes are written to the
   * quarantine destination atomically and durably *before* the source is
   * removed, so an interruption between those two steps always leaves a
   * state this method can safely finish on a later call — the destination
   * check below is content-based, so re-running against the same
   * corrupted bytes is a no-op replay, never a second write.
   *
   * Never overwrites an existing quarantined artefact: if
   * `quarantined/<candidateId>.json` already holds *different* bytes (a
   * separate corruption event, or a legitimately quarantined candidate
   * that happens to share this id), the new artefact is written under a
   * content-hash-suffixed name instead — deterministic, so retries of the
   * same corruption event still converge on one file rather than
   * accumulating duplicates.
   */
  private async quarantineCorruptedFile(
    sourceCompartment: FactoryCompartment,
    candidateId: string,
    rawContent: string,
    parseError: unknown,
  ): Promise<void> {
    const primaryDestPath = this.candidatePath(QUARANTINE_COMPARTMENT, candidateId);
    const existingAtPrimary = await this.tryReadFile(primaryDestPath);

    let destPath = primaryDestPath;
    let destFileName = `${candidateId}.json`;
    if (existingAtPrimary !== undefined && existingAtPrimary !== rawContent) {
      const contentHash = createHash("sha256").update(rawContent, "utf8").digest("hex").slice(0, 10);
      destFileName = `${candidateId}--corrupt-${contentHash}.json`;
      destPath = path.join(this.compartmentDir(QUARANTINE_COMPARTMENT), destFileName);
    }

    const existingAtDest = await this.tryReadFile(destPath);
    if (existingAtDest === undefined) {
      await this.atomicWriteFile(destPath, rawContent);
    } else if (existingAtDest !== rawContent) {
      // The hash-suffixed name is expected to be collision-free; if it
      // somehow still disagrees, do not overwrite and do not remove the
      // source — surface nothing worse than "quarantine could not
      // complete", leaving the corrupted source in place for a future
      // retry rather than losing data.
      return;
    }

    await fs.rm(this.candidatePath(sourceCompartment, candidateId), { force: true });

    const metadata = await this.readMetadata(candidateId);
    if (metadata && metadata.compartment === sourceCompartment) {
      await this.writeMetadata({
        candidateId,
        compartment: QUARANTINE_COMPARTMENT,
        updatedAt: new Date().toISOString(),
      });
    }

    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    const report: CorruptionReport = {
      candidateId,
      sourceCompartment,
      quarantinedFileName: destFileName,
      errorCategory: "json_parse_error",
      errorMessage: errorMessage.slice(0, CORRUPTION_PREVIEW_MAX_LENGTH),
      contentPreview:
        rawContent.length > CORRUPTION_PREVIEW_MAX_LENGTH
          ? `${rawContent.slice(0, CORRUPTION_PREVIEW_MAX_LENGTH)}…`
          : rawContent,
      quarantinedAt: new Date().toISOString(),
    };
    await this.atomicWriteFile(
      path.join(this.rootDir, QUARANTINE_REPORTS_DIR, `${destFileName.slice(0, -".json".length)}.json`),
      JSON.stringify(report, null, 2),
    );
  }
}
