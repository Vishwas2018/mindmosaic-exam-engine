/**
 * `questions:prompt` — Mission 3A generation prompt-pack CLI.
 *
 * Builds a versioned, deterministic generation prompt pack for one
 * blueprint (`--blueprint <file>` or `--blueprint-id <id>`) or a
 * deterministic batch plan (`--batch-id <id>`, reading every blueprint
 * record already persisted under that batch id in the factory
 * repository's `blueprints` compartment). Writes the pack to the factory
 * workspace's `reports` compartment by default, or to an explicit
 * `--out <path>` file. Never contacts an external provider, never writes
 * a candidate, and never touches repository lifecycle state — this
 * command only ever reads blueprints and writes a report artefact.
 *
 * Exit codes: 0 ok, 1 internal error, 2 invalid arguments/blueprint,
 * 4 not found, 5 output already exists (conflict, use --force).
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

import {
  buildGenerationPromptPack,
  type GenerationPromptPack,
} from "../src/features/question-factory/generation";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly blueprintFile?: string;
  readonly blueprintId?: string;
  readonly batchId?: string;
  readonly out?: string;
  readonly json: boolean;
  readonly stdout: boolean;
  readonly force: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:prompt --blueprint <file> | --blueprint-id <id> | --batch-id <id> [options]",
      "",
      "  --blueprint <file>     Build a prompt pack from a single blueprint JSON file on disk.",
      "  --blueprint-id <id>    Build a prompt pack from a blueprint already persisted in the repository.",
      "  --batch-id <id>        Build a prompt pack for every persisted blueprint in this batch.",
      "  --out <file>           Write the pack to this path instead of the default report location.",
      "  --stdout               Print the full pack JSON to stdout; skip writing to disk.",
      "  --json                 Emit a single machine-readable JSON result line to stdout.",
      "  --force                Overwrite an existing output file/report.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let blueprintFile: string | undefined;
  let blueprintId: string | undefined;
  let batchId: string | undefined;
  let out: string | undefined;
  let json = false;
  let stdout = false;
  let force = false;

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
      case "--out":
        out = argv[++index];
        break;
      case "--json":
        json = true;
        break;
      case "--stdout":
        stdout = true;
        break;
      case "--force":
        force = true;
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

  return { blueprintFile, blueprintId, batchId, out, json, stdout, force };
}

interface ResultPayload {
  readonly ok: boolean;
  readonly batchId?: string;
  readonly promptHash?: string;
  readonly promptPackPath?: string;
  readonly stdoutOnly?: boolean;
  readonly errorCode?: string;
  readonly message?: string;
}

function emit(json: boolean, payload: ResultPayload): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (payload.ok) {
    if (payload.stdoutOnly) {
      process.stdout.write(`Prompt pack built for batch '${payload.batchId}' (hash ${payload.promptHash}).\n`);
    } else {
      process.stdout.write(
        `Prompt pack written to ${payload.promptPackPath} (batch '${payload.batchId}', hash ${payload.promptHash}).\n`,
      );
    }
  } else {
    process.stderr.write(`${payload.errorCode}: ${payload.message}\n`);
  }
}

async function loadBlueprintFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());
  let blueprintInputs: unknown[];
  let resolvedBatchId: string;

  try {
    if (args.blueprintFile) {
      const blueprint = await loadBlueprintFile(path.resolve(args.blueprintFile));
      blueprintInputs = [blueprint];
      const declaredBatchId =
        typeof blueprint === "object" && blueprint !== null && "batchId" in blueprint
          ? String((blueprint as { batchId: unknown }).batchId)
          : undefined;
      if (!declaredBatchId) {
        emit(args.json, { ok: false, errorCode: "prompt_blueprint_invalid", message: "Blueprint file has no batchId." });
        return 2;
      }
      resolvedBatchId = declaredBatchId;
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

  if (args.stdout) {
    if (args.json) {
      emit(args.json, { ok: true, batchId: resolvedBatchId, promptHash, stdoutOnly: true });
    } else {
      process.stdout.write(`${JSON.stringify(pack, null, 2)}\n`);
    }
    return 0;
  }

  try {
    if (args.out) {
      const outPath = path.resolve(args.out);
      const exists = await fs
        .access(outPath)
        .then(() => true)
        .catch(() => false);
      if (exists && !args.force) {
        emit(args.json, {
          ok: false,
          errorCode: "prompt_output_exists",
          message: `${outPath} already exists — pass --force to overwrite.`,
        });
        return 5;
      }
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, JSON.stringify({ pack, promptHash } satisfies { pack: GenerationPromptPack; promptHash: string }, null, 2), "utf8");
      emit(args.json, { ok: true, batchId: resolvedBatchId, promptHash, promptPackPath: outPath });
      return 0;
    }

    const reportId = `prompt-pack-${resolvedBatchId}`;
    const reportPath = path.join(getWorkspaceRoot(), "reports", `${reportId}.json`);
    const createResult = await repository.create("reports", reportId, { pack, promptHash });
    if (!createResult.ok) {
      if (!args.force) {
        emit(args.json, {
          ok: false,
          errorCode: "prompt_output_exists",
          message: `${createResult.message} Pass --force to overwrite.`,
        });
        return 5;
      }
      const updateResult = await repository.update("reports", reportId, { pack, promptHash });
      if (!updateResult.ok) {
        emit(args.json, { ok: false, errorCode: "prompt_write_failed", message: updateResult.message });
        return 1;
      }
    }
    emit(args.json, { ok: true, batchId: resolvedBatchId, promptHash, promptPackPath: reportPath });
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { ok: false, errorCode: "prompt_write_failed", message });
    return 1;
  }
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
