"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";

const WIDTH = 640;
const HEIGHT = 360;
const MARGIN = { top: 38, right: 24, bottom: 76, left: 72 } as const;
const GRID_LINE_COUNT = 5;

function niceMaximum(value: number): number {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const rounded = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;

  return rounded * magnitude;
}

function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function BarChartRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  if (visual.type !== "bar_chart") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { data } = visual;
  const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
  const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const maximumValue = data.maxValue ?? niceMaximum(Math.max(...data.values));
  const bandWidth = chartWidth / data.values.length;
  const barWidth = Math.min(64, bandWidth * 0.62);
  const idPrefix = `bar-chart-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="h-auto w-full max-w-3xl overflow-visible"
      >
        <title id={titleId}>{visual.title ?? "Bar chart"}</title>
        <desc id={descriptionId}>{visual.altText}</desc>

        {Array.from({ length: GRID_LINE_COUNT + 1 }, (_, index) => {
          const ratio = index / GRID_LINE_COUNT;
          const y = MARGIN.top + chartHeight - ratio * chartHeight;
          const tickValue = maximumValue * ratio;

          return (
            <g key={`grid-${index}`} aria-hidden="true">
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + chartWidth}
                y1={y}
                y2={y}
                stroke="#D0D5DD"
                strokeWidth="1"
              />
              <text
                x={MARGIN.left - 12}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#667085"
              >
                {Number.isInteger(tickValue) ? tickValue : tickValue.toFixed(1)}
              </text>
            </g>
          );
        })}

        {data.values.map((value, index) => {
          const barHeight = (value / maximumValue) * chartHeight;
          const x = MARGIN.left + bandWidth * index + (bandWidth - barWidth) / 2;
          const y = MARGIN.top + chartHeight - barHeight;

          return (
            <g key={`${index}-${data.labels[index]}`} aria-hidden="true">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill={data.colour}
              />
              <text
                x={x + barWidth / 2}
                y={Math.max(MARGIN.top + 14, y - 8)}
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill="#1F2937"
              >
                {value}
              </text>
              <text
                x={x + barWidth / 2}
                y={MARGIN.top + chartHeight + 24}
                textAnchor="middle"
                fontSize="13"
                fill="#1F2937"
              >
                {data.labels[index]}
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

        {data.xAxisLabel ? (
          <text
            x={MARGIN.left + chartWidth / 2}
            y={HEIGHT - 14}
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
            x="18"
            y={MARGIN.top + chartHeight / 2}
            transform={`rotate(-90 18 ${MARGIN.top + chartHeight / 2})`}
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

      {visual.caption ? (
        <figcaption className="mt-2 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
