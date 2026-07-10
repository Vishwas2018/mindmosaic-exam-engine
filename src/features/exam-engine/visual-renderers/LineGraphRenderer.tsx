"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { formatNumber, toDomId } from "./visual-utils";

const WIDTH = 640;
const HEIGHT = 380;
const MARGIN = { top: 32, right: 28, bottom: 64, left: 68 } as const;

export function LineGraphRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "line_graph") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { data } = visual;
  const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
  const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xs = data.points.map((p) => p.x);
  const ys = data.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const toX = (x: number) => MARGIN.left + ((x - minX) / spanX) * chartWidth;
  const toY = (y: number) =>
    MARGIN.top + chartHeight - ((y - minY) / spanY) * chartHeight;

  const idPrefix = `line-graph-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const path = data.points
    .map((p, index) => `${index === 0 ? "M" : "L"} ${toX(p.x)} ${toY(p.y)}`)
    .join(" ");

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="h-auto w-full max-w-3xl"
      >
        <title id={titleId}>{visual.title ?? "Line graph"}</title>
        <desc id={descId}>{visual.altText}</desc>
        {Array.from({ length: 5 }, (_, index) => {
          const ratio = index / 4;
          const y = MARGIN.top + chartHeight - ratio * chartHeight;
          const tickValue = minY + ratio * spanY;
          return (
            <g key={`grid-${index}`} aria-hidden="true">
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + chartWidth}
                y1={y}
                y2={y}
                stroke="#E2E8F0"
              />
              <text x={MARGIN.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#667085">
                {formatNumber(tickValue)}
              </text>
            </g>
          );
        })}
        <line
          x1={MARGIN.left}
          x2={MARGIN.left}
          y1={MARGIN.top}
          y2={MARGIN.top + chartHeight}
          stroke="#1F2937"
          strokeWidth="1.5"
          aria-hidden="true"
        />
        <line
          x1={MARGIN.left}
          x2={MARGIN.left + chartWidth}
          y1={MARGIN.top + chartHeight}
          y2={MARGIN.top + chartHeight}
          stroke="#1F2937"
          strokeWidth="1.5"
          aria-hidden="true"
        />
        <path d={path} fill="none" stroke={data.colour} strokeWidth="2.5" aria-hidden="true" />
        {data.points.map((point, index) => (
          <g key={`point-${index}`} aria-hidden="true">
            <circle cx={toX(point.x)} cy={toY(point.y)} r="4.5" fill={data.colour} />
            {point.label ? (
              <text
                x={toX(point.x)}
                y={toY(point.y) - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#1F2937"
              >
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
        {data.xAxisLabel ? (
          <text
            x={MARGIN.left + chartWidth / 2}
            y={HEIGHT - 12}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="#475467"
            aria-hidden="true"
          >
            {data.xAxisLabel}
          </text>
        ) : null}
        {data.yAxisLabel ? (
          <text
            x="16"
            y={MARGIN.top + chartHeight / 2}
            transform={`rotate(-90 16 ${MARGIN.top + chartHeight / 2})`}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="#475467"
            aria-hidden="true"
          >
            {data.yAxisLabel}
          </text>
        ) : null}
      </svg>
      <ul className="sr-only">
        {data.points.map((point, index) => (
          <li key={index}>
            {point.label ? `${point.label}: ` : ""}
            x {formatNumber(point.x)}, y {formatNumber(point.y)}
          </li>
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
