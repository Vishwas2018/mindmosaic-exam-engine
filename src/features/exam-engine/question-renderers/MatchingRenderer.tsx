"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function MatchingRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const questionId = toDomId(question.id);
  const instructionsId = question.instructions
    ? `${questionId}-instructions`
    : undefined;
  const interaction =
    question.interaction?.type === "matching" ? question.interaction : undefined;
  const current = useMemo<Record<string, string>>(
    () => answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {},
    [answer],
  );
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const lineContainerRef = useRef<HTMLDivElement>(null);
  const sourceButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const targetButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const [lineLayout, setLineLayout] = useState<{
    width: number;
    height: number;
    lines: readonly { sourceId: string; x1: number; y1: number; x2: number; y2: number }[];
  }>({ width: 1, height: 1, lines: [] });
  const connectionKey = interaction
    ? interaction.sources.map((source) => `${source.id}:${current[source.id] ?? ""}`).join("|")
    : "";

  useLayoutEffect(() => {
    if (!interaction || interaction.presentation !== "draw_lines") return;
    const container = lineContainerRef.current;
    if (!container) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const lines = interaction.sources.flatMap((source) => {
        const targetId = current[source.id];
        const sourceButton = sourceButtonRefs.current.get(source.id);
        const targetButton = targetId ? targetButtonRefs.current.get(targetId) : undefined;
        if (!sourceButton || !targetButton) return [];
        const sourceRect = sourceButton.getBoundingClientRect();
        const targetRect = targetButton.getBoundingClientRect();
        return [{
          sourceId: source.id,
          x1: sourceRect.right - containerRect.left,
          y1: sourceRect.top + sourceRect.height / 2 - containerRect.top,
          x2: targetRect.left - containerRect.left,
          y2: targetRect.top + targetRect.height / 2 - containerRect.top,
        }];
      });
      setLineLayout({ width: containerRect.width || 1, height: containerRect.height || 1, lines });
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(container);
    sourceButtonRefs.current.forEach((button) => observer?.observe(button));
    targetButtonRefs.current.forEach((button) => observer?.observe(button));
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [connectionKey, current, interaction]);

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This matching question is missing its item configuration.
      </p>
    );
  }

  const update = (sourceId: string, value: string) => {
    if (disabled) return;
    const next = { ...current };
    if (value === "") {
      delete next[sourceId];
    } else {
      next[sourceId] = value;
    }
    onAnswerChange?.(next);
  };
  const drawLines = interaction.presentation === "draw_lines";

  return (
    <fieldset className="space-y-4" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">{drawLines ? "Choose an item in the left column, then its match in the right column." : "Choose the matching answer for each item."}</p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}
      {drawLines ? (
        <div ref={lineContainerRef} className="relative grid grid-cols-2 gap-16 rounded-2xl border border-slate-200 bg-white p-4" role="group" aria-label="Join matching items">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${lineLayout.width} ${lineLayout.height}`} preserveAspectRatio="none">
            {lineLayout.lines.map((line) => (
              <line key={line.sourceId} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="currentColor" strokeWidth="2" className="text-royal" />
            ))}
          </svg>
          <div className="grid gap-2">{interaction.sources.map((source) => <button ref={(node) => { if (node) sourceButtonRefs.current.set(source.id, node); else sourceButtonRefs.current.delete(source.id); }} key={source.id} type="button" disabled={disabled} aria-pressed={activeSource === source.id} onClick={() => setActiveSource(source.id)} className="relative z-10 min-h-11 rounded-xl border border-slate-300 bg-white p-2 text-left outline-none aria-pressed:border-royal aria-pressed:bg-royal/10 focus-visible:ring-2 focus-visible:ring-royal/40">{source.text}</button>)}</div>
          <div className="grid gap-2">{interaction.targets.map((target) => <button ref={(node) => { if (node) targetButtonRefs.current.set(target.id, node); else targetButtonRefs.current.delete(target.id); }} key={target.id} type="button" disabled={disabled || !activeSource} aria-label={`Match with ${target.text}`} onClick={() => { if (activeSource) update(activeSource, target.id); setActiveSource(null); }} className="relative z-10 min-h-11 rounded-xl border border-slate-300 bg-white p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-royal/40 disabled:opacity-60">{target.text}</button>)}</div>
        </div>
      ) : null}
      <div className={drawLines ? "rounded-2xl border border-slate-200 bg-slate-50 p-4" : ""}>
      {drawLines ? <h3 className="mb-3 text-sm font-bold text-slate-700">Keyboard and screen-reader alternative</h3> : null}
      <ul className="grid gap-3">
        {interaction.sources.map((source) => {
          const selectId = `${questionId}-match-${toDomId(source.id)}`;
          return (
            <li
              key={source.id}
              className="grid gap-2 rounded-xl border border-slate-300 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
            >
              <label htmlFor={selectId} className="font-medium text-slate-800">
                {source.text}
              </label>
              <select
                id={selectId}
                value={current[source.id] ?? ""}
                disabled={disabled}
                onChange={(event) => update(source.id, event.currentTarget.value)}
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-royal focus-visible:ring-2 focus-visible:ring-royal/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-64"
              >
                <option value="">Choose a match…</option>
                {interaction.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.text}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
      </div>
    </fieldset>
  );
}
