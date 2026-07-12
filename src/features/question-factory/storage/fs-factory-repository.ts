import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { FACTORY_LIMITS } from "../config";
import { FACTORY_IDENTIFIER_PATTERN } from "../shared/identifiers";
import { isFactoryCompartment } from "./compartments";
import type { FactoryCompartment } from "./compartments";
import type {
  CreateResult,
  FactoryRepository,
  MoveResult,
  ReconciliationEntry,
  ReconciliationReport,
} from "./factory-repository";

const METADATA_DIR = ".metadata";
const TRANSACTIONS_DIR = ".transactions";
const QUARANTINE_REPORTS_DIR = ".quarantine-reports";
const QUARANTINE_COMPARTMENT = "quarantined";
const CORRUPTION_PREVIEW_MAX_LENGTH = 120;

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
