/**
 * `questions:ingest` — Mission 3A manual/external inbox ingestion CLI.
 *
 * Scans `content/question-factory/inbox/` (or `--inbox <path>`) for
 * human-dropped candidate JSON files, stamps `manual_external` provenance
 * with a normalised, independently-resolved generator identity, and
 * creates each valid candidate at the `generated` lifecycle state.
 * Malformed or unsupported-shape files are quarantined, never left to
 * re-fail identically on every future run. Never runs any later gate —
 * ingestion always ends at `generated` (contract §6).
 *
 * Exit codes: 0 clean (every file processed, no candidate rejected),
 * 3 partial (some file quarantined or some candidate rejected — the run
 * itself still completed), 2 invalid arguments/request, 9 lock timeout,
 * 1 internal error.
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { runManualIngestion } from "../src/features/question-factory/manual-ingestion";
import type { ManualIngestionRunRequest } from "../src/features/question-factory/manual-ingestion";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

const MANUAL_SOURCES = ["chatgpt", "qwen", "claude", "other"] as const;

interface ParsedArgs {
  readonly source: (typeof MANUAL_SOURCES)[number];
  readonly model?: string;
  readonly batchId: string;
  readonly promptVersion: string;
  readonly promptHash?: string;
  readonly blueprintId?: string;
  readonly pipelineRunId?: string;
  readonly inbox?: string;
  readonly dryRun: boolean;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:ingest --source chatgpt|qwen|claude|other --batch-id <id> --prompt-version <v> [options]",
      "",
      "  --source <name>          Required. One of chatgpt, qwen, claude, other.",
      "  --model <name>           Required for --source other; optional override otherwise.",
      "  --batch-id <id>          Required.",
      "  --prompt-version <v>     Required.",
      "  --prompt-hash <hash>     Optional — cross-checked against a real issued prompt pack when present.",
      "  --blueprint-id <id>      Optional.",
      "  --pipeline-run-id <id>   Optional (defaults to '<batch-id>-ingest-manual').",
      "  --inbox <path>           Optional inbox root override (default: central config path).",
      "  --dry-run                Simulate the run; no repository writes, inbox left untouched.",
      "  --json                   Emit a single machine-readable JSON result line to stdout.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let source: string | undefined;
  let model: string | undefined;
  let batchId: string | undefined;
  let promptVersion: string | undefined;
  let promptHash: string | undefined;
  let blueprintId: string | undefined;
  let pipelineRunId: string | undefined;
  let inbox: string | undefined;
  let dryRun = false;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--source":
        source = argv[++index];
        break;
      case "--model":
        model = argv[++index];
        break;
      case "--batch-id":
        batchId = argv[++index];
        break;
      case "--prompt-version":
        promptVersion = argv[++index];
        break;
      case "--prompt-hash":
        promptHash = argv[++index];
        break;
      case "--blueprint-id":
        blueprintId = argv[++index];
        break;
      case "--pipeline-run-id":
        pipelineRunId = argv[++index];
        break;
      case "--inbox":
        inbox = argv[++index];
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--json":
        json = true;
        break;
      case "--help":
      case "-h":
        return undefined;
      default:
        process.stderr.write(`Unrecognised argument: ${arg}\n`);
        return undefined;
    }
  }

  if (!source || !MANUAL_SOURCES.includes(source as (typeof MANUAL_SOURCES)[number])) {
    process.stderr.write("--source is required and must be one of chatgpt, qwen, claude, other.\n");
    return undefined;
  }
  if (source === "other" && !model) {
    process.stderr.write("--model is required when --source is 'other'.\n");
    return undefined;
  }
  if (!batchId) {
    process.stderr.write("--batch-id is required.\n");
    return undefined;
  }
  if (!promptVersion) {
    process.stderr.write("--prompt-version is required.\n");
    return undefined;
  }

  return {
    source: source as (typeof MANUAL_SOURCES)[number],
    model,
    batchId,
    promptVersion,
    promptHash,
    blueprintId,
    pipelineRunId,
    inbox,
    dryRun,
    json,
  };
}

function emit(json: boolean, payload: Record<string, unknown>): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (payload.status === "completed") {
    const result = payload.result as {
      filesScanned: number;
      filesProcessed: number;
      filesQuarantined: number;
      candidatesCreated: number;
      candidatesReplayed: number;
      candidatesRejected: number;
      dryRun: boolean;
    };
    process.stdout.write(
      [
        `Ingestion ${result.dryRun ? "(dry run) " : ""}complete for batch '${payload.batchId as string}':`,
        `  files scanned:        ${result.filesScanned}`,
        `  files processed:      ${result.filesProcessed}`,
        `  files quarantined:    ${result.filesQuarantined}`,
        `  candidates created:   ${result.candidatesCreated}`,
        `  candidates replayed:  ${result.candidatesReplayed}`,
        `  candidates rejected:  ${result.candidatesRejected}`,
        "",
      ].join("\n"),
    );
  } else {
    process.stderr.write(`${payload.errorCode ?? payload.status}: ${payload.message}\n`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());
  const request: ManualIngestionRunRequest = {
    source: args.source,
    model: args.model,
    batchId: args.batchId,
    promptVersion: args.promptVersion,
    promptHash: args.promptHash,
    blueprintId: args.blueprintId,
    pipelineRunId: args.pipelineRunId ?? `${args.batchId}-ingest-manual`,
    dryRun: args.dryRun,
    inboxRoot: args.inbox,
  };

  let outcome;
  try {
    outcome = await runManualIngestion(request, repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "internal_error", errorCode: "internal_error", message });
    return 1;
  }

  if (outcome.status === "request_invalid") {
    emit(args.json, { status: outcome.status, errorCode: outcome.issueCode, message: outcome.message });
    return 2;
  }
  if (outcome.status === "lock_timeout") {
    emit(args.json, { status: outcome.status, errorCode: "ingestion_lock_timeout", message: outcome.message });
    return 9;
  }

  emit(args.json, { status: "completed", batchId: args.batchId, result: outcome.result });
  const hasPartialFailure = outcome.result.filesQuarantined > 0 || outcome.result.candidatesRejected > 0;
  return hasPartialFailure ? 3 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`internal_error: ${message}\n`);
    process.exitCode = 1;
  });
