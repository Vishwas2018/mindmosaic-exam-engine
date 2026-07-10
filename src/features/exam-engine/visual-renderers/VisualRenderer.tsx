import { createElement } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";

import { visualRendererRegistry } from "./visual-renderer-registry";

export function VisualRenderer(props: VisualRendererProps) {
  return createElement(visualRendererRegistry.resolve(props.visual.type), props);
}
