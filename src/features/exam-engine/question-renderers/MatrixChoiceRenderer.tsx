"use client";

import type { QuestionRendererProps } from "@/features/exam-engine/types";
import { toDomId } from "./renderer-utils";

export function MatrixChoiceRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const interaction =
    question.interaction?.type === "matrix_choice" ? question.interaction : undefined;
  const selected = Array.isArray(answer) ? [...answer] : [];
  if (!interaction) {
    return (
      <p role="alert" className="text-sm text-red-700">
        This matrix question is missing its rows and columns.
      </p>
    );
  }

  const maximum =
    interaction.maxSelections ?? interaction.cells.filter((cell) => cell.selectable).length;
  const byCoordinate = new Map(
    interaction.cells.map((cell) => [`${cell.rowId}\0${cell.columnId}`, cell]),
  );

  const toggle = (cellId: string, rowId: string, checked: boolean) => {
    if (disabled) return;
    let next = selected.filter((id) => id !== cellId);
    if (checked) {
      if (interaction.selectionMode === "single_per_row") {
        const rowCellIds = new Set(
          interaction.cells.filter((cell) => cell.rowId === rowId).map((cell) => cell.id),
        );
        next = next.filter((id) => !rowCellIds.has(id));
      }
      const rowMaximum =
        interaction.selectionMode === "single_per_row"
          ? 1
          : (interaction.maxSelectionsPerRow ??
            interaction.cells.filter((cell) => cell.rowId === rowId && cell.selectable).length);
      const selectedInRow = next.filter((id) =>
        interaction.cells.some((cell) => cell.id === id && cell.rowId === rowId),
      ).length;
      if (next.length < maximum && selectedInRow < rowMaximum) {
        next.push(cellId);
      }
    }
    onAnswerChange?.(next);
  };

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-lg font-semibold text-ink">{question.prompt}</legend>
      {question.instructions ? (
        <p className="text-sm text-muted">{question.instructions}</p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-royal/15">
        <table className="w-full border-collapse bg-white">
          <caption className="sr-only">Choose answers for each matrix row</caption>
          <thead>
            <tr>
              <th scope="col" className="p-3 text-left">
                Item
              </th>
              {interaction.columns.map((column) => (
                <th scope="col" key={column.id} className="p-3 text-center">
                  {column.text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interaction.rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200">
                <th scope="row" className="p-3 text-left font-medium text-ink">
                  {row.text}
                </th>
                {interaction.columns.map((column) => {
                  const cell = byCoordinate.get(`${row.id}\0${column.id}`);
                  if (!cell?.selectable) {
                    return (
                      <td
                        key={column.id}
                        className="p-3 text-center text-slate-400"
                        aria-label="Not available"
                      >
                        —
                      </td>
                    );
                  }
                  const id = `${toDomId(question.id)}-${toDomId(cell.id)}`;
                  const radio = interaction.selectionMode === "single_per_row";
                  return (
                    <td key={column.id} className="p-3 text-center">
                      <input
                        id={id}
                        type={radio ? "radio" : "checkbox"}
                        name={radio ? `${toDomId(question.id)}-${toDomId(row.id)}` : undefined}
                        checked={selected.includes(cell.id)}
                        disabled={disabled}
                        aria-label={cell.accessibleLabel ?? `${row.text}: ${column.text}`}
                        onChange={(event) =>
                          toggle(cell.id, row.id, event.currentTarget.checked)
                        }
                        className="h-5 w-5 accent-royal focus-visible:ring-2 focus-visible:ring-royal/40"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
