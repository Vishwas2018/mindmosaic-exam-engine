import { createElement } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";

import { visualRendererRegistry } from "./visual-renderer-registry";

/**
 * Every question visual is drawn through here.
 *
 * The wrapper does nothing in the light theme (`display: contents` generates no box, so layout is exactly
 * as before). In Night mode `.mm-visual-paper` (src/app/theme-dark.css) turns it into a light panel: charts,
 * diagrams and tables are exam content whose colours are specified and contrast-checked against white
 * (docs/design.md §28), so they are shown on white, like a printed worksheet, rather than recoloured.
 */
export function VisualRenderer(props: VisualRendererProps) {
  return (
    <div className="mm-visual-paper contents">
      {createElement(visualRendererRegistry.resolve(props.visual.type), props)}
    </div>
  );
}
