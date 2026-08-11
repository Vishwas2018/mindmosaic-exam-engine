"use client";

import { create } from "zustand";

import { appendPoint, strokesHitAt, toNormalisedPoint } from "./strokes";
import {
  EMPTY_ENTRY,
  type ScratchPanelMode,
  type ScratchPoint,
  type ScratchTool,
  type ScratchpadEntry,
  type Stroke,
  type StrokeColour,
} from "./types";

/**
 * Rough-work scratchpad state.
 *
 * Deliberately a store of its own rather than a slice of exam-store, for
 * one reason that outweighs the mild duplication: this state persists to
 * sessionStorage and exam-store's does not. exam-store holds `responses`
 * — the child's actual answers — and putting a persistence layer on it
 * would write those answers to browser storage, which
 * docs/ASSESSMENT_SECURITY_MODEL.md is at pains to keep out of the client's
 * durable surface. Keeping the two stores separate means the scratchpad
 * can be persisted freely without ever widening what exam-store exposes.
 *
 * Nothing here is sent to the server. Rough work is the child's thinking,
 * not their submission; it is never scored, never read back by a teacher,
 * and dies with the browser tab.
 */

const STORAGE_KEY = "mindmosaic.scratchpad.v1";

/** Cap per question, so a child scribbling cannot fill sessionStorage. */
const MAX_STROKES_PER_QUESTION = 400;
/** Cap on typed notes, matching a generous but bounded working-out space. */
export const MAX_NOTE_LENGTH = 2000;

export interface ScratchpadState {
  /**
   * Identifies the sitting these entries belong to. When the exam page
   * reports a different key, every entry is dropped — otherwise question
   * ids repeat across sittings and a child would open question 3 of a new
   * paper to find last week's working already on the page.
   */
  sessionKey: string | null;
  isOpen: boolean;
  mode: ScratchPanelMode;
  tool: ScratchTool;
  colour: StrokeColour;
  /** Rough work per question id. */
  entries: Record<string, ScratchpadEntry>;
  /** The stroke currently being drawn, if the pointer is down. */
  drawing: Stroke | null;
}

export interface ScratchpadActions {
  /** Adopt a sitting, clearing entries if it is a different one. */
  useSession: (sessionKey: string | null) => void;
  open: () => void;
  close: () => void;
  setMode: (mode: ScratchPanelMode) => void;
  toggleMaximised: () => void;
  toggleMinimised: () => void;
  setTool: (tool: ScratchTool) => void;
  setColour: (colour: StrokeColour) => void;

  beginStroke: (questionId: string, point: ScratchPoint) => void;
  extendStroke: (point: ScratchPoint) => void;
  endStroke: (questionId: string) => void;
  eraseAt: (questionId: string, point: ScratchPoint) => void;
  undo: (questionId: string) => void;
  clearQuestion: (questionId: string) => void;

  setNote: (questionId: string, note: string) => void;
  /** Drop everything — called when a sitting is submitted. */
  clearAll: () => void;
}

export type ScratchpadStore = ScratchpadState & ScratchpadActions;

function createInitialState(): ScratchpadState {
  return {
    sessionKey: null,
    isOpen: false,
    mode: "docked",
    tool: "pen",
    colour: "slate",
    entries: {},
    drawing: null,
  };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

interface PersistedShape {
  sessionKey: string | null;
  entries: Record<string, ScratchpadEntry>;
}

/**
 * sessionStorage, not localStorage: rough work should not outlive the tab.
 * A shared family computer must not show the next child the previous
 * child's working, and nothing here is valuable enough to justify durable
 * storage.
 */
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    /* Storage can throw outright (Safari private mode, blocked cookies).
       The scratchpad degrades to in-memory rather than breaking the exam. */
    return null;
  }
}

export function readPersisted(): PersistedShape | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<PersistedShape>;
    if (!candidate.entries || typeof candidate.entries !== "object") return null;
    return {
      sessionKey: typeof candidate.sessionKey === "string" ? candidate.sessionKey : null,
      entries: candidate.entries,
    };
  } catch {
    /* Corrupt or foreign data in our key: ignore it and start clean rather
       than letting a JSON error take down the exam page on mount. */
    return null;
  }
}

function writePersisted(state: ScratchpadState): void {
  const store = storage();
  if (!store) return;
  try {
    const payload: PersistedShape = {
      sessionKey: state.sessionKey,
      entries: state.entries,
    };
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* Quota exceeded, or storage disabled mid-session. Losing rough work
       is bad; losing the sitting is worse. Fail quiet and keep going. */
  }
}

