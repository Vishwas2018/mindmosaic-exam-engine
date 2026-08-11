"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { selectEntry, useScratchpadStore } from "./scratchpad-store";
import { toNormalisedPoint, toSvgPath } from "./strokes";
import { STROKE_COLOUR_HEX, type Stroke } from "./types";

export interface ScratchpadCanvasProps {
  questionId: string;
  /** Disables drawing once the paper is submitted or the deadline passed. */
  disabled?: boolean;
}

/**
 * The drawing surface, rendered as SVG rather than a <canvas> bitmap.
 *
 * Two reasons, both about this feature specifically. First, the panel
 * resizes — docked to maximised, portrait to landscape — and a bitmap
 * either stretches (blurring a child's digits) or is redrawn from a
 * scaled copy of itself, compounding loss each time. SVG paths are
 * regenerated from the normalised points at whatever size the box now is,
 * so the tenth resize is as crisp as the first. Second, strokes stay
 * individually addressable, which is what makes stroke-level erase and
 * undo trivial instead of requiring a snapshot stack.
 */
export function ScratchpadCanvas({ questionId, disabled = false }: ScratchpadCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const entry = useScratchpadStore((state) => selectEntry(state, questionId));
  const drawing = useScratchpadStore((state) => state.drawing);
  const tool = useScratchpadStore((state) => state.tool);
  const beginStroke = useScratchpadStore((state) => state.beginStroke);
  const extendStroke = useScratchpadStore((state) => state.extendStroke);
  const endStroke = useScratchpadStore((state) => state.endStroke);
  const eraseAt = useScratchpadStore((state) => state.eraseAt);

  /* The SVG viewBox tracks the rendered pixel size so path coordinates and
     stroke widths stay in the same units the pointer reports. */
  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setBox({ width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pointFrom = useCallback((event: { clientX: number; clientY: number }) => {
    const element = surfaceRef.current;
    if (!element) return { x: 0, y: 0 };
    const rect = element.getBoundingClientRect();
    return toNormalisedPoint(event.clientX, event.clientY, rect);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      /* Primary contact only: a resting palm on a tablet fires secondary
         pointers, and treating those as pen strokes draws a smear across
         the working the child is trying to write. */
      if (!event.isPrimary) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      beginStroke(questionId, pointFrom(event));
    },
    [beginStroke, disabled, pointFrom, questionId],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !event.isPrimary) return;
      /* buttons === 0 means the pointer is hovering, not drawing. */
      if (event.buttons === 0) return;
      const point = pointFrom(event);
      if (tool === "eraser") {
        eraseAt(questionId, point);
        return;
      }
      extendStroke(point);
    },
    [disabled, eraseAt, extendStroke, pointFrom, questionId, tool],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !event.isPrimary) return;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      endStroke(questionId);
    },
    [disabled, endStroke, questionId],
  );

  const strokes: readonly Stroke[] = drawing ? [...entry.strokes, drawing] : entry.strokes;

  return (
    <div
      ref={surfaceRef}
      data-testid="scratchpad-surface"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={[
        "relative h-full w-full overflow-hidden rounded-xl border border-royal/10",
        /* Squared paper, drawn in CSS — a familiar surface for setting out
           columns, and free of an image request. */
        "bg-white bg-[linear-gradient(to_right,rgba(79,70,229,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,70,229,0.07)_1px,transparent_1px)]",
        "bg-[size:24px_24px]",
        /* Without touch-action:none a drag on a tablet scrolls the page
           instead of drawing, which makes the pad unusable on the devices
           children are most likely to sit an exam on. */
        "touch-none select-none",
        disabled ? "cursor-not-allowed opacity-60" : tool === "eraser" ? "cursor-cell" : "cursor-crosshair",
      ].join(" ")}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${Math.max(box.width, 1)} ${Math.max(box.height, 1)}`}
        preserveAspectRatio="none"
      >
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={toSvgPath(stroke.points, box.width, box.height)}
            fill="none"
            stroke={STROKE_COLOUR_HEX[stroke.colour]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
