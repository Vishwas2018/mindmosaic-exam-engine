/**
 * Mission 3A generation domain: the provider-neutral `QuestionGenerator`
 * contract and the deterministic fixture generator (never publishable in
 * production mode — see `provenance/generator.ts`).
 */
export { DeterministicFixtureGenerator } from "./deterministic-fixture-generator";
export { createSeededRandom, pickOne, randomInt, shuffle } from "./deterministic-random";
export type { SeededRandom } from "./deterministic-random";
export type {
  GeneratedQuestion,
  GenerationContext,
  GenerationOutcome,
  QuestionGenerator,
} from "./types";
