"use client";

import { useId } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Maximize2,
  Minimize2,
  PencilLine,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { Button, Textarea } from "@/components/ui";

import { ScratchpadCanvas } from "./ScratchpadCanvas";
import { MAX_NOTE_LENGTH, selectEntry, useScratchpadStore } from "./scratchpad-store";
import { STROKE_COLOURS, STROKE_COLOUR_HEX, type StrokeColour } from "./types";

export interface ScratchpadPanelProps {
  questionId: string;
  /** 1-based position, shown so the child knows which question this belongs to. */
  questionNumber: number;
  disabled?: boolean;
}

/*
 * Note on clipboard: the notes box needs no paste handling of its own.
 * ExamIntegrityMonitor already registers copy/cut/paste listeners on
 * `document` in the capture phase for timed sittings, so a paste aimed at
 * this textarea is blocked and recorded before it reaches React at all. A
 * local onPaste here would be a second implementation of the same rule,
 * free to drift from it.
 */

const COLOUR_LABEL: Record<StrokeColour, string> = {
  slate: "Grey pen",
  royal: "Purple pen",
  orange: "Orange pen",
};

/**
 * Rough-work pad for the exam runner.
 *
 * Children are told in every exam hall to show their working, and a paper
 * sitting gives them the margin to do it in. On screen there is nowhere —
 * so a child doing a two-step subtraction either holds it in their head or
 * reaches for paper that the timer does not know about. This panel is that
 * margin: freehand for the sum, typed notes for the thought.
 *
 * Nothing in it is scored, submitted, or shown to a teacher. It is the
 * child's own working space, and saying so plainly on the panel matters —
 * a child who thinks their scribbles are being marked will not use it.
 */
export function ScratchpadPanel({
  questionId,
  questionNumber,
  disabled = false,
}: ScratchpadPanelProps) {
  const headingId = useId();
  const noteId = useId();

  const isOpen = useScratchpadStore((state) => state.isOpen);
  const mode = useScratchpadStore((state) => state.mode);
  const tool = useScratchpadStore((state) => state.tool);
  const colour = useScratchpadStore((state) => state.colour);
  const entry = useScratchpadStore((state) => selectEntry(state, questionId));

  const close = useScratchpadStore((state) => state.close);
  const setTool = useScratchpadStore((state) => state.setTool);
  const setColour = useScratchpadStore((state) => state.setColour);
  const toggleMaximised = useScratchpadStore((state) => state.toggleMaximised);
  const toggleMinimised = useScratchpadStore((state) => state.toggleMinimised);
  const undo = useScratchpadStore((state) => state.undo);
  const clearQuestion = useScratchpadStore((state) => state.clearQuestion);
  const setNote = useScratchpadStore((state) => state.setNote);

  if (!isOpen) return null;

  const isMinimised = mode === "minimised";
  const isMaximised = mode === "maximised";

  const shellClasses = isMaximised
    ? "inset-3 sm:inset-6"
    : "bottom-3 right-3 w-[min(26rem,calc(100vw-1.5rem))] sm:bottom-6 sm:right-6";

  return (
    <section
      aria-labelledby={headingId}
      data-testid="scratchpad-panel"
      data-mode={mode}
      className={`fixed z-40 flex flex-col rounded-2xl border border-royal/15 bg-white shadow-2xl ${shellClasses}`}
    >
      <header className="flex items-center gap-2 border-b border-royal/10 px-3 py-2">
        <PencilLine aria-hidden="true" className="h-4 w-4 shrink-0 text-royal" />
        <h2 id={headingId} className="flex-1 truncate text-sm font-semibold text-slate-900">
          Rough work
          <span className="ml-1 font-normal text-muted">· Question {questionNumber}</span>
        </h2>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMinimised}
          aria-expanded={!isMinimised}
          aria-label={isMinimised ? "Expand rough work" : "Minimise rough work"}
          data-testid="scratchpad-minimise"
        >
          {isMinimised ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMaximised}
          aria-pressed={isMaximised}
          aria-label={isMaximised ? "Restore rough work to normal size" : "Maximise rough work"}
          data-testid="scratchpad-maximise"
        >
          {isMaximised ? (
            <Minimize2 aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          aria-label="Close rough work"
          data-testid="scratchpad-close"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </Button>
      </header>

      {isMinimised ? null : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
          <div
            role="toolbar"
            aria-label="Drawing tools"
            aria-controls={`${headingId}-surface`}
            className="flex flex-wrap items-center gap-1.5"
          >
            {STROKE_COLOURS.map((option) => {
              const active = tool === "pen" && colour === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColour(option)}
                  aria-pressed={active}
                  aria-label={COLOUR_LABEL[option]}
                  data-testid={`scratchpad-colour-${option}`}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    active ? "border-royal ring-2 ring-royal/30" : "border-slate-200"
                  }`}
                  style={{ backgroundColor: STROKE_COLOUR_HEX[option] }}
                />
              );
            })}

            <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />

            <Button
              variant={tool === "eraser" ? "orange" : "secondary"}
              size="sm"
              onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}
              aria-pressed={tool === "eraser"}
              data-testid="scratchpad-eraser"
            >
              <Eraser aria-hidden="true" className="h-4 w-4" />
              Rubber
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => undo(questionId)}
              disabled={entry.strokes.length === 0}
              data-testid="scratchpad-undo"
            >
              <Undo2 aria-hidden="true" className="h-4 w-4" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearQuestion(questionId)}
              disabled={entry.strokes.length === 0 && entry.note === ""}
              data-testid="scratchpad-clear"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div
            id={`${headingId}-surface`}
            className={isMaximised ? "min-h-0 flex-1" : "h-56"}
          >
            <ScratchpadCanvas questionId={questionId} disabled={disabled} />
          </div>

          <Textarea
            id={noteId}
            label="Notes"
            rows={isMaximised ? 4 : 2}
            value={entry.note}
            maxLength={MAX_NOTE_LENGTH}
            disabled={disabled}
            data-testid="scratchpad-note"
            onChange={(event) => setNote(questionId, event.target.value)}
            placeholder="Jot a note to yourself…"
            hint="Only you see this. It is not marked and is not sent with your answers."
          />
        </div>
      )}
    </section>
  );
}
