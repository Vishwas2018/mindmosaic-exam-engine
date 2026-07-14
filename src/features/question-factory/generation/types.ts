import type { CandidateQuestionInput } from "../ingestion/candidate-question";
import type { Blueprint } from "../blueprints";
import type { GeneratorAdapter, GeneratorClass } from "../provenance";

/**
 * Everything a `QuestionGenerator` needs to produce one candidate. Pure
 * input — no repository handle, no filesystem path, no clock read: a
 * generator's `generate()` operation is a pure function of this context
 * (plus its own internal deterministic/random state where applicable), so
 * it can never perform I/O or acquire trust it hasn't earned.
 */
export interface GenerationContext {
  readonly blueprint: Blueprint;
  /** `hashJson(blueprint)` — binds the produced candidate to the exact blueprint content it was generated against. */
  readonly blueprintHash: string;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly promptVersion: string;
  /** Present only when generation was driven by a real issued prompt pack (`generation/prompt-builder.ts`). */
  readonly promptHash?: string;
  readonly generatorVersion: string;
  /**
   * Required for `deterministic_fixture` (drives byte-identical replay);
   * forbidden (never read) by any generator class that is inherently
   * non-deterministic (a future `live_provider` adapter).
   */
  readonly seed?: string;
}

export interface GeneratedQuestion {
  /** Pre-provenance candidate content — matches the shape structural validation (Mission 2B) later re-checks. */
  readonly candidateContent: CandidateQuestionInput;
  readonly generatorAdapter: GeneratorAdapter;
  readonly generatorVersion: string;
  /** The seed actually used (echoes `context.seed`, or the derived default — see `deterministic-fixture-generator.ts`). */
  readonly seedUsed?: string;
}

/**
 * Closed set of generation outcomes. `generated` is the only success
 * variant; the other three are expected, structured failures a generator
 * returns for a blueprint it legitimately cannot (or, for resource limits,
 * currently may not) produce — never thrown. An unexpected programming
 * error inside a generator implementation may still throw; the
 * orchestration boundary (the CLI / prompt-pack builder / any future
 * pipeline caller) is responsible for catching it and converting it into a
 * bounded `generation_failed` outcome, never letting it escape raw.
 */
export type GenerationOutcome =
  | ({ readonly status: "generated" } & GeneratedQuestion)
  | { readonly status: "unsupported_blueprint"; readonly message: string }
  | { readonly status: "generation_failed"; readonly message: string }
  | { readonly status: "resource_limit_exceeded"; readonly message: string };

/**
 * Provider-neutral generation contract. Symmetrical with the (not yet
 * implemented, Mission 3B) `Reviewer` contract: a generator is never aware
 * of, and never trusted more because of, what kind of generator it is —
 * `deterministic_fixture`, `manual_external`, or a future `live_provider`
 * all satisfy exactly this interface.
 */
export interface QuestionGenerator {
  readonly generatorClass: GeneratorClass;
  /** Pure capability check — never throws, never performs I/O. */
  supportsBlueprint(blueprint: Blueprint): boolean;
  generate(context: GenerationContext): Promise<GenerationOutcome>;
}
