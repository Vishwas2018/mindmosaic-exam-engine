import type { VisualAsset } from "@/schemas/visual.schema";

type HotspotVisual = Extract<VisualAsset, { type: "hotspot_svg" }>;

export interface RegionPosition {
  readonly leftPercent: number;
  readonly topPercent: number;
}

/** Returns the visual centre of a structured hotspot region as percentages. */
export function regionPosition(
  visual: HotspotVisual,
  regionId: string,
): RegionPosition | undefined {
  const region = visual.data.regions.find((candidate) => candidate.id === regionId);
  if (!region) return undefined;

  let x: number;
  let y: number;
  if (region.shape === "circle") {
    x = region.cx;
    y = region.cy;
  } else if (region.shape === "rectangle") {
    x = region.x + region.width / 2;
    y = region.y + region.height / 2;
  } else {
    const xs = region.points.map((point) => point.x);
    const ys = region.points.map((point) => point.y);
    x = (Math.min(...xs) + Math.max(...xs)) / 2;
    y = (Math.min(...ys) + Math.max(...ys)) / 2;
  }

  return {
    leftPercent: (x / visual.data.width) * 100,
    topPercent: (y / visual.data.height) * 100,
  };
}
