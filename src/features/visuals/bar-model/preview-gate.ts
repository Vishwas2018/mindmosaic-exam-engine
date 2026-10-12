/**
 * Whether the internal bar-model preview may render.
 *
 * Phase 1 of the bar model is render-only: no child may reach it, so the
 * route returns 404 in any production build.
 *
 * BAR_MODEL_PREVIEW_ENABLED is an escape hatch for exactly one caller: the
 * Playwright config, whose web server is a PRODUCTION build (the only place
 * the 320px / 1280px / print checks can run). Never set it on a real
 * deployment.
 */
export function isBarModelPreviewAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.NODE_ENV !== "production" || env.BAR_MODEL_PREVIEW_ENABLED === "1";
}
