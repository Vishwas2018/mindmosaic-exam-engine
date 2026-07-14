import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { FACTORY_LIMITS, getInboxRoot } from "../config";
import { hashContent } from "../provenance";
import { factoryIdentifierSchema } from "../shared/identifiers";
import type { FactoryRepository } from "../storage";
import { parseInboxFileContent } from "./candidate-envelope";
import { resolveDeclaredIdentity } from "./identity";
import { ingestOneCandidate } from "./ingest";
import type {
  InboxFileIngestionResult,
  ManualCandidateIngestionResult,
  ManualIngestionRunOutcome,
  ManualIngestionRunRequest,
  ManualIngestionRunResult,
} from "./types";

const DEFAULT_LOCK_MAX_WAIT_MS = 5_000;
const DEFAULT_LOCK_RETRY_DELAY_MS = 20;
const QUARANTINE_PREVIEW_MAX_LENGTH = 200;

export interface RunManualIngestionOptions {
  readonly lockMaxWaitMs?: number;
  readonly lockRetryDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "ENOENT";
}

function isEexist(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "EEXIST";
}

/** Direct-child `.json` file name — never a path with separators or `..`, even though `fs.readdir` cannot produce one; defence in depth against a future refactor that stops using `readdir`. */
function isSafeFileName(name: string): boolean {
  if (name.length === 0 || name.length > 255) return false;
  if (!name.endsWith(".json")) return false;
  if (name.includes("/") || name.includes("\\")) return false;
  if (name === ".." || name === ".") return false;
  return true;
}

