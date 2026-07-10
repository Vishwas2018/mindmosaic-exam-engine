import type {
  VisualRendererComponent,
  VisualType,
} from "@/features/exam-engine/types";

import { BarChartRenderer } from "./BarChartRenderer";
import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";

const renderers = {
  bar_chart: BarChartRenderer,
} satisfies Partial<Record<VisualType, VisualRendererComponent>>;

export type SupportedVisualRendererType = keyof typeof renderers;

function isSupportedType(type: string): type is SupportedVisualRendererType {
  return Object.hasOwn(renderers, type);
}

export const visualRendererRegistry = Object.freeze({
  resolve(type: string): VisualRendererComponent {
    return isSupportedType(type) ? renderers[type] : UnsupportedVisualRenderer;
  },

  supports: isSupportedType,

  supportedTypes: Object.freeze(
    Object.keys(renderers) as SupportedVisualRendererType[],
  ),
});
