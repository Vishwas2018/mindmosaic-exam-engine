"use client";

import { useState } from "react";

import { countWords } from "@/features/exam-engine/question-renderers/renderer-utils";

import type { WritingRubric } from "../rubric";

import { RubricMarkForm, type MarkPayload } from "./RubricMarkForm";

async function postJson(url: string, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`request_failed_${response.status}`);
}

/** Marks an attempt that is already recorded (handed in on screen, or recorded earlier from paper). */
export function AttemptMarkForm({
  rubric,
  attemptId,
  initial,
  backHref,
}: {
  rubric: WritingRubric;
  attemptId: string;
  initial: { scores: Record<string, number>; comments: Record<string, string>; feedback: string | null } | null;
  backHref: string;
}) {
  return (
    <RubricMarkForm
      rubric={rubric}
      initial={initial}
      backHref={backHref}
      save={(marks) => postJson(`/api/writing/attempts/${attemptId}/mark`, marks)}
    />
  );
}

interface PaperProps {
  rubric: WritingRubric;
  linkedChildren: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
  backHref: string;
}

/**
 * "Marked on paper": the parent picks the child and the task, scores the six
 * criteria from the sheet in their hand, and saves. Typing the response in is
 * optional and tucked away, because the fast path (under three minutes) does not
 * need it; with no text the attempt is kept as a paper-only record with its marks.
 */
export function PaperMarkEntry({ rubric, linkedChildren, tasks, backHref }: PaperProps) {
  const [childId, setChildId] = useState(linkedChildren[0]?.id ?? "");
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [text, setText] = useState("");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-2xl border border-royal/10 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink">
          Child
          <select
            value={childId}
            onChange={(event) => setChildId(event.currentTarget.value)}
            className="mt-1 block w-full rounded-xl border border-royal/20 bg-white px-3 py-2 text-base"
          >
            {linkedChildren.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Task
          <select
            value={taskId}
            onChange={(event) => setTaskId(event.currentTarget.value)}
            className="mt-1 block w-full rounded-xl border border-royal/20 bg-white px-3 py-2 text-base"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="rounded-2xl border border-royal/10 bg-white p-4">
        <summary className="cursor-pointer font-bold text-royal">
          {text.trim() ? "Typed response (optional)" : "Also type in what they wrote (optional)"}
        </summary>
        <p className="mt-2 text-sm text-muted">
          Not needed to mark. Add it if you want a typed copy kept with the marks. Type exactly what your child wrote,
          including slips.
        </p>
        <label htmlFor="paper-text" className="sr-only">
          Your child&apos;s writing
        </label>
        <textarea
          id="paper-text"
          data-testid="paper-text"
          rows={8}
          value={text}
          spellCheck={false}
          autoCorrect="off"
          onChange={(event) => setText(event.currentTarget.value)}
          className="mt-2 w-full rounded-xl border border-royal/20 px-3 py-2 text-base leading-7"
        />
        <p className="mt-1 text-sm text-muted">{countWords(text)} words</p>
      </details>

      <RubricMarkForm
        rubric={rubric}
        backHref={backHref}
        save={(marks: MarkPayload) =>
          postJson("/api/writing/paper", {
            childId,
            taskId,
            text: text.trim() === "" ? undefined : text,
            mark: marks,
          })
        }
      />
    </div>
  );
}
