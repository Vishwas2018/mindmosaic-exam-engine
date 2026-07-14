/**
 * Mission 3A generation domain: the provider-neutral `QuestionGenerator`
 * contract, the deterministic fixture generator (never publishable in
 * production mode — see `provenance/generator.ts`), and the versioned
 * generation prompt-pack builder consumed by `scripts/questions-prompt.mts`.
 */
export { DeterministicFixtureGenerator } from "./deterministic-fixture-generator";
export { createSeededRandom, pickOne, randomInt, shuffle } from "./deterministic-random";
export type { SeededRandom } from "./deterministic-random";
export {
  buildGenerationPromptPack,
  assertPromptPackBuildFailureStatusIsCatalogued,
  INTERACTION_REQUIRED_QUESTION_TYPES,
  STIMULUS_REQUIRED_QUESTION_TYPES,
} from "./prompt-builder";
export type {
  GenerationPromptPack,
  GenerationPromptPackWithHash,
  PromptPackBlueprintEntry,
  PromptPackBuildFailure,
  PromptPackBuildResult,
} from "./prompt-builder";
export { assertGenerationOutcomeStatusIsCatalogued } from "./types";
export type {
  GeneratedQuestion,
  GenerationContext,
  GenerationOutcome,
  QuestionGenerator,
} from "./types";
