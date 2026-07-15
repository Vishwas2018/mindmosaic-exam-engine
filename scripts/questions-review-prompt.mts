/**
 * `questions:review-prompt` — Mission 3B external review prompt-pack CLI.
 *
 * Builds a versioned, deterministic external-review pack (contract §8)
 * for one candidate currently at `correctness_check_passed` (or already
 * `semantic_review_passed`, for regenerating a pack against an
 * unchanged candidate). Writes the pack to the factory workspace's
 * `reports` compartment by default, or to an explicit `--out <path>`
 * file. Never contacts an external provider, never writes a review
 * record, never touches lifecycle state — this command only ever reads
 * a candidate/blueprint and writes a report artefact.
 *
 * Exit codes: 0 ok, 1 internal error, 2 invalid arguments,
 * 4 not found, 5 output already exists (conflict, use --force).
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { blueprintSchema } from "../src/features/question-factory/blueprints";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { hashJson } from "../src/features/question-factory/provenance";
import {
  buildReviewPromptPack,
  type ReviewPromptCandidateEntry,
  type ReviewPromptPack,
} from "../src/features/question-factory/review";
import { FsFactoryRepository } from "../src/features/question-factory/storage";
import { checkAgainstProductionSchema, parseCandidateProvenance, parseCandidateQuestion } from "../src/features/question-factory/validation";
import { classifySemanticCategory } from "../src/features/question-factory/workflow";

interface ParsedArgs {
  readonly candidateId: string;
  readonly out?: string;
  readonly json: boolean;
  readonly stdout: boolean;
  readonly force: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:review-prompt --candidate-id <id> [options]",
      "",
      "  --candidate-id <id>  Required. Build a review pack for this candidate.",
      "  --out <file>         Write the pack to this path instead of the default report location.",
      "  --stdout             Print the full pack JSON to stdout; skip writing to disk.",
      "  --json               Emit a single machine-readable JSON result line to stdout.",
      "  --force              Overwrite an existing output file/report.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let candidateId: string | undefined;
  let out: string | undefined;
  let json = false;
  let stdout = false;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--candidate-id":
        candidateId = argv[++index];
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

  if (!candidateId) {
    process.stderr.write("--candidate-id is required.\n");
    return undefined;
  }

  return { candidateId, out, json, stdout, force };
}

interface ResultPayload {
  readonly ok: boolean;
  readonly candidateId?: string;
  readonly promptHash?: string;
  readonly reviewPackPath?: string;
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
      process.stdout.write(`Review pack built for candidate '${payload.candidateId}' (hash ${payload.promptHash}).\n`);
    } else {
      process.stdout.write(
        `Review pack written to ${payload.reviewPackPath} (candidate '${payload.candidateId}', hash ${payload.promptHash}).\n`,
      );
    }
  } else {
    process.stderr.write(`${payload.errorCode}: ${payload.message}\n`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());

  let candidateRaw: unknown;
  try {
    candidateRaw =
      (await repository.read("review-queue", args.candidateId)) ??
      (await repository.read("generated", args.candidateId));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { ok: false, errorCode: "internal_error", message });
    return 1;
  }

  if (candidateRaw === undefined) {
    emit(args.json, { ok: false, errorCode: "not_found", message: `No candidate '${args.candidateId}' found.` });
    return 4;
  }
  if (typeof candidateRaw !== "object" || candidateRaw === null) {
    emit(args.json, { ok: false, errorCode: "review_prompt_candidate_invalid", message: "Stored candidate record is not an object." });
    return 2;
  }
  const record = candidateRaw as Record<string, unknown>;

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    emit(args.json, {
      ok: false,
      errorCode: "review_prompt_candidate_invalid",
      message: "Candidate does not parse against the required provenance/question schemas.",
    });
    return 2;
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    emit(args.json, {
      ok: false,
      errorCode: "review_prompt_candidate_invalid",
      message: "Candidate question does not satisfy the production schema — it must pass structural validation first.",
    });
    return 2;
  }

  const blueprintRecord = await repository.read("blueprints", provenanceOutcome.data.blueprintId);
  if (blueprintRecord === undefined) {
    emit(args.json, {
      ok: false,
      errorCode: "not_found",
      message: `No blueprint '${provenanceOutcome.data.blueprintId}' found for candidate '${args.candidateId}'.`,
    });
    return 4;
  }
  const blueprintParse = blueprintSchema.safeParse(blueprintRecord);
  if (!blueprintParse.success) {
    emit(args.json, {
      ok: false,
      errorCode: "review_prompt_candidate_invalid",
      message: `Stored blueprint '${provenanceOutcome.data.blueprintId}' no longer parses against the blueprint schema.`,
    });
    return 2;
  }

  const entry: ReviewPromptCandidateEntry = {
    candidateId: args.candidateId,
    candidateRevision: provenanceOutcome.data.revision,
    candidateContentHash: provenanceOutcome.data.contentHash,
    blueprint: blueprintParse.data,
    blueprintHash: hashJson(blueprintRecord),
    semanticClassification: classifySemanticCategory(productionSchemaOutcome.question),
    question: productionSchemaOutcome.question,
  };

  const buildResult = buildReviewPromptPack(entry);
  if (buildResult.status !== "built") {
    emit(args.json, { ok: false, errorCode: buildResult.status, message: buildResult.message });
    return 2;
  }
  const { pack, promptHash } = buildResult;

  if (args.stdout) {
    if (args.json) {
      emit(args.json, { ok: true, candidateId: args.candidateId, promptHash, stdoutOnly: true });
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
          errorCode: "review_prompt_output_exists",
          message: `${outPath} already exists — pass --force to overwrite.`,
        });
        return 5;
      }
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(
        outPath,
        JSON.stringify({ pack, promptHash } satisfies { pack: ReviewPromptPack; promptHash: string }, null, 2),
        "utf8",
      );
      emit(args.json, { ok: true, candidateId: args.candidateId, promptHash, reviewPackPath: outPath });
      return 0;
    }

    const reportId = `review-pack-${args.candidateId}`;
    const reportPath = path.join(getWorkspaceRoot(), "reports", `${reportId}.json`);
    const createResult = await repository.create("reports", reportId, { pack, promptHash });
    if (!createResult.ok) {
      if (!args.force) {
        emit(args.json, {
          ok: false,
          errorCode: "review_prompt_output_exists",
          message: `${createResult.message} Pass --force to overwrite.`,
        });
        return 5;
      }
      const updateResult = await repository.update("reports", reportId, { pack, promptHash });
      if (!updateResult.ok) {
        emit(args.json, { ok: false, errorCode: "review_prompt_write_failed", message: updateResult.message });
        return 1;
      }
    }
    emit(args.json, { ok: true, candidateId: args.candidateId, promptHash, reviewPackPath: reportPath });
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { ok: false, errorCode: "review_prompt_write_failed", message });
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
