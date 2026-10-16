import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";

import { RENDER_ONLY_VISUAL_TYPES } from "./render-only-visual-types";

/**
 * The allowed question/visual types are never redeclared here - the
 * renderer registries are the single source of truth (Mission 1
 * blueprint validator rule). This module exists so callers can reach
 * them via `config` alongside every other central setting.
 */
export const ALLOWED_QUESTION_TYPES = questionRendererRegistry.supportedTypes;
/** Registered renderers, excluding any visuals awaiting generation validation. */
export const ALLOWED_VISUAL_TYPES = visualRendererRegistry.supportedTypes.filter(
  (type) => !RENDER_ONLY_VISUAL_TYPES.includes(type),
);
