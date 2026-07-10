"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { formatNumber, toDomId } from "./visual-utils";

const SIZE = 320;
const PADDING = 36;

export function CoordinateGridRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "coordinate_grid") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { xRange, yRange, points, gridStep } = visual.data;
  const [minX, maxX] = xRange;
  const [minY, maxY] = yRange;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const plot = SIZE - PADDING * 2;
  const toX = (x: number) => PADDING + ((x - minX) / spanX) * plot;
  const toY = (y: number) => SIZE - PADDING - ((y - minY) / spanY) * plot;

  const xTicks: number[] = [];
  for (let v = Math.ceil(minX / gridStep) * gridStep; v <= maxX + 1e-9; v += gridStep) {
    xTicks.push(Number(v.toFixed(6)));
  }
  const yTicks: number[] = [];
  for (let v = Math.ceil(minY / gridStep) * gridStep; v <= maxY + 1e-9; v += gridStep) {
    yTicks.push(Number(v.toFixed(6)));
  }

  const idPrefix = `coordinate-grid-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="h-auto w-full max-w-sm"
      >
        <title id={titleId}>{visual.title ?? "Coordinate grid"}</title>
        <desc id={descId}>{visual.altText}</desc>
        <g aria-hidden="true">
          {xTicks.map((v) => (
            <line key={`vx-${v}`} x1={toX(v)} x2={toX(v)} y1={PADDING} y2={SIZE - PADDING} stroke="#E2E8F0" />
          ))}
          {yTicks.map((v) => (
            <line key={`hy-${v}`} x1={PADDING} x2={SIZE - PADDING} y1={toY(v)} y2={toY(v)} stroke="#E2E8F0" />
          ))}
          <line
            x1={PADDING}
            x2={SIZE - PADDING}
            y1={toY(Math.max(minY, Math.min(maxY, 0)))}
            y2={toY(Math.max(minY, Math.min(maxY, 0)))}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
          <line
            x1={toX(Math.max(minX, Math.min(maxX, 0)))}
            x2={toX(Math.max(minX, Math.min(maxX, 0)))}
            y1={PADDING}
            y2={SIZE - PADDING}
            stroke="#1F2937"
            strokeWidth="1.5"
          />
          {xTicks.map((v) => (
            <text key={`xt-${v}`} x={toX(v)} y={SIZE - PADDING + 16} textAnchor="middle" fontSize="10" fill="#667085">
              {formatNumber(v)}
            </text>
          ))}
          {yTicks.map((v) => (
            <text key={`yt-${v}`} x={PADDING - 8} y={toY(v) + 3} textAnchor="end" fontSize="10" fill="#667085">
              {formatNumber(v)}
            </text>
          ))}
        </g>
        {points.map((point, index) => (
          <g key={`pt-${index}`} aria-hidden="true">
            <circle cx={toX(point.x)} cy={toY(point.y)} r="5" fill="#4B2E83" />
            {point.label ? (
              <text x={toX(point.x) + 8} y={toY(point.y) - 8} fontSize="12" fontWeight="600" fill="#1F2937">
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <ul className="sr-only">
        {points.map((point, index) => (
          <li key={index}>
            {point.label ? `${point.label} at ` : ""}
            ({formatNumber(point.x)}, {formatNumber(point.y)})
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
