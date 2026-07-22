/**
 * `questions:generate-ai` — pluggable-provider generation CLI.
 *
 * Closes the factory's one manual seam for generation: builds the same
 * versioned prompt pack `questions:prompt` builds, calls the configured AI
 * provider (`QF_AI_PROVIDER=anthropic|openai`, contract:
 * `src/features/question-factory/ai/provider.ts`), and pipes the parsed
 * candidates straight into manual ingestion (`runManualIngestion` — the
 * same function `questions:ingest` calls) — no paste-into-a-chat-UI step,
 * no change to ingestion's own validation/quarantine behaviour.
 *
 * If no provider key is configured this stops cleanly with a
 * configuration message — it never crashes and never fabricates a
 * candidate. On malformed provider output, ingestion is never attempted.
 *
 * Exit codes: 0 ok (every candidate ingested clean), 1 internal error,
 * 2 invalid arguments/blueprint/no provider configured, 3 partial (some
 * candidate rejected/quarantined — the run itself still completed),
 * 4 not found, 6 provider request failed, 7 provider returned malformed
 * output, 9 ingestion lock timeout.
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { createConfiguredProvider } from "../src/features/question-factory/ai";
import { buildGenerationPromptPack } from "../src/features/question-factory/generation";
import { runManualIngestion } from "../src/features/question-factory/manual-ingestion";
import type { ManualIngestionRunRequest } from "../src/features/question-factory/manual-ingestion";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly blueprintFile?: string;
  readonly blueprintId?: string;
  readonly batchId?: string;
  readonly pipelineRunId?: string;
  readonly inbox?: string;
  readonly dryRun: boolean;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:generate-ai --blueprint <file> | --blueprint-id <id> | --batch-id <id> [options]",
      "",
      "  --blueprint <file>       Build against a single blueprint JSON file on disk.",
      "  --blueprint-id <id>      Build against a blueprint already persisted in the repository.",
      "  --batch-id <id>          Build against every persisted blueprint in this batch.",
      "  --pipeline-run-id <id>   Optional (defaults to '<batch-id>-generate-ai').",
      "  --inbox <path>           Optional inbox root override (default: central config path).",
      "  --dry-run                Simulate ingestion; no repository writes, inbox left untouched.",
      "  --json                   Emit a single machine-readable JSON result line to stdout.",
      "",
      "Requires QF_AI_PROVIDER=anthropic|openai and the matching ANTHROPIC_API_KEY/OPENAI_API_KEY.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let blueprintFile: string | undefined;
  let blueprintId: string | undefined;
  let batchId: string | undefined;
  let pipelineRunId: string | undefined;
  let inbox: string | undefined;
  let dryRun = false;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--blueprint":
        blueprintFile = argv[++index];
        break;
      case "--blueprint-id":
        blueprintId = argv[++index];
        break;
      case "--batch-id":
        batchId = argv[++index];
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

  const modesSelected = [blueprintFile, blueprintId, batchId].filter((value) => value !== undefined).length;
  if (modesSelected !== 1) {
    process.stderr.write("Exactly one of --blueprint, --blueprint-id, or --batch-id is required.\n");
    return undefined;
  }

  return { blueprintFile, blueprintId, batchId, pipelineRunId, inbox, dryRun, json };
}

interface ResultPayload {
  readonly ok: boolean;
  readonly batchId?: string;
  readonly candidateCount?: number;
  readonly errorCode?: string;
  readonly message?: string;
  readonly result?: unknown;
}

function emit(json: boolean, payload: ResultPayload): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (!payload.ok) {
    process.stderr.write(`${payload.errorCode}: ${payload.message}\n`);
    return;
  }
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
      `Generated ${payload.candidateCount} candidate(s) for batch '${payload.batchId}' and ${result.dryRun ? "simulated " : ""}ingested them:`,
      `  files processed:      ${result.filesProcessed}`,
      `  files quarantined:    ${result.filesQuarantined}`,
      `  candidates created:   ${result.candidatesCreated}`,
      `  candidates replayed:  ${result.candidatesReplayed}`,
      `  candidates rejected:  ${result.candidatesRejected}`,
      "",
    ].join("\n"),
  );
}

async function loadBlueprintFile(filePath: string): Promise<unknown> {
  const fs = await import("node:fs/promises");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const providerOutcome = createConfiguredProvider();
  if (!providerOutcome.ok) {
    emit(args.json, { ok: false, errorCode: "provider_not_configured", message: providerOutcome.message });
    return 2;
  }
  const provider = providerOutcome.provider;

  const path = await import("node:path");
  const repository = new FsFactoryRepository(getWorkspaceRoot());
  let blueprintInputs: unknown[];
  let resolvedBatchId: string;
  let resolvedBlueprintId: string | undefined = args.blueprintId;

  try {
    if (args.blueprintFile) {
      const blueprint = await loadBlueprintFile(path.resolve(args.blueprintFile));
      blueprintInputs = [blueprint];
      const declaredBatchId =
        typeof blueprint === "object" && blueprint !== null && "batchId" in blueprint
          ? String((blueprint as { batchId: unknown }).batchId)
          : undefined;
      const declaredId =
        typeof blueprint === "object" && blueprint !== null && "id" in blueprint
          ? String((blueprint as { id: unknown }).id)
          : undefined;
      if (!declaredBatchId) {
        emit(args.json, { ok: false, errorCode: "prompt_blueprint_invalid", message: "Blueprint file has no batchId." });
        return 2;
      }
      resolvedBatchId = declaredBatchId;
      resolvedBlueprintId = declaredId;
    } else if (args.blueprintId) {
      const blueprint = await repository.read("blueprints", args.blueprintId);
      if (blueprint === undefined) {
        emit(args.json, { ok: false, errorCode: "not_found", message: `No blueprint '${args.blueprintId}' in the repository.` });
        return 4;
      }
      blueprintInputs = [blueprint];
      const declaredBatchId =
        typeof blueprint === "object" && blueprint !== null && "batchId" in blueprint
          ? String((blueprint as { batchId: unknown }).batchId)
          : undefined;
      if (!declaredBatchId) {
        emit(args.json, { ok: false, errorCode: "prompt_blueprint_invalid", message: "Blueprint record has no batchId." });
        return 2;
      }
      resolvedBatchId = declaredBatchId;
    } else {
      resolvedBatchId = args.batchId!;
      const ids = await repository.list("blueprints");
      const records = await Promise.all(ids.map((id) => repository.read("blueprints", id)));
      blueprintInputs = records.filter(
        (record) =>
          typeof record === "object" &&
          record !== null &&
          "batchId" in record &&
          (record as { batchId: unknown }).batchId === resolvedBatchId,
      );
      if (blueprintInputs.length === 0) {
        emit(args.json, {
          ok: false,
          errorCode: "not_found",
          message: `No blueprints found in the repository for batch '${resolvedBatchId}'.`,
        });
        return 4;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { ok: false, errorCode: "internal_error", message });
    return 1;
  }

  const buildResult = buildGenerationPromptPack(resolvedBatchId, blueprintInputs);
  if (buildResult.status !== "built") {
    emit(args.json, { ok: false, errorCode: buildResult.status, message: buildResult.message });
    return 2;
  }
  const { pack, promptHash } = buildResult;

  const generationOutcome = await provider.generateCandidates(pack);
  if (!generationOutcome.ok) {
    emit(args.json, { ok: false, errorCode: generationOutcome.issueCode, message: generationOutcome.message });
    return generationOutcome.issueCode === "provider_request_failed" ? 6 : 7;
  }

  const fs = await import("node:fs/promises");
  const inboxRoot = args.inbox ? path.resolve(args.inbox) : path.join(getWorkspaceRoot(), "inbox");
  await fs.mkdir(inboxRoot, { recursive: true });
  const inboxFileName = `${resolvedBatchId}-ai-${provider.providerId}.json`;
  const inboxFilePath = path.join(inboxRoot, inboxFileName);
  await fs.writeFile(inboxFilePath, JSON.stringify(generationOutcome.candidates, null, 2), "utf8");

  const source = provider.providerId === "anthropic" ? "claude" : "chatgpt";
  const request: ManualIngestionRunRequest = {
    source,
    model: provider.modelId,
    batchId: resolvedBatchId,
    promptVersion: pack.promptVersion,
    promptHash,
    blueprintId: resolvedBlueprintId,
    pipelineRunId: args.pipelineRunId ?? `${resolvedBatchId}-generate-ai`,
    dryRun: args.dryRun,
    inboxRoot,
  };

  let outcome;
  try {
    outcome = await runManualIngestion(request, repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { ok: false, errorCode: "internal_error", message });
    return 1;
  }

  if (outcome.status === "request_invalid") {
    emit(args.json, { ok: false, errorCode: outcome.issueCode, message: outcome.message });
    return 2;
  }
  if (outcome.status === "lock_timeout") {
    emit(args.json, { ok: false, errorCode: "ingestion_lock_timeout", message: outcome.message });
    return 9;
  }

  emit(args.json, {
    ok: true,
    batchId: resolvedBatchId,
    candidateCount: generationOutcome.candidates.length,
    result: outcome.result,
  });
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
