/**
 * Governed publication gate and production-bank assembly path (Mission
 * 3E, second hop): moves a `staged` candidate into `published` and
 * reconstructs the served-bank-bound question pool from every published
 * manifest. Deliberately narrow exports, mirroring every other gate
 * module's convention in this codebase.
 */
export { assemblePublishedQuestions } from "./assemble-published-bank";
export type { AssembledPublishedBank } from "./assemble-published-bank";
export { buildPublishedQuestion } from "./build-published-question";
export type { BuildPublishedQuestionOutcome } from "./build-published-question";
export { checkPublicationEligibility } from "./eligibility";
export type { PublicationEligibilityContext, PublicationEligibilityResult } from "./eligibility";
export { orchestratePublication } from "./publish-candidate";
export type { OrchestratePublicationOptions } from "./publish-candidate";
export type { PublicationIssue, PublicationManifest, PublicationOutcome } from "./types";