async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${randomUUID()}`;
  await fs.writeFile(tempPath, content, "utf8");
  await fs.rename(tempPath, filePath);
}

async function acquireScanLock(
  lockRoot: string,
  maxWaitMs: number,
  retryDelayMs: number,
): Promise<{ readonly ok: true; readonly release: () => Promise<void> } | { readonly ok: false }> {
  await fs.mkdir(lockRoot, { recursive: true });
  const lockPath = path.join(lockRoot, "scan.lock");
  const token = randomUUID();
  const deadline = Date.now() + maxWaitMs;

  for (;;) {
    try {
      const handle = await fs.open(lockPath, "wx");
      try {
        await handle.writeFile(JSON.stringify({ token, acquiredAt: new Date().toISOString() }), "utf8");
      } finally {
        await handle.close();
      }
      return {
        ok: true,
        release: async () => {
          try {
            const raw = await fs.readFile(lockPath, "utf8");
            const payload = JSON.parse(raw) as { token?: string };
            if (payload.token === token) {
              await fs.rm(lockPath, { force: true });
            }
          } catch {
            // Lock already gone or unreadable — nothing further to release.
          }
        },
      };
    } catch (error) {
      if (!isEexist(error)) throw error;
      if (Date.now() >= deadline) return { ok: false };
      await sleep(retryDelayMs);
    }
  }
}

async function listDirectChildJsonFiles(dir: string): Promise<readonly string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if (isEnoent(error)) return [];
    throw error;
  }
  const files: string[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const stats = await fs.stat(path.join(dir, name)).catch(() => undefined);
    if (stats?.isFile()) files.push(name);
  }
  return files.sort();
}

async function writeQuarantineReport(
  quarantineRoot: string,
  fileName: string,
  issueCode: string,
  message: string,
  rawContentPreview: string,
): Promise<void> {
  const report = {
    fileName,
    issueCode,
    message: message.slice(0, FACTORY_LIMITS.MAX_QUARANTINE_REPORT_BYTES),
    contentPreview:
      rawContentPreview.length > QUARANTINE_PREVIEW_MAX_LENGTH
        ? `${rawContentPreview.slice(0, QUARANTINE_PREVIEW_MAX_LENGTH)}…`
        : rawContentPreview,
    quarantinedAt: new Date().toISOString(),
  };
  const reportPath = path.join(quarantineRoot, `${fileName}.quarantine-report.json`);
  await atomicWriteFile(reportPath, JSON.stringify(report, null, 2));
}

/**
 * Processes one already-claimed inbox file (its bytes currently sit at
 * `claimedPath`): read -> parse -> per-candidate ingest -> move to
 * `processed/` on structural success or `quarantine/` (with a bounded
 * report) on a file-level parse failure. A per-candidate rejection (e.g.
 * `candidate_conflict`) never quarantines the file — the file itself
 * parsed correctly; only the individual candidate is rejected, per the
 * "one bad element never blocks the rest" independence rule (contract §6).
 */
async function processClaimedFile(
  fileName: string,
  claimedPath: string,
  request: ManualIngestionRunRequest,
  repository: FactoryRepository,
  quarantineRoot: string,
  processedRoot: string,
  recovered: boolean,
): Promise<InboxFileIngestionResult> {
  const raw = await fs.readFile(claimedPath, "utf8");

  const declaredIdentity = resolveDeclaredIdentity(request)!; // already validated by the caller before any file is claimed

  const parsed = parseInboxFileContent(raw);
  if (!parsed.ok) {
    await writeQuarantineReport(quarantineRoot, fileName, parsed.issueCode, parsed.message, raw);
    await fs.mkdir(quarantineRoot, { recursive: true });
    await fs.rename(claimedPath, path.join(quarantineRoot, fileName));
    return {
      fileName,
      outcome: "quarantined",
      candidateResults: [],
      quarantineIssueCode: parsed.issueCode,
      quarantineMessage: parsed.message,
      recovered,
    };
  }

  const sourceContentHash = hashContent(raw);
  const candidateResults: ManualCandidateIngestionResult[] = [];
  for (const [index, candidateContent] of parsed.candidates.entries()) {
    candidateResults.push(
      await ingestOneCandidate(
        request,
        declaredIdentity,
        candidateContent,
        index,
        fileName,
        sourceContentHash,
        repository,
      ),
    );
  }

  if (!request.dryRun) {
    await fs.mkdir(processedRoot, { recursive: true });
    await fs.rename(claimedPath, path.join(processedRoot, fileName));
  }

  return { fileName, outcome: "processed", candidateResults, recovered };
}

/**
 * The Mission 3A inbox transaction: acquire a global scan lock -> resolve
 * and validate run-level metadata (source identity, batch/pipeline ids) ->
 * resolve any `.processing` markers left by a crashed prior run -> scan
 * and claim every direct-child `*.json` file in the inbox root -> process
 * each to completion (`processed/` or `quarantine/`) -> release the lock.
 *
 * `dryRun` skips claiming entirely (files are read in place, nothing is
 * renamed, and `ingestOneCandidate` itself skips repository writes) so the
 * inbox and repository are provably unchanged (contract §17).
 */
export async function runManualIngestion(
  request: ManualIngestionRunRequest,
  repository: FactoryRepository,
  options: RunManualIngestionOptions = {},
): Promise<ManualIngestionRunOutcome> {
  const declaredIdentity = resolveDeclaredIdentity(request);
  if (!declaredIdentity) {
    return {
      status: "request_invalid",
      issueCode: "source_identity_invalid",
      message:
        request.source === "other"
          ? "source 'other' requires an explicit --model that resolves through the identity-alias table."
          : `Declared model '${request.model ?? request.source}' does not resolve through the identity-alias table.`,
    };
  }
  if (request.promptVersion.trim().length === 0) {
    return { status: "request_invalid", issueCode: "prompt_metadata_missing", message: "promptVersion is required." };
  }
  for (const [label, value] of [
    ["batchId", request.batchId],
    ["pipelineRunId", request.pipelineRunId],
    ["blueprintId", request.blueprintId],
  ] as const) {
    if (value === undefined) continue;
    if (!factoryIdentifierSchema.safeParse(value).success) {
      return {
        status: "request_invalid",
        issueCode: "inbox_file_invalid",
        message: `${label} '${value}' is not a valid factory identifier.`,
      };
    }
  }

  if (request.promptHash !== undefined) {
    const promptPackReportId = `prompt-pack-${request.batchId}`;
    const storedPack = (await repository.read("reports", promptPackReportId)) as
      | { readonly promptHash?: string; readonly pack?: { readonly promptVersion?: string } }
      | undefined;
    if (storedPack !== undefined) {
      const mismatchedHash = storedPack.promptHash !== undefined && storedPack.promptHash !== request.promptHash;
      const mismatchedVersion =
        storedPack.pack?.promptVersion !== undefined && storedPack.pack.promptVersion !== request.promptVersion;
      if (mismatchedHash || mismatchedVersion) {
        return {
          status: "request_invalid",
          issueCode: "prompt_pack_reference_mismatch",
          message: `Declared promptHash/promptVersion do not match the prompt pack actually issued for batch '${request.batchId}'.`,
        };
      }
    }
  }

  const inboxRoot = request.inboxRoot ?? getInboxRoot();
  const processingRoot = path.join(inboxRoot, ".processing");
  const processedRoot = path.join(inboxRoot, "processed");
  const quarantineRoot = path.join(inboxRoot, "quarantine");
  const lockRoot = path.join(inboxRoot, ".locks");

  const lock = await acquireScanLock(
    lockRoot,
    options.lockMaxWaitMs ?? DEFAULT_LOCK_MAX_WAIT_MS,
    options.lockRetryDelayMs ?? DEFAULT_LOCK_RETRY_DELAY_MS,
  );
  if (!lock.ok) {
    return { status: "lock_timeout", message: "Timed out waiting for the inbox scan lock — another questions:ingest run is in progress." };
  }

  try {
    const fileResults: InboxFileIngestionResult[] = [];

    // Recovery pass: files still sitting under `.processing/` from a run
    // interrupted after claim but before completion. Re-processing is
    // always safe here because every downstream step is itself
    // idempotent-replay-safe (`ingestOneCandidate`'s content-hash check,
    // `fs.rename`'s destination-exists handling below).
    if (!request.dryRun) {
      const strandedFiles = await listDirectChildJsonFiles(processingRoot);
      for (const fileName of strandedFiles) {
        if (!isSafeFileName(fileName)) continue;
        fileResults.push(
          await processClaimedFile(
            fileName,
            path.join(processingRoot, fileName),
            request,
            repository,
            quarantineRoot,
            processedRoot,
            true,
          ),
        );
      }
    }

    const inboxFiles = await listDirectChildJsonFiles(inboxRoot);
    if (inboxFiles.length > FACTORY_LIMITS.MAX_INBOX_FILES_PER_SCAN) {
      return {
        status: "request_invalid",
        issueCode: "inbox_file_limit_exceeded",
        message: `Inbox contains ${inboxFiles.length} files, exceeding the ${FACTORY_LIMITS.MAX_INBOX_FILES_PER_SCAN}-file scan bound.`,
      };
    }

    for (const fileName of inboxFiles) {
      if (!isSafeFileName(fileName)) {
        fileResults.push({
          fileName,
          outcome: "quarantined",
          candidateResults: [],
          quarantineIssueCode: "path_outside_allowed_root",
          quarantineMessage: `Rejected unsafe inbox file name '${fileName}'.`,
          recovered: false,
        });
        continue;
      }

      const sourcePath = path.join(inboxRoot, fileName);
      const stats = await fs.stat(sourcePath).catch(() => undefined);
      if (stats === undefined) continue; // Vanished between listing and stat — nothing to process.

      if (stats.size > FACTORY_LIMITS.MAX_INBOX_FILE_BYTES) {
        await fs.mkdir(quarantineRoot, { recursive: true });
        await writeQuarantineReport(
          quarantineRoot,
          fileName,
          "inbox_file_too_large",
          `File is ${stats.size} bytes, exceeding the ${FACTORY_LIMITS.MAX_INBOX_FILE_BYTES}-byte bound.`,
          "",
        );
        await fs.rename(sourcePath, path.join(quarantineRoot, fileName));
        fileResults.push({
          fileName,
          outcome: "quarantined",
          candidateResults: [],
          quarantineIssueCode: "inbox_file_too_large",
          quarantineMessage: `File is ${stats.size} bytes, exceeding the ${FACTORY_LIMITS.MAX_INBOX_FILE_BYTES}-byte bound.`,
          recovered: false,
        });
        continue;
      }

      if (request.dryRun) {
        // Never claim/rename under dry-run — read and simulate in place.
        fileResults.push(await processClaimedFile(fileName, sourcePath, request, repository, quarantineRoot, processedRoot, false));
        continue;
      }

      await fs.mkdir(processingRoot, { recursive: true });
      const claimedPath = path.join(processingRoot, fileName);
      await fs.rename(sourcePath, claimedPath);
      fileResults.push(await processClaimedFile(fileName, claimedPath, request, repository, quarantineRoot, processedRoot, false));
    }

    const candidatesCreated = fileResults.reduce(
      (total, file) => total + file.candidateResults.filter((result) => result.status === "accepted" && result.written).length,
      0,
    );
    const candidatesReplayed = fileResults.reduce(
      (total, file) => total + file.candidateResults.filter((result) => result.status === "accepted" && result.replay).length,
      0,
    );
    const candidatesRejected = fileResults.reduce(
      (total, file) => total + file.candidateResults.filter((result) => result.status === "rejected").length,
      0,
    );

    const result: ManualIngestionRunResult = {
      batchId: request.batchId,
      dryRun: request.dryRun ?? false,
      filesScanned: fileResults.length,
      filesProcessed: fileResults.filter((file) => file.outcome === "processed").length,
      filesQuarantined: fileResults.filter((file) => file.outcome === "quarantined").length,
      candidatesCreated,
      candidatesReplayed,
      candidatesRejected,
      fileResults,
    };
    return { status: "completed", result };
  } finally {
    await lock.release();
  }
}
