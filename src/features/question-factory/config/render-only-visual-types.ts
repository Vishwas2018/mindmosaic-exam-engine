/**
 * Visuals awaiting generation-time validation. Keep this dependency-free
 * so ingestion schemas can import it without the renderer registry.
 * bar_model is now validated and independently solved by the correctness gate.
 */
export const RENDER_ONLY_VISUAL_TYPES: readonly string[] = [];
