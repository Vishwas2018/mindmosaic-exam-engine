/**
 * Candidate response shapes.
 *
 * Every response is JSON-serialisable so an attempt can be persisted or moved
 * to a future backend without transformation. The CandidateAnswer union is the
 * storage shape held in exam state; the per-type aliases below document the
 * concrete shape each renderer produces and each scorer consumes.
 */

/** Selected option id. */
export type SingleSelectionResponse = string;
/** Selected option ids (order irrelevant). */
export type MultiSelectionResponse = readonly string[];
/** Numeric entry; null while empty. */
export type NumberResponse = number | null;
/** Free-text entry. */
export type TextResponse = string;
/** True/false selection. */
export type BooleanResponse = boolean;
/** Map of blank id to entered text. */
export type FillBlankResponse = Readonly<Record<string, string>>;
/** Map of dropdown field id to selected option id. */
export type DropdownResponse = Readonly<Record<string, string>>;
/** Map of source id to chosen target id. */
export type MatchingResponse = Readonly<Record<string, string>>;
/** Ordered list of item ids. */
export type OrderingResponse = readonly string[];
/** Map of label id to target slot id. */
export type LabelDiagramResponse = Readonly<Record<string, string>>;
/** Selected hotspot region ids. */
export type HotspotResponse = readonly string[];
/** Map of item id to drop-zone id. */
export type DragDropResponse = Readonly<Record<string, string>>;

export type CandidateAnswer =
  | string
  | number
  | boolean
  | readonly string[]
  | Readonly<Record<string, string>>
  | null;

export type ExamResponses = Readonly<Record<string, CandidateAnswer | undefined>>;
