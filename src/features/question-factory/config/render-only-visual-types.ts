/**
 * Visual types the app can render but the AI question factory must not
 * generate or ingest yet.
 *
 * bar_model - Phase 1: render-only; generation is enabled in a later phase.
 * Its maths (contradictions, a determined target) is checked by the
 * structural and mathematical validators in src/features/visuals/bar-model/,
 * which the factory's correctness pipeline does not run yet.
 *
 * Deliberately dependency-free so ingestion schemas can import it without
 * pulling in the renderer registry.
 */
export const RENDER_ONLY_VISUAL_TYPES: readonly string[] = ["bar_model"];
