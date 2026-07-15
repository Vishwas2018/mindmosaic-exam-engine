/**
 * `questions:review-ingest` — Mission 3B external review-ingestion CLI.
 *
 * Parses a human-pasted external reviewer response file (a single JSON
 * object matching `reviewIngestionInputSchema`), validates it against
 * the candidate's current stored state, appends a chain-verified
 * `ReviewRecord`, and attempts the `semantic_review_passed` transition.
 * Never scans a directory/inbox — the input is one explicit file path
 * per invocation, matching `questions:review-prompt`'s single-file shape
 * (contract §9 does not define a review inbox compartment).
 *
 * Exit codes: 0 ok (accepted and lifecycle advanced), 3 recorded but not
 * advancing (evidence insufficient/low-confidence/ambiguous — no CLI
 * failure, the submission itself succeeded), 2 invalid/malformed input,
 * 4 not found, 5 conflict (reused reviewId with different content),
 * 1 internal error.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { getWorkspaceRoot } from "../src/features/question-factory/config";
import {
  ingestExternalReview,
  parseReviewResponseText,
  type ReviewIngestionOutcome,
} from "../src/features/question-factory/review";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly responseFile: string;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:review-ingest --response <file> [options]",
      "",
      "  --response <file>   Required. Path to a JSON file containing one external reviewer response.",
      "  --json               Emit a single machine-readable JSON result line to stdout.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let responseFile: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--response":
        responseFile = argv[++index];
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

  if (!responseFile) {
    process.stderr.write("--response is required.\n");
    return undefined;
  }

  return { responseFile, json };
}

function emit(json: boolean, payload: Record<string, unknown>): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (payload.status === "accepted") {
    const gateOutcome = payload.gateOutcome as { readonly outcome: string };
    process.stdout.write(
      [
        `Review ${payload.replayed ? "(replay) " : ""}accepted for candidate '${payload.candidateId as string}' (reviewId '${payload.reviewId as string}').`,
        `  gate outcome: ${gateOutcome.outcome}`,
        payload.insufficientEvidenceDowngraded
          ? "  note: result declared 'passed' with no evidence references — recorded as 'warning' instead."
          : undefined,
        "",
      ]
        .filter((line): line is string => line !== undefined)
        .join("\n"),
    );
  } else {
    process.stderr.write(`${payload.issueCode as string}: ${payload.message as string}\n`);
  }
}

function exitCodeFor(outcome: ReviewIngestionOutcome): number {
  if (outcome.status === "accepted") {
    // The review itself was durably appended either way (that is what
    // `status: "accepted"` means), but a `repository_error` gate outcome
    // is a genuine internal failure of the follow-on lifecycle-transition
    // attempt — never conflate it with the ordinary "recorded, awaiting
    // more/better evidence" case (exit 3), which a caller may reasonably
    // treat as an expected, non-actionable outcome.
    if (outcome.gateOutcome.outcome === "repository_error") return 1;
    return outcome.gateOutcome.outcome === "passed" ? 0 : 3;
  }
  if (outcome.issueCode === "review_id_conflict") return 5;
  if (outcome.issueCode === "unknown_candidate") return 4;
  if (outcome.issueCode === "repository_error") return 1;
  return 2;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  let raw: string;
  try {
    raw = await fs.readFile(path.resolve(args.responseFile), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", issueCode: "not_found", message: `Could not read response file: ${message}` });
    return 4;
  }

  const parsed = parseReviewResponseText(raw);
  if (!parsed.ok) {
    emit(args.json, { status: "rejected", issueCode: parsed.issueCode, message: parsed.message });
    return 2;
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());

  let outcome: ReviewIngestionOutcome;
  try {
    outcome = await ingestExternalReview(parsed.data, repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", issueCode: "repository_error", message });
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
