"use client";

import { useState } from "react";
import { AlertTriangle, Flag } from "lucide-react";

import { Badge, Button, Textarea } from "@/components/ui";

import { formatShortDate } from "../format";
import {
  addTeacherNote,
  setInterventionFlag,
  type InterventionFlagState,
  type TeacherNote,
} from "../mock-notes";

/**
 * Teacher notes + manual intervention flag for the Student Detail screen.
 * Seeded from server-loaded mock data, then manages the rest of the
 * session client-side — see mock-notes.ts for why there is no real
 * persistence yet.
 */
export function TeacherNotesPanel({
  studentId,
  teacherName,
  initialNotes,
  initialFlag,
}: {
  studentId: string;
  teacherName: string;
  initialNotes: TeacherNote[];
  initialFlag: InterventionFlagState;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [flag, setFlag] = useState(initialFlag);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFlag, setIsTogglingFlag] = useState(false);

  async function saveNote() {
    const body = draft.trim();
    if (!body) return;
    setIsSaving(true);
    try {
      const note = await addTeacherNote(studentId, teacherName, body);
      setNotes((current) => [note, ...current]);
      setDraft("");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleFlag() {
    setIsTogglingFlag(true);
    try {
      const next = await setInterventionFlag(studentId, !flag.flagged);
      setFlag(next);
    } finally {
      setIsTogglingFlag(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-royal/10 bg-white p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              flag.flagged ? "bg-error/10 text-error" : "bg-royal/8 text-royal"
            }`}
          >
            <Flag className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Manual intervention flag</p>
            <p className="text-xs text-muted">
              {flag.flagged
                ? `Flagged ${formatShortDate(flag.flaggedAt)}`
                : "Not currently flagged"}
            </p>
          </div>
          {flag.flagged && <Badge variant="error">Flagged</Badge>}
        </div>
        <Button
          type="button"
          variant={flag.flagged ? "secondary" : "danger"}
          size="sm"
          isLoading={isTogglingFlag}
          onClick={toggleFlag}
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
          {flag.flagged ? "Clear flag" : "Flag for intervention"}
        </Button>
      </div>

      <div className="space-y-3">
        <Textarea
          label="Add a note"
          placeholder="Record an observation for other teachers…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
        />
        <Button
          type="button"
          size="sm"
          disabled={draft.trim().length === 0}
          isLoading={isSaving}
          onClick={saveNote}
        >
          Save note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm leading-6 text-muted">No notes recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-royal/10 bg-white p-4">
              <p className="text-sm leading-6 text-ink">{note.body}</p>
              <p className="mt-2 text-xs font-semibold text-muted">
                {note.authorName} · {formatShortDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
