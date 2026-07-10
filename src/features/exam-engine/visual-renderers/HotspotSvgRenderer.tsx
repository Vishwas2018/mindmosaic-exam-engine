"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { toDomId } from "./visual-utils";

/**
 * Static, display-only renderer for a hotspot diagram. Interactive selection
 * lives in the hotspot question renderer; here each region is drawn as an
 * outlined shape with an accessible name so the diagram is understandable on
 * its own (for example inside the showcase gallery).
 */
export function HotspotSvgRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "hotspot_svg") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { width, height, elements, regions } = visual.data;
  const idPrefix = `hotspot-svg-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="mx-auto h-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white"
      >
        <title id={titleId}>{visual.title ?? "Hotspot diagram"}</title>
        <desc id={descId}>{visual.altText}</desc>
        <g aria-hidden="true">
          {elements.map((element) => {
            switch (element.kind) {
              case "circle":
                return (
                  <circle key={element.id} cx={element.cx} cy={element.cy} r={element.r} fill={element.fill ?? "#EDE7FB"} stroke={element.stroke ?? "#C9BEF0"} />
                );
              case "rectangle":
                return (
                  <rect key={element.id} x={element.x} y={element.y} width={element.width} height={element.height} fill={element.fill ?? "#EDE7FB"} stroke={element.stroke ?? "#C9BEF0"} />
                );
              case "line":
                return (
                  <line key={element.id} x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} stroke={element.stroke ?? "#94A3B8"} />
                );
              case "polygon":
                return (
                  <polygon key={element.id} points={element.points.map((p) => `${p.x},${p.y}`).join(" ")} fill={element.fill ?? "#EDE7FB"} stroke={element.stroke ?? "#C9BEF0"} />
                );
              case "text":
                return (
                  <text key={element.id} x={element.x} y={element.y} fill={element.colour ?? "#334155"} fontSize="14">
                    {element.text}
                  </text>
                );
              default:
                return null;
            }
          })}
        </g>
        {regions.map((region) => {
          const shared = {
            fill: "rgba(75,46,131,0.08)",
            stroke: "#4B2E83",
            strokeWidth: 1.5,
            strokeDasharray: "5 4",
          };
          if (region.shape === "circle") {
            return (
              <circle key={region.id} cx={region.cx} cy={region.cy} r={region.r} {...shared}>
                <title>{region.accessibleLabel}</title>
              </circle>
            );
          }
          if (region.shape === "rectangle") {
            return (
              <rect key={region.id} x={region.x} y={region.y} width={region.width} height={region.height} rx={6} {...shared}>
                <title>{region.accessibleLabel}</title>
              </rect>
            );
          }
          return (
            <polygon key={region.id} points={region.points.map((p) => `${p.x},${p.y}`).join(" ")} {...shared}>
              <title>{region.accessibleLabel}</title>
            </polygon>
          );
        })}
      </svg>
      <ul className="sr-only">
        {regions.map((region) => (
          <li key={region.id}>{region.accessibleLabel}</li>
        ))}
      </ul>
      {visual.caption ? (
        <figcaption className="mt-2 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
