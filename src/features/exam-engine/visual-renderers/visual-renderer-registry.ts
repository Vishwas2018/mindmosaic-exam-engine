import type {
  VisualRendererComponent,
  VisualType,
} from "@/features/exam-engine/types";

import { BarChartRenderer } from "./BarChartRenderer";
import { CoordinateGridRenderer } from "./CoordinateGridRenderer";
import { FractionModelRenderer } from "./FractionModelRenderer";
import { GeometryShapeRenderer } from "./GeometryShapeRenderer";
import { HotspotSvgRenderer } from "./HotspotSvgRenderer";
import { LabelledSvgRenderer } from "./LabelledSvgRenderer";
import { LineGraphRenderer } from "./LineGraphRenderer";
import { NumberLineRenderer } from "./NumberLineRenderer";
import { PieChartRenderer } from "./PieChartRenderer";
import { TableRenderer } from "./TableRenderer";
import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";

const renderers = {
  bar_chart: BarChartRenderer,
  line_graph: LineGraphRenderer,
  pie_chart: PieChartRenderer,
  table: TableRenderer,
  number_line: NumberLineRenderer,
  geometry_shape: GeometryShapeRenderer,
  coordinate_grid: CoordinateGridRenderer,
  fraction_model: FractionModelRenderer,
  labelled_svg: LabelledSvgRenderer,
  hotspot_svg: HotspotSvgRenderer,
} satisfies Record<VisualType, VisualRendererComponent>;

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
