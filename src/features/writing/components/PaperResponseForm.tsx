"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/ui";
import { countWords } from "@/features/exam-engine/question-renderers/renderer-utils";

interface Props {
  linkedChildren: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
}

/**
 * A parent types in what their child wrote on paper. Phase 1 has no photo
 * upload: typing is the path, and the typed text is what gets marked and kept
 * with the attempt. A photo of the page can be added later without changing
 * this flow (see the PR's follow-ups).
 */
export function PaperResponseForm({ linkedChildren, tasks }: Props) {
  const router = useRouter();
  const [childId, setChildId] = useState(linkedChildren[0]?.id ?? "");
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const ready = childId !== "" && taskId !== "" && text.trim() !== "";

  async function submit() {
    setState("saving");
    try {
      const response = await fetch("/api/writing/paper", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId, taskId, text }),
      });
      if (!response.ok) throw new Error("paper_failed");
      const { attempt } = (await response.json()) as { attempt: { id: string } };
      router.push(`/writing/mark/${attempt.id}`);
    } catch {
      setState("error");
    }
  }

  if (linkedChildren.length === 0 || tasks.length === 0) return null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) void submit();
      }}
      className="space-y-4 rounded-2xl border border-royal/10 bg-white p-5"
    >
      <h2 className="text-lg font-extrabold text-ink">Add a response written on paper</h2>
      <p className="text-sm text-muted">
        Type in exactly what your child wrote, including any spelling or punctuation slips. Marking works from what you
        type here.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
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

      <div>
        <label htmlFor="paper-text" className="text-sm font-bold text-ink">
          Your child&apos;s writing
        </label>
        <textarea
          id="paper-text"
          data-testid="paper-text"
          rows={10}
          value={text}
          spellCheck={false}
          autoCorrect="off"
          onChange={(event) => setText(event.currentTarget.value)}
          className="mt-1 w-full rounded-xl border border-royal/20 px-3 py-2 text-base leading-7"
        />
        <p className="mt-1 text-sm text-muted">{countWords(text)} words</p>
      </div>

      {state === "error" ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          Couldn&apos;t save that. Check you are linked to this child and try again.
        </p>
      ) : null}
      <button type="submit" data-testid="paper-save" disabled={!ready || state === "saving"} className={buttonClasses({ variant: "primary" })}>
        {state === "saving" ? "Saving…" : "Save and mark"}
      </button>
    </form>
  );
}
