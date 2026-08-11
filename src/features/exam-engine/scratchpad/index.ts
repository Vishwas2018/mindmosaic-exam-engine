export { ScratchpadCanvas, type ScratchpadCanvasProps } from "./ScratchpadCanvas";
export { ScratchpadPanel, type ScratchpadPanelProps } from "./ScratchpadPanel";
export {
  MAX_NOTE_LENGTH,
  clearPersisted,
  readPersisted,
  selectEntry,
  useScratchpadStore,
  type ScratchpadActions,
  type ScratchpadState,
  type ScratchpadStore,
} from "./scratchpad-store";
export {
  appendPoint,
  distance,
  distanceToSegment,
  strokesHitAt,
  toNormalisedPoint,
  toSvgPath,
} from "./strokes";
export {
  EMPTY_ENTRY,
  STROKE_COLOURS,
  STROKE_COLOUR_HEX,
  isEntryEmpty,
  type ScratchPanelMode,
  type ScratchPoint,
  type ScratchTool,
  type ScratchpadEntry,
  type Stroke,
  type StrokeColour,
} from "./types";
