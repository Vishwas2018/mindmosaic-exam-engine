/**
 * `questions:pipeline` — Mission 3C batch pipeline-runner CLI, extended by
 * Mission 3D.
 *
 * Drives an explicit, caller-supplied, deterministically ordered
 * candidate-id list through the registered gate sequence (structural →
 * correctness → semantic → originality → difficulty) in one call. Stops
 * successful execution at `difficulty_review_passed` — never registers or
 * invokes a staging or publication stage (Mission 3E's responsibility).
 * `--candidate-ids` is mandatory: this CLI never discovers candidates by
 * scanning a compartment or batch.
 *
 * Exit codes: 0 every requested candidate ended exactly at
 * `difficulty_review_passed`, 3 partial (at least one candidate ended
 * anywhere else — rejected/quarantined/needs_revision/not
 * found/ineligible — expected, not a bug), 2 invalid arguments / duplicate
 * candidate ids / candidate-count over limit / pipelineRunId reused
 * against a different batch, 9 batch lock held (ordinary contention or
 * ambiguous/possibly-orphaned), 1 internal error (an unexpected exception
 * during candidate processing, isolated to that candidate but still
 * surfaced at the process level).
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { runPipeline, type PipelineRunOutcome, type PipelineRunRequest } from "../src/features/question-factory/pipeline";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly pipelineRunId: string;
  readonly batchId: string;
  readonly candidateIds: readonly string[];
  readonly dryRun: boolean;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:pipeline --pipeline-run-id <id> --batch-id <id> --candidate-ids <id1,id2,...> [options]",
      "",
      "  --pipeline-run-id <id>   Required. One per invocation; re-invoking with the same id resumes/replays.",
      "  --batch-id <id>          Required. Groups this run for batch-lock purposes.",
      "  --candidate-ids <list>   Required. Comma-separated, non-empty, deterministically ordered — no auto-discovery.",
      "  --dry-run                Simulate: preview each candidate's next eligible stage, write nothing.",
      "  --json                   Emit a single machine-readable JSON result line to stdout.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let pipelineRunId: string | undefined;
  let batchId: string | undefined;
  let candidateIdsRaw: string | undefined;
  let dryRun = false;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--pipeline-run-id":
        pipelineRunId = argv[++index];
        break;
      case "--batch-id":
        batchId = argv[++index];
        break;
      case "--candidate-ids":
        candidateIdsRaw = argv[++index];
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

  if (!pipelineRunId) {
    process.stderr.write("--pipeline-run-id is required.\n");
    return undefined;
  }
  if (!batchId) {
    process.stderr.write("--batch-id is required.\n");
    return undefined;
  }
  if (!candidateIdsRaw || candidateIdsRaw.trim().length === 0) {
    process.stderr.write("--candidate-ids is required and must be non-empty.\n");
    return undefined;
  }

  const candidateIds = candidateIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return { pipelineRunId, batchId, candidateIds, dryRun, json };
}

function emit(json: boolean, payload: Record<string, unknown>): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (payload.status === "completed") {
    const report = payload.report as { readonly candidateResults: readonly { readonly candidateId: string; readonly resultKind: string; readonly endState: string }[]; readonly simulated: boolean; readonly summary: Record<string, number> };
    process.stdout.write(
      [
        `Pipeline run ${payload.status === "completed" ? "completed" : ""}${report.simulated ? " (simulated)" : ""}.`,
        `  summary: ${JSON.stringify(report.summary)}`,
        ...report.candidateResults.map((result) => `  ${result.candidateId}: ${result.resultKind} -> ${result.endState}`),
        "",
      ].join("\n"),
    );
  } else {
    process.stderr.write(`${payload.issueCode as string}: ${payload.message as string}\n`);
  }
}

function exitCodeFor(outcome: PipelineRunOutcome): number {
  if (outcome.status === "refused") {
    if (outcome.issueCode === "pipeline_batch_lock_held" || outcome.issueCode === "pipeline_batch_lock_held_ambiguous") return 9;
    if (outcome.issueCode === "pipeline_repository_error") return 1;
    return 2;
  }
  if (outcome.report.candidateResults.some((result) => result.resultKind === "error")) return 1;
  if (outcome.report.candidateResults.some((result) => result.endState !== "difficulty_review_passed")) return 3;
  return 0;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const workspaceRoot = getWorkspaceRoot();
  const repository = new FsFactoryRepository(workspaceRoot);

  const request: PipelineRunRequest = {
    pipelineRunId: args.pipelineRunId,
    batchId: args.batchId,
    candidateIds: args.candidateIds,
    ...(args.dryRun ? { dryRun: true } : {}),
  };

  let outcome: PipelineRunOutcome;
  try {
    outcome = await runPipeline(request, repository, { lockRoot: workspaceRoot });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "refused", issueCode: "pipeline_repository_error", message });
    return 1;
  }

  emit(args.json, outcome as unknown as Record<string, unknown>);
  return exitCodeFor(outcome);
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