export function clearPersisted(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    /* See writePersisted. */
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let strokeCounter = 0;

function nextStrokeId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  strokeCounter += 1;
  return `stroke-${Date.now()}-${strokeCounter}`;
}

function entryOf(state: ScratchpadState, questionId: string): ScratchpadEntry {
  return state.entries[questionId] ?? EMPTY_ENTRY;
}

function withEntry(
  state: ScratchpadState,
  questionId: string,
  next: ScratchpadEntry,
): Pick<ScratchpadState, "entries"> {
  return { entries: { ...state.entries, [questionId]: next } };
}

export const useScratchpadStore = create<ScratchpadStore>((set, get) => ({
  ...createInitialState(),

  useSession: (sessionKey) => {
    const state = get();
    if (state.sessionKey === sessionKey) return;

    /* First adoption after a page load: rehydrate, but only if the stored
       work belongs to this same sitting. A refresh mid-exam keeps the
       child's working; a new sitting starts on a blank page. */
    const persisted = readPersisted();
    const entries =
      persisted && persisted.sessionKey === sessionKey && sessionKey !== null
        ? persisted.entries
        : {};

    const next: ScratchpadState = {
      ...state,
      sessionKey,
      entries,
      drawing: null,
    };
    set(next);
    writePersisted(next);
  },

  open: () => set((state) => ({ isOpen: true, mode: state.mode === "minimised" ? "docked" : state.mode })),
  close: () => set({ isOpen: false, drawing: null }),
  setMode: (mode) => set({ mode }),
  toggleMaximised: () =>
    set((state) => ({ mode: state.mode === "maximised" ? "docked" : "maximised" })),
  toggleMinimised: () =>
    set((state) => ({ mode: state.mode === "minimised" ? "docked" : "minimised" })),
  setTool: (tool) => set({ tool }),
  setColour: (colour) => set({ colour, tool: "pen" }),

  beginStroke: (questionId, point) => {
    const state = get();
    if (state.tool === "eraser") {
      get().eraseAt(questionId, point);
      return;
    }
    if (entryOf(state, questionId).strokes.length >= MAX_STROKES_PER_QUESTION) return;
    set({ drawing: { id: nextStrokeId(), colour: state.colour, points: [point] } });
  },

  extendStroke: (point) => {
    const { drawing } = get();
    if (!drawing) return;
    const points = appendPoint(drawing.points, point);
    if (points === drawing.points) return;
    set({ drawing: { ...drawing, points } });
  },

  endStroke: (questionId) => {
    const state = get();
    const { drawing } = state;
    if (!drawing) return;
    const entry = entryOf(state, questionId);
    const next: ScratchpadEntry = { ...entry, strokes: [...entry.strokes, drawing] };
    const updated = { ...state, ...withEntry(state, questionId, next), drawing: null };
    set({ entries: updated.entries, drawing: null });
    writePersisted(updated);
  },

  eraseAt: (questionId, point) => {
    const state = get();
    const entry = entryOf(state, questionId);
    const hits = new Set(strokesHitAt(entry.strokes, point));
    if (hits.size === 0) return;
    const next: ScratchpadEntry = {
      ...entry,
      strokes: entry.strokes.filter((stroke) => !hits.has(stroke.id)),
    };
    const updated = { ...state, ...withEntry(state, questionId, next) };
    set({ entries: updated.entries });
    writePersisted(updated);
  },

  undo: (questionId) => {
    const state = get();
    const entry = entryOf(state, questionId);
    if (entry.strokes.length === 0) return;
    const next: ScratchpadEntry = { ...entry, strokes: entry.strokes.slice(0, -1) };
    const updated = { ...state, ...withEntry(state, questionId, next) };
    set({ entries: updated.entries });
    writePersisted(updated);
  },

  clearQuestion: (questionId) => {
    const state = get();
    const updated = { ...state, ...withEntry(state, questionId, EMPTY_ENTRY), drawing: null };
    set({ entries: updated.entries, drawing: null });
    writePersisted(updated);
  },

  setNote: (questionId, note) => {
    const state = get();
    const entry = entryOf(state, questionId);
    const next: ScratchpadEntry = { ...entry, note: note.slice(0, MAX_NOTE_LENGTH) };
    const updated = { ...state, ...withEntry(state, questionId, next) };
    set({ entries: updated.entries });
    writePersisted(updated);
  },

  clearAll: () => {
    set({ entries: {}, drawing: null, isOpen: false });
    clearPersisted();
  },
}));

/** Selector: the entry for a question, never undefined. */
export function selectEntry(state: ScratchpadStore, questionId: string): ScratchpadEntry {
  return state.entries[questionId] ?? EMPTY_ENTRY;
}

export { toNormalisedPoint };
