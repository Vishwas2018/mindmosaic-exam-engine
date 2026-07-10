"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { toDomId } from "./visual-utils";

const WIDTH = 300;
const HEIGHT = 160;
const EMPTY = "#F1F5F9";
const STROKE = "#334155";

export function FractionModelRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "fraction_model") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { numerator, denominator, model, colour } = visual.data;
  const idPrefix = `fraction-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  const renderBar = () => {
    const partWidth = (WIDTH - 40) / denominator;
    return Array.from({ length: denominator }, (_, index) => (
      <rect
        key={index}
        x={20 + index * partWidth}
        y={50}
        width={partWidth}
        height={60}
        fill={index < numerator ? colour : EMPTY}
        stroke={STROKE}
        strokeWidth="1.5"
      />
    ));
  };

  const renderCircle = () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const r = 62;
    let cursor = -Math.PI / 2;
    return Array.from({ length: denominator }, (_, index) => {
      const angle = (Math.PI * 2) / denominator;
      const x1 = cx + r * Math.cos(cursor);
      const y1 = cy + r * Math.sin(cursor);
      const x2 = cx + r * Math.cos(cursor + angle);
      const y2 = cy + r * Math.sin(cursor + angle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      cursor += angle;
      return (
        <path
          key={index}
          d={path}
          fill={index < numerator ? colour : EMPTY}
          stroke={STROKE}
          strokeWidth="1.5"
        />
      );
    });
  };

  const renderSet = () => {
    const perRow = Math.min(denominator, 6);
    const rows = Math.ceil(denominator / perRow);
    const gapX = (WIDTH - 40) / perRow;
    const gapY = Math.min(50, (HEIGHT - 40) / rows);
    return Array.from({ length: denominator }, (_, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      return (
        <circle
          key={index}
          cx={20 + gapX * (col + 0.5)}
          cy={30 + gapY * (row + 0.5)}
          r={Math.min(18, gapX / 2.6, gapY / 2.6)}
          fill={index < numerator ? colour : EMPTY}
          stroke={STROKE}
          strokeWidth="1.5"
        />
      );
    });
  };

  return (
    <figure className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="mx-auto h-auto w-full max-w-xs"
      >
        <title id={titleId}>{visual.title ?? "Fraction model"}</title>
        <desc id={descId}>{visual.altText}</desc>
        <g aria-hidden="true">
          {model === "bar" ? renderBar() : model === "circle" ? renderCircle() : renderSet()}
        </g>
      </svg>
      <p className="mt-2 text-center text-sm font-semibold text-slate-700">
        {numerator} out of {denominator} shaded
      </p>
      {visual.caption ? (
        <figcaption className="mt-1 text-center text-sm text-slate-600">
          {visual.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
