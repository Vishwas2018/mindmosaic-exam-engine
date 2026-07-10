"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { formatNumber, toDomId } from "./visual-utils";

const WIDTH = 640;
const HEIGHT = 130;
const PADDING = 40;
const AXIS_Y = 70;

export function NumberLineRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "number_line") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { min, max, step, highlightedValues } = visual.data;
  const span = max - min || 1;
  const toX = (value: number) =>
    PADDING + ((value - min) / span) * (WIDTH - PADDING * 2);

  const ticks: number[] = [];
  for (let value = min; value <= max + step / 1000; value += step) {
    ticks.push(Number(value.toFixed(6)));
  }

  const idPrefix = `number-line-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="h-auto w-full max-w-3xl"
      >
        <title id={titleId}>{visual.title ?? "Number line"}</title>
        <desc id={descId}>{visual.altText}</desc>
        <line
          x1={PADDING}
          x2={WIDTH - PADDING}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke="#1F2937"
          strokeWidth="2"
          aria-hidden="true"
        />
        {ticks.map((value) => (
          <g key={value} aria-hidden="true">
            <line
              x1={toX(value)}
              x2={toX(value)}
              y1={AXIS_Y - 8}
              y2={AXIS_Y + 8}
              stroke="#1F2937"
              strokeWidth="1.5"
            />
            <text x={toX(value)} y={AXIS_Y + 26} textAnchor="middle" fontSize="13" fill="#334155">
              {formatNumber(value)}
            </text>
          </g>
        ))}
        {highlightedValues.map((value) => (
          <circle
            key={`hl-${value}`}
            cx={toX(value)}
            cy={AXIS_Y}
            r="8"
            fill="#FF8A00"
            stroke="#B45309"
            strokeWidth="2"
            aria-hidden="true"
          />
        ))}
      </svg>
      {highlightedValues.length > 0 ? (
        <p className="sr-only">
          Highlighted values: {highlightedValues.map(formatNumber).join(", ")}.
        </p>
      ) : null}
      {visual.caption ? (
        <figcaption className="mt-2 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
