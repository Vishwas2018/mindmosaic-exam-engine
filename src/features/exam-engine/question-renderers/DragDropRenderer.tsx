"use client";

import { useState } from "react";
import type { DragEvent } from "react";

import type { QuestionRendererProps } from "@/features/exam-engine/types";

import { toDomId } from "./renderer-utils";

export function DragDropRenderer({
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
    question.interaction?.type === "drag_drop" ? question.interaction : undefined;
  const [dragItemId, setDragItemId] = useState<string | null>(null);

  const placements: Record<string, string> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? { ...(answer as Record<string, string>) }
      : {};

  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This drag-and-drop question is missing its item configuration.
      </p>
    );
  }

  const place = (itemId: string, zoneId: string) => {
    if (disabled) return;
    const next = { ...placements };
    if (zoneId === "") {
      delete next[itemId];
    } else {
      next[itemId] = zoneId;
    }
    onAnswerChange?.(next);
  };

  const itemsById = new Map(interaction.items.map((item) => [item.id, item]));
  const unplaced = interaction.items.filter((item) => !placements[item.id]);

  const onDrop = (event: DragEvent, zoneId: string) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") || dragItemId;
    if (itemId) place(itemId, zoneId);
    setDragItemId(null);
  };

  return (
    <fieldset className="space-y-5" disabled={disabled} aria-describedby={instructionsId}>
      <legend className="text-lg font-semibold text-slate-900">{question.prompt}</legend>
      <p className="text-sm text-slate-600">
        Drag each item into a zone, or use the “Place in” menu for each item.
      </p>
      {question.instructions ? (
        <p id={instructionsId} className="text-sm text-slate-600">
          {question.instructions}
        </p>
      ) : null}

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-700">Items</h3>
        <ul className="flex flex-wrap gap-2">
          {unplaced.length === 0 ? (
            <li className="text-sm text-slate-500">All items placed.</li>
          ) : (
            unplaced.map((item) => (
              <li key={item.id}>
                <span
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", item.id);
                    setDragItemId(item.id);
                  }}
                  className="inline-flex min-h-11 cursor-grab items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 shadow-sm"
                >
                  {item.text}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {interaction.zones.map((zone) => {
          const placedItems = interaction.items.filter(
            (item) => placements[item.id] === zone.id,
          );
          return (
            <div
              key={zone.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, zone.id)}
              className="min-h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4"
            >
              <p className="text-sm font-bold text-slate-700">{zone.label}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {placedItems.map((item) => (
                  <li
                    key={item.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#4B2E83]/30 bg-[#F7F4FF] px-3 py-1.5 text-sm text-slate-800"
                  >
                    {item.text}
                    <button
                      type="button"
                      onClick={() => place(item.id, "")}
                      aria-label={`Remove ${item.text} from ${zone.label}`}
                      className="rounded px-1 text-[#4B2E83] hover:bg-[#4B2E83]/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#4B2E83]"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-700">
          Keyboard-friendly placement
        </h3>
        <ul className="grid gap-3">
          {interaction.items.map((item) => {
            const selectId = `${questionId}-place-${toDomId(item.id)}`;
            return (
              <li
                key={item.id}
                className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"
              >
                <label htmlFor={selectId} className="font-medium text-slate-800">
                  {itemsById.get(item.id)?.text}
                </label>
                <select
                  id={selectId}
                  value={placements[item.id] ?? ""}
                  disabled={disabled}
                  onChange={(event) => place(item.id, event.currentTarget.value)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus-visible:border-[#4B2E83] focus-visible:ring-2 focus-visible:ring-[#4B2E83]/30 disabled:cursor-not-allowed disabled:bg-slate-100 sm:w-56"
                >
                  <option value="">Place in…</option>
                  {interaction.zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.label}
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
