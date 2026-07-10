"use client";

import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";

import { UnsupportedVisualRenderer } from "./UnsupportedVisualRenderer";

export function TableRenderer({ visual, className }: VisualRendererProps) {
  if (visual.type !== "table") {
    return <UnsupportedVisualRenderer visual={visual} className={className} />;
  }

  const { headers, rows, rowHeaders } = visual.data;
  const caption = visual.title ?? visual.caption ?? visual.altText;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="mb-3 text-left text-sm font-semibold text-slate-800">
          {caption}
        </caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="border-b-2 border-slate-300 bg-slate-50 px-4 py-2.5 font-bold text-slate-800"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/60">
              {row.map((cell, cellIndex) =>
                rowHeaders && cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className="border-b border-slate-200 px-4 py-2.5 font-semibold text-slate-800"
                  >
                    {cell}
                  </th>
                ) : (
                  <td
                    key={cellIndex}
                    className="border-b border-slate-200 px-4 py-2.5 text-slate-700"
                  >
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
