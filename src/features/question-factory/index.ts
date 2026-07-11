/**
 * Governed Question Factory domain.
 *
 * Mirrors `src/features/exam-engine/`: this feature owns blueprint
 * authoring, the generation lifecycle, provenance, and factory storage for
 * AI-assisted question content. It never replaces the exam engine's
 * schemas, renderers, scoring, selection, or validation — published
 * factory output flows through those unchanged.
 *
 * Content workspace: `content/question-factory/` (gitignored transient
 * candidate state; `published-manifests/` and `reports/` are tracked).
 */
export const QUESTION_FACTORY_DOMAIN_VERSION = 1 as const;

export * from "./blueprints";
export * from "./config";
export * from "./provenance";
export * from "./taxonomy";
export * from "./workflow";
