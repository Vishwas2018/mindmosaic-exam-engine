"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { formatNumber, paletteColour, toDomId } from "./visual-utils";

const SIZE = 240;
const RADIUS = 108;
const CENTRE = SIZE / 2;

function polarPoint(angle: number, radius: number): [number, number] {
  return [CENTRE + radius * Math.cos(angle), CENTRE + radius * Math.sin(angle)];
}

export function PieChartRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "pie_chart") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const segments = visual.data.segments;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const idPrefix = `pie-chart-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  const withColour = segments.map((segment, index) => ({
    ...segment,
    colour: segment.colour ?? paletteColour(index),
    percentage: total > 0 ? (segment.value / total) * 100 : 0,
  }));

  let cursor = -Math.PI / 2;

  return (
    <figure className={cn("w-full", className)}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          className="h-auto w-56 shrink-0"
        >
          <title id={titleId}>{visual.title ?? "Pie chart"}</title>
          <desc id={descId}>{visual.altText}</desc>
          {total <= 0 ? (
            <circle cx={CENTRE} cy={CENTRE} r={RADIUS} fill="#E2E8F0" aria-hidden="true" />
          ) : withColour.length === 1 ? (
            <circle
              cx={CENTRE}
              cy={CENTRE}
              r={RADIUS}
              fill={withColour[0].colour}
              aria-hidden="true"
            />
          ) : (
            withColour.map((segment, index) => {
              const angle = (segment.value / total) * Math.PI * 2;
              const [x1, y1] = polarPoint(cursor, RADIUS);
              const [x2, y2] = polarPoint(cursor + angle, RADIUS);
              const largeArc = angle > Math.PI ? 1 : 0;
              const path = `M ${CENTRE} ${CENTRE} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              cursor += angle;
              return (
                <path
                  key={index}
                  d={path}
                  fill={segment.colour}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  aria-hidden="true"
                />
              );
            })
          )}
        </svg>
        <ul className="grid gap-2">
          {withColour.map((segment, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
                style={{ backgroundColor: segment.colour }}
              />
              <span className="font-medium text-slate-800">{segment.label}</span>
              <span className="text-slate-500">
                {formatNumber(segment.value)} ({Math.round(segment.percentage)}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
      {visual.caption ? (
        <figcaption className="mt-3 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
