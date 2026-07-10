"use client";

import type { KeyboardEvent } from "react";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

const SELECTED_FILL = "rgba(75,46,131,0.32)";
const IDLE_FILL = "rgba(75,46,131,0.06)";

export function HotspotRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const visual = question.visuals.find((item) => item.type === "hotspot_svg");
  const selected = Array.isArray(answer) ? (answer as readonly string[]) : [];

  if (!visual || visual.type !== "hotspot_svg") {
    return (
      <p role="alert" className="text-sm text-red-700">
        This hotspot question is missing its selectable diagram.
      </p>
    );
  }

  const { width, height, elements, regions } = visual.data;
  const titleId = `${questionId}-hotspot-title`;

  const toggle = (regionId: string) => {
    if (disabled) return;
    const next = selected.includes(regionId)
      ? selected.filter((id) => id !== regionId)
      : [...selected, regionId];
    onAnswerChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<SVGElement>, regionId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(regionId);
    }
  };

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">
        Select the correct region or regions on the diagram.
      </p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-labelledby={titleId}
        className="h-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white"
      >
        <title id={titleId}>{visual.title ?? visual.altText}</title>
        <desc>{visual.altText}</desc>
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
                    stroke={element.stroke ?? "#C9BEF0"}
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
                    stroke={element.stroke ?? "#C9BEF0"}
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
                    stroke={element.stroke ?? "#94A3B8"}
                  />
                );
              case "polygon":
                return (
                  <polygon
                    key={element.id}
                    points={element.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill={element.fill ?? "#EDE7FB"}
                    stroke={element.stroke ?? "#C9BEF0"}
                  />
                );
              case "text":
                return (
                  <text
                    key={element.id}
                    x={element.x}
                    y={element.y}
                    fill={element.colour ?? "#334155"}
                    fontSize="14"
                  >
                    {element.text}
                  </text>
                );
              default:
                return null;
            }
          })}
        </g>
        {regions.map((region) => {
          const isSelected = selected.includes(region.id);
          const shared = {
            role: "checkbox" as const,
            "aria-checked": isSelected,
            "aria-label": region.accessibleLabel,
            tabIndex: disabled ? -1 : 0,
            onClick: () => toggle(region.id),
            onKeyDown: (event: KeyboardEvent<SVGElement>) => onKeyDown(event, region.id),
            fill: isSelected ? SELECTED_FILL : IDLE_FILL,
            stroke: "#4B2E83",
            strokeWidth: isSelected ? 3 : 1.5,
            className: "cursor-pointer focus:outline-none focus-visible:stroke-[3]",
            style: { outline: "none" as const },
          };
          if (region.shape === "circle") {
            return <circle key={region.id} cx={region.cx} cy={region.cy} r={region.r} {...shared} />;
          }
          if (region.shape === "rectangle") {
            return (
              <rect
                key={region.id}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                rx={6}
                {...shared}
              />
            );
          }
          return (
            <polygon
              key={region.id}
              points={region.points.map((p) => `${p.x},${p.y}`).join(" ")}
              {...shared}
            />
          );
        })}
      </svg>
      <ul className="sr-only" aria-live="polite">
        {regions
          .filter((region) => selected.includes(region.id))
          .map((region) => (
            <li key={region.id}>{region.accessibleLabel} selected</li>
          ))}
      </ul>
    </fieldset>
  );
}
