"use client";

import { useId } from "react";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { describeBarModel } from "@/features/visuals/bar-model/describe";
import { layoutBarModel, type LaidOutSegment } from "@/features/visuals/bar-model/layout";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";
import { toDomId } from "./visual-utils";

/*
 * Schematic bar model. Ink is `currentColor` so the diagram follows the
 * surrounding theme (light, dark, or monochrome print); the single accent is
 * the brand purple, and it never works alone - the target is also hatched,
 * thick-outlined and labelled "?".
 */
const ACCENT = "var(--mm-brand, #5925a8)";
const SURFACE = "var(--mm-surface, #ffffff)";
const FONT_SIZE = 14;

function SegmentShape({ segment, hatchId, clipId }: { segment: LaidOutSegment; hatchId: string; clipId: string }) {
  const { x, y, width, height, kind, isTarget } = segment;
  const hasLabel = segment.label !== "";
  const hasAmount = segment.amount !== "";
  const centre = x + width / 2;
  const labelY = hasAmount ? y + 18 : y + height / 2 + 5;
  const amountY = hasLabel ? y + height - 10 : y + height / 2 + 6;

  const fill = kind === "unknown" ? `url(#${hatchId})` : kind === "blank" ? "none" : "currentColor";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={2}
        fill={fill}
        fillOpacity={kind === "value" || kind === "units" ? 0.07 : 1}
        stroke={isTarget ? ACCENT : "currentColor"}
        strokeWidth={isTarget ? 3 : 1.5}
        strokeDasharray={kind === "blank" ? "5 4" : undefined}
      />
      {segment.unitTicks.map((tick) => (
        <line
          key={tick}
          x1={tick}
          x2={tick}
          y1={y + 4}
          y2={y + height - 4}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeDasharray="3 3"
          opacity={0.7}
        />
      ))}
      <g clipPath={`url(#${clipId})`}>
        {hasLabel ? (
          <text x={centre} y={labelY} textAnchor="middle" fontSize={13} fill="currentColor">
            {segment.label}
          </text>
        ) : null}
        {hasAmount ? (
          <>
            {kind === "unknown" ? (
              <rect
                x={centre - 15}
                y={amountY - 18}
                width={30}
                height={24}
                rx={4}
                fill={SURFACE}
                stroke={isTarget ? ACCENT : "currentColor"}
                strokeWidth={1}
              />
            ) : null}
            <text
              x={centre}
              y={amountY}
              textAnchor="middle"
              fontSize={FONT_SIZE + 2}
              fontWeight={700}
              fill="currentColor"
            >
              {segment.amount}
            </text>
          </>
        ) : null}
      </g>
    </g>
  );
}

export function BarModelRenderer({ visual, className }: VisualRendererProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  if (visual.type !== "bar_model") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const layout = layoutBarModel(visual.data);
  const idPrefix = `bar-model-${toDomId(visual.id)}-${reactId}`;
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const hatchId = `${idPrefix}-hatch`;
  const description = `${visual.altText} ${describeBarModel(visual.data).join(" ")}`;

  return (
    <figure className={cn("w-full break-inside-avoid", className)} data-bar-model-id={visual.id}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="mx-auto block h-auto w-full text-ink"
        style={{ maxWidth: Math.round(layout.width * 1.6) }}
        fontSize={FONT_SIZE}
      >
        <title id={titleId}>{visual.title ?? "Bar model"}</title>
        <desc id={descId}>{description}</desc>
        <defs>
          <pattern id={hatchId} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={8} stroke={ACCENT} strokeWidth={2} opacity={0.4} />
          </pattern>
          {layout.bars.flatMap((bar) =>
            bar.segments.map((segment) => (
              <clipPath key={segment.id} id={`${idPrefix}-clip-${toDomId(segment.id)}`}>
                <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} />
              </clipPath>
            )),
          )}
        </defs>
        <g aria-hidden="true">
          {layout.guides.map((guide) => (
            <line
              key={guide.id}
              x1={guide.x}
              x2={guide.x}
              y1={guide.y1}
              y2={guide.y2}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="4 3"
              opacity={0.7}
            />
          ))}
          {layout.bars.map((bar) => (
            <g key={bar.id}>
              <text x={bar.x} y={bar.labelY} fontSize={FONT_SIZE} fontWeight={600} fill="currentColor">
                {bar.label}
              </text>
              {bar.segments.map((segment) => (
                <SegmentShape
                  key={segment.id}
                  segment={segment}
                  hatchId={hatchId}
                  clipId={`${idPrefix}-clip-${toDomId(segment.id)}`}
                />
              ))}
            </g>
          ))}
          {layout.braces.map((brace) => (
            <g key={brace.id}>
              <path
                d={brace.path}
                fill="none"
                stroke={brace.isTarget ? ACCENT : "currentColor"}
                strokeWidth={brace.isTarget ? 2.5 : 1.75}
                strokeLinecap="round"
              />
              {brace.text ? (
                <text
                  x={brace.textX}
                  y={brace.textY}
                  textAnchor={brace.anchor}
                  fontSize={FONT_SIZE}
                  fontWeight={brace.isTarget ? 700 : 600}
                  fill="currentColor"
                >
                  {brace.text}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      </svg>
      <p className="mt-2 text-center text-xs text-muted print:text-black">Diagram not to scale</p>
      {layout.unitKey.length > 0 ? (
        <ul className="mt-1 flex flex-wrap justify-center gap-x-4 text-center text-sm text-ink" aria-label="Unit key">
          {layout.unitKey.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {layout.notes.length > 0 ? (
        <ul className="mt-1 text-center text-sm text-ink" aria-label="How the bars are related">
          {layout.notes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {visual.caption ? (
        <figcaption className="mt-1 text-center text-sm text-slate-600">{visual.caption}</figcaption>
      ) : null}
    </figure>
  );
}
