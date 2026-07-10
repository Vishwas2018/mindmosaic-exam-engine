"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { formatNumber, toDomId } from "./visual-utils";

const SIZE = 240;

type Vertex = { x: number; y: number };

function canonicalVertices(shape: string): Vertex[] | null {
  const m = 60;
  const max = SIZE - 60;
  switch (shape) {
    case "square":
      return [
        { x: m, y: m },
        { x: max, y: m },
        { x: max, y: max },
        { x: m, y: max },
      ];
    case "rectangle":
      return [
        { x: 40, y: 80 },
        { x: SIZE - 40, y: 80 },
        { x: SIZE - 40, y: SIZE - 80 },
        { x: 40, y: SIZE - 80 },
      ];
    case "triangle":
      return [
        { x: SIZE / 2, y: 40 },
        { x: SIZE - 40, y: SIZE - 50 },
        { x: 40, y: SIZE - 50 },
      ];
    case "polygon":
      return Array.from({ length: 5 }, (_, index) => {
        const angle = -Math.PI / 2 + (index * 2 * Math.PI) / 5;
        return {
          x: SIZE / 2 + 80 * Math.cos(angle),
          y: SIZE / 2 + 80 * Math.sin(angle),
        };
      });
    default:
      return null;
  }
}

function fitVertices(vertices: Vertex[]): Vertex[] {
  const xs = vertices.map((v) => v.x);
  const ys = vertices.map((v) => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((SIZE - 80) / spanX, (SIZE - 80) / spanY);
  const offsetX = (SIZE - spanX * scale) / 2;
  const offsetY = (SIZE - spanY * scale) / 2;
  return vertices.map((v) => ({
    x: offsetX + (v.x - minX) * scale,
    y: offsetY + (v.y - minY) * scale,
  }));
}

export function GeometryShapeRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "geometry_shape") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { shape, measurements, vertices } = visual.data;
  const idPrefix = `geometry-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const polygon = vertices ? fitVertices(vertices) : canonicalVertices(shape);

  return (
    <figure className={cn("w-full", className)}>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          className="h-auto w-52 shrink-0"
        >
          <title id={titleId}>{visual.title ?? `${shape} shape`}</title>
          <desc id={descId}>{visual.altText}</desc>
          {shape === "circle" && !vertices ? (
            <circle cx={SIZE / 2} cy={SIZE / 2} r={80} fill="#EDE7FB" stroke="#4B2E83" strokeWidth="2.5" aria-hidden="true" />
          ) : polygon ? (
            <polygon
              points={polygon.map((v) => `${v.x},${v.y}`).join(" ")}
              fill="#EDE7FB"
              stroke="#4B2E83"
              strokeWidth="2.5"
              aria-hidden="true"
            />
          ) : null}
        </svg>
        {measurements.length > 0 ? (
          <dl className="grid gap-1.5 text-sm">
            {measurements.map((measurement, index) => (
              <div key={index} className="flex gap-2">
                <dt className="font-medium text-slate-800">{measurement.label}:</dt>
                <dd className="text-slate-600">
                  {formatNumber(measurement.value)}
                  {measurement.unit ? ` ${measurement.unit}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {visual.caption ? (
        <figcaption className="mt-3 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
