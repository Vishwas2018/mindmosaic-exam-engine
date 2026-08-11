/**
 * Rough-work scratchpad: types.
 *
 * Stroke points are stored in NORMALISED coordinates (0..1 of the drawing
 * surface), never pixels. The panel is resizable — docked, maximised, and
 * whatever width the viewport gives it — and a child who works a sum out
 * in the small panel then maximises it must see the same sum, scaled, not
 * a drawing clipped to the old box. Normalised points make every redraw a
 * pure multiply by the current box, so the geometry survives resize,
 * orientation change and reopening at a different size.
 */

/** A point on the drawing surface, each axis in 0..1. */
export interface ScratchPoint {
  x: number;
  y: number;
}

/**
 * Pen colours offered to the child. Deliberately a tiny fixed set rather
 * than a colour picker: this is working-out space, and a picker is one
 * more thing to fiddle with while a timer runs.
 */
export const STROKE_COLOURS = ["slate", "royal", "orange"] as const;
export type StrokeColour = (typeof STROKE_COLOURS)[number];

/** Concrete CSS colours for each pen, and for rendering into the SVG. */
export const STROKE_COLOUR_HEX: Record<StrokeColour, string> = {
  slate: "#334155",
  royal: "#4f46e5",
  orange: "#f7700c",
};

export interface Stroke {
  /** Stable id so an eraser can remove one stroke without reindexing. */
  id: string;
  colour: StrokeColour;
  points: readonly ScratchPoint[];
}

export type ScratchTool = "pen" | "eraser";

/**
 * Panel display state. `minimised` collapses to a title bar the child can
 * reopen; `docked` is the default working size; `maximised` fills the
 * viewport for long division and diagrams. Closed is tracked separately
 * (`isOpen`) so minimising and closing stay distinct actions — minimising
 * keeps the work visible-in-one-click, closing gets it out of the way.
 */
export type ScratchPanelMode = "minimised" | "docked" | "maximised";

/** Everything a single question's rough work holds. */
export interface ScratchpadEntry {
  strokes: readonly Stroke[];
  note: string;
}

export const EMPTY_ENTRY: ScratchpadEntry = { strokes: [], note: "" };

/** True when nothing has been drawn or typed for this question. */
export function isEntryEmpty(entry: ScratchpadEntry | undefined): boolean {
  if (!entry) return true;
  return entry.strokes.length === 0 && entry.note.trim() === "";
}
