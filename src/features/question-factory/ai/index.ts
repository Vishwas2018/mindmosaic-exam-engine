/**
 * Provider-agnostic AI adapter for the factory's one manual seam: the LLM
 * call itself (generation and the external review gate). Deliberately
 * narrow: the `AiProvider` contract, the two adapters, and the env-driven
 * factory are public; parsing internals stay implementation detail — never
 * touches lifecycle state, the schema/registry, or gate logic.
 */
export { ANTHROPIC_DEFAULT_MODEL, AnthropicProvider } from "./anthropic-provider";
export { OPENAI_DEFAULT_MODEL, OpenAiProvider } from "./openai-provider";
export { createConfiguredProvider } from "./create-provider";
export type { CreateProviderOutcome } from "./create-provider";
export { parseGeneratedCandidates, parseReviewVerdict } from "./parse-provider-output";
export type { AiProvider, AiProviderIssueCode, GenerateCandidatesOutcome, ReviewCandidateOutcome } from "./provider";
