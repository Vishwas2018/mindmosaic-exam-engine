/**
 * Server-only by construction, not by the `server-only` package's runtime
 * guard: this module (and its adapters, `anthropic-provider.ts`/
 * `openai-provider.ts`/`create-provider.ts`) is loaded directly by the
 * `questions:generate-ai`/`questions:review-ai` tsx CLI scripts, a plain
 * Node process with none of the bundler "react-server"/"browser" export
 * conditions the `server-only` package's throw depends on — importing it
 * here would make every CLI invocation crash unconditionally, defeating
 * the CLI requirement outright (verified empirically; that package's
 * `index.js` throws under any consumer that isn't Next's RSC bundling).
 * The real guard is the same one `provision-child.ts` is *also* actually
 * protected by day to day: it is never re-exported from this feature's
 * client-imported barrel (`question-factory/index.ts`), and
 * `src/tests/unit/ai-provider-server-only.test.ts` statically asserts no
 * `"use client"` file imports it directly.
 */
import type { GenerationPromptPack } from "../generation";
import type { ReviewIngestionInput, ReviewPromptPack } from "../review";

/** Closed set of provider issue codes a CLI can map to a clean exit code — never thrown, never silently swallowed. */
export type AiProviderIssueCode = "provider_request_failed" | "malformed_provider_response";

export type GenerateCandidatesOutcome =
  | {
      readonly ok: true;
      /**
       * Raw, not deeply validated — the same shape `parseInboxFileContent`
       * (manual-ingestion's own inbox-file parser) accepts: an ordered list
       * of plain candidate objects. Deep structural validation is left to
       * ingestion (Mission 2B), exactly as it is for a human-pasted inbox
       * file — this adapter never re-implements that gate.
       */
      readonly candidates: readonly Record<string, unknown>[];
    }
  | { readonly ok: false; readonly issueCode: AiProviderIssueCode; readonly message: string };

export type ReviewCandidateOutcome =
  | {
      readonly ok: true;
      /** Already validated against `reviewIngestionInputSchema` — the exact shape `questions:review-ingest` requires. */
      readonly review: ReviewIngestionInput;
    }
  | { readonly ok: false; readonly issueCode: AiProviderIssueCode; readonly message: string };

/**
 * Provider-neutral contract for the factory's one remaining manual seam:
 * the LLM call itself. Symmetrical in spirit with `QuestionGenerator`/
 * `Reviewer` (`generation/types.ts`, `review/types.ts`) but deliberately not
 * an implementation of either — this adapter never touches lifecycle
 * state, gate logic, or the schema/registry; it only turns an already-built
 * prompt pack into raw provider output, exactly what a human operator
 * pasting into a chat UI would have produced by hand.
 */
export interface AiProvider {
  readonly providerId: "anthropic" | "openai";
  /** The exact model identifier this instance calls (resolves through the shared identity-alias table — see `config/identity-normalisation.ts`). */
  readonly modelId: string;
  generateCandidates(pack: GenerationPromptPack): Promise<GenerateCandidatesOutcome>;
  reviewCandidates(pack: ReviewPromptPack): Promise<ReviewCandidateOutcome>;
}
