/**
 * Teacher notes and manual intervention flags, mocked behind typed
 * functions. Neither concept has a backing table yet (see
 * docs/DATA_MODEL_AND_ROLES.md), so this is an in-memory stand-in scoped
 * to the server process — good enough to drive the Student Detail screen
 * without a migration. Swapping in a real `student_notes` /
 * `student_interventions` table later only touches this file.
 */

export interface TeacherNote {
  id: string;
  studentId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface InterventionFlagState {
  studentId: string;
  flagged: boolean;
  flaggedAt: string | null;
}

const notesByStudent = new Map<string, TeacherNote[]>();
const flagsByStudent = new Map<string, InterventionFlagState>();
let nextNoteId = 1;

export async function listTeacherNotes(studentId: string): Promise<TeacherNote[]> {
  return [...(notesByStudent.get(studentId) ?? [])];
}

export async function addTeacherNote(
  studentId: string,
  authorName: string,
  body: string,
): Promise<TeacherNote> {
  const note: TeacherNote = {
    id: `note-${nextNoteId++}`,
    studentId,
    authorName,
    body,
    createdAt: new Date().toISOString(),
  };
  const existing = notesByStudent.get(studentId) ?? [];
  notesByStudent.set(studentId, [note, ...existing]);
  return note;
}

export async function getInterventionFlag(
  studentId: string,
): Promise<InterventionFlagState> {
  return flagsByStudent.get(studentId) ?? { studentId, flagged: false, flaggedAt: null };
}

export async function setInterventionFlag(
  studentId: string,
  flagged: boolean,
): Promise<InterventionFlagState> {
  const state: InterventionFlagState = {
    studentId,
    flagged,
    flaggedAt: flagged ? new Date().toISOString() : null,
  };
  flagsByStudent.set(studentId, state);
  return state;
}
