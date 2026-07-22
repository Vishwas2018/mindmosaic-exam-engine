/**
 * `questions:review-ai` — pluggable-provider external-review CLI.
 *
 * Closes the factory's one manual seam for the external review gate:
 * builds the same versioned review prompt pack `questions:review-prompt`
 * builds, calls the configured AI provider
 * (`QF_AI_PROVIDER=anthropic|openai`, contract:
 * `src/features/question-factory/ai/provider.ts`), and pipes the parsed,
 * schema-validated verdict straight into `ingestExternalReview` — the same
 * function `questions:review-ingest` calls. No paste-into-a-chat-UI step,
 * no change to the review gate's own binding/independence checks.
 *
 * The provider's declared binding fields (candidateId, candidateRevision,
 * candidateContentHash, blueprintHash, reviewPromptVersion,
 * reviewPromptHash) are never trusted as-is — they are overwritten with
 * the authoritative values this CLI already read/built before the call,
 * so a model that mis-echoes one of them fails a real binding check
 * inside `ingestExternalReview`, never silently reviews the wrong
 * candidate.
 *
 * If no provider key is configured this stops cleanly with a
 * configuration message — it never crashes and never fabricates a
 * verdict. On malformed provider output, ingestion is never attempted.
 *
 * Exit codes: 0 ok (accepted and lifecycle advanced), 1 internal error,
 * 2 invalid arguments/candidate/no provider configured, 3 recorded but not
 * advancing (evidence insufficient/low-confidence/ambiguous), 4 not found,
 * 5 conflict (reused reviewId with different content), 6 provider request
 * failed, 7 provider returned malformed/invalid output.
 */
import { blueprintSchema } from "../src/features/question-factory/blueprints";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { createConfiguredProvider } from "../src/features/question-factory/ai";
import { hashJson } from "../src/features/question-factory/provenance";
import {
  buildReviewPromptPack,
  ingestExternalReview,
  reviewIngestionInputSchema,
  type ReviewIngestionInput,
  type ReviewIngestionOutcome,
  type ReviewPromptCandidateEntry,
} from "../src/features/question-factory/review";
import { FsFactoryRepository } from "../src/features/question-factory/storage";
import { checkAgainstProductionSchema, parseCandidateProvenance, parseCandidateQuestion } from "../src/features/question-factory/validation";
import { classifySemanticCategory } from "../src/features/question-factory/workflow";

interface ParsedArgs {
  readonly candidateId: string;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:review-ai --candidate-id <id> [options]",
      "",
      "  --candidate-id <id>  Required. Build and submit a review for this candidate.",
      "  --json               Emit a single machine-readable JSON result line to stdout.",
      "",
      "Requires QF_AI_PROVIDER=anthropic|openai and the matching ANTHROPIC_API_KEY/OPENAI_API_KEY.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let candidateId: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--candidate-id":
        candidateId = argv[++index];
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

  if (!candidateId) {
    process.stderr.write("--candidate-id is required.\n");
    return undefined;
  }

  return { candidateId, json };
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
        `Review (AI, ${payload.providerId as string}) ${payload.replayed ? "(replay) " : ""}accepted for candidate '${payload.candidateId as string}' (reviewId '${payload.reviewId as string}').`,
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
    process.stderr.write(`${payload.errorCode as string}: ${payload.message as string}\n`);
  }
}

function exitCodeForIngestion(outcome: ReviewIngestionOutcome): number {
  if (outcome.status === "accepted") {
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

  const providerOutcome = createConfiguredProvider();
  if (!providerOutcome.ok) {
    emit(args.json, { status: "rejected", errorCode: "provider_not_configured", message: providerOutcome.message });
    return 2;
  }
  const provider = providerOutcome.provider;

  const repository = new FsFactoryRepository(getWorkspaceRoot());

  let candidateRaw: unknown;
  try {
    candidateRaw =
      (await repository.read("review-queue", args.candidateId)) ?? (await repository.read("generated", args.candidateId));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", errorCode: "internal_error", message });
    return 1;
  }
  if (candidateRaw === undefined) {
    emit(args.json, { status: "rejected", errorCode: "not_found", message: `No candidate '${args.candidateId}' found.` });
    return 4;
  }
  if (typeof candidateRaw !== "object" || candidateRaw === null) {
    emit(args.json, { status: "rejected", errorCode: "review_prompt_candidate_invalid", message: "Stored candidate record is not an object." });
    return 2;
  }
  const record = candidateRaw as Record<string, unknown>;

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    emit(args.json, {
      status: "rejected",
      errorCode: "review_prompt_candidate_invalid",
      message: "Candidate does not parse against the required provenance/question schemas.",
    });
    return 2;
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    emit(args.json, {
      status: "rejected",
      errorCode: "review_prompt_candidate_invalid",
      message: "Candidate question does not satisfy the production schema — it must pass structural validation first.",
    });
    return 2;
  }

  const blueprintRecord = await repository.read("blueprints", provenanceOutcome.data.blueprintId);
  if (blueprintRecord === undefined) {
    emit(args.json, {
      status: "rejected",
      errorCode: "not_found",
      message: `No blueprint '${provenanceOutcome.data.blueprintId}' found for candidate '${args.candidateId}'.`,
    });
    return 4;
  }
  const blueprintParse = blueprintSchema.safeParse(blueprintRecord);
  if (!blueprintParse.success) {
    emit(args.json, {
      status: "rejected",
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
    emit(args.json, { status: "rejected", errorCode: buildResult.status, message: buildResult.message });
    return 2;
  }
  const { pack, promptHash } = buildResult;

  const reviewOutcome = await provider.reviewCandidates(pack);
  if (!reviewOutcome.ok) {
    emit(args.json, { status: "rejected", errorCode: reviewOutcome.issueCode, message: reviewOutcome.message });
    return reviewOutcome.issueCode === "provider_request_failed" ? 6 : 7;
  }

  // Never trust the provider's own echo of binding fields — overwrite with
  // the authoritative values this CLI already resolved, so a mis-echoed
  // field fails `ingestExternalReview`'s real binding check rather than
  // silently reviewing the wrong candidate/blueprint/prompt version.
  const boundInput: ReviewIngestionInput = {
    ...reviewOutcome.review,
    candidateId: entry.candidateId,
    candidateRevision: entry.candidateRevision,
    candidateContentHash: entry.candidateContentHash,
    blueprintHash: entry.blueprintHash,
    reviewPromptVersion: pack.reviewPromptVersion,
    reviewPromptHash: promptHash,
  };
  const revalidated = reviewIngestionInputSchema.safeParse(boundInput);
  if (!revalidated.success) {
    emit(args.json, {
      status: "rejected",
      errorCode: "malformed_provider_response",
      message: `Provider review response failed schema validation after binding: ${revalidated.error.issues.map((issue) => issue.message).join("; ")}`,
    });
    return 7;
  }

  let outcome: ReviewIngestionOutcome;
  try {
    outcome = await ingestExternalReview(revalidated.data, repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", errorCode: "repository_error", message });
    return 1;
  }

  emit(args.json, { ...outcome, providerId: provider.providerId } as unknown as Record<string, unknown>);
  return exitCodeForIngestion(outcome);
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
