"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { toDomId } from "./visual-utils";

export function LabelledSvgRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "labelled_svg") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { width, height, elements, labels } = visual.data;
  const idPrefix = `labelled-svg-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="mx-auto h-auto w-full max-w-xl"
      >
        <title id={titleId}>{visual.title ?? "Labelled diagram"}</title>
        <desc id={descId}>{visual.altText}</desc>
        <g aria-hidden="true">
          {elements.map((element) => {
            switch (element.kind) {
              case "circle":
                return (
                  <circle
                    key={element.id}
                    cx={element.cx}
                    cy={element.cy}
                    r={element.r}
                    fill={element.fill ?? "#EDE7FB"}
                    stroke={element.stroke ?? "#4B2E83"}
                    strokeWidth="2"
                  />
                );
              case "rectangle":
                return (
                  <rect
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    fill={element.fill ?? "#EDE7FB"}
                    stroke={element.stroke ?? "#4B2E83"}
                    strokeWidth="2"
                  />
                );
              case "line":
                return (
                  <line
                    key={element.id}
                    x1={element.x1}
                    y1={element.y1}
                    x2={element.x2}
                    y2={element.y2}
                    stroke={element.stroke ?? "#334155"}
                    strokeWidth="2"
                  />
                );
              case "polygon":
                return (
                  <polygon
                    key={element.id}
                    points={element.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill={element.fill ?? "#EDE7FB"}
                    stroke={element.stroke ?? "#4B2E83"}
                    strokeWidth="2"
                  />
                );
              case "text":
                return (
                  <text
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    fill={element.colour ?? "#1F2937"}
                    fontSize="15"
                  >
                    {element.text}
                  </text>
                );
              default:
                return null;
            }
          })}
        </g>
        {labels.map((label, index) => (
          <text
            key={`label-${index}`}
            x={label.x}
            y={label.y}
            fontSize="14"
            fontWeight="600"
            fill="#4B2E83"
            textAnchor="middle"
          >
            {label.text}
          </text>
        ))}
      </svg>
      {visual.caption ? (
        <figcaption className="mt-2 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
