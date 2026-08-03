"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { Button, Modal } from "@/components/ui";

export type IntegrityEventKind = "left_exam" | "clipboard" | "context_menu";

const EVENT_COPY: Record<IntegrityEventKind, { title: string; body: string }> = {
  left_exam: {
    title: "You left the exam window",
    body: "Switching to another tab, window or app during a timed sitting is recorded. The timer kept running. Come back to this window and keep going.",
  },
  clipboard: {
    title: "Copy and paste are off",
    body: "During a timed sitting you cannot copy the questions or paste an answer in. Type your answer in your own words.",
  },
  context_menu: {
    title: "Right-click is off",
    body: "The right-click menu is disabled during a timed sitting so questions cannot be copied or searched.",
  },
};

/**
 * Exam-conditions guard for timed sittings.
 *
 * What this can and cannot do, stated plainly because the difference
 * matters: a web page cannot stop a determined student from opening another
 * device, taking a photo of the screen, or disabling JavaScript. Everything
 * here is deterrence and record-keeping — it raises the effort, makes the
 * rules visible, and counts the times they were bent. The measures that
 * actually protect a score are already server-side: the server picks the
 * questions, holds the answer key, and scores the attempt (see
 * docs/ASSESSMENT_SECURITY_MODEL.md), so nothing a browser does can change
 * a mark.
 *
 * Deliberately NOT blocked: text selection. Reading-comprehension questions
 * are long passages, and following the text with a cursor or a screen
 * reader's selection is how some children read. Blocking it would cost a
 * real accessibility affordance to stop a copy that the clipboard block
 * already stops.
 *
 * Only runs for timed sittings. Untimed practice is meant to be a relaxed,
 * look-things-up-if-you-like mode, and putting exam conditions on it would
 * make the two modes the same thing.
 */
export function ExamIntegrityMonitor({ active }: { active: boolean }) {
  const [warning, setWarning] = useState<IntegrityEventKind | null>(null);
  const [counts, setCounts] = useState<Record<IntegrityEventKind, number>>({
    left_exam: 0,
    clipboard: 0,
    context_menu: 0,
  });

  /* Read inside listeners so the effect below depends only on `active` and
     never re-attaches (and re-arms) on every recorded event. */
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  });

  const record = useCallback((kind: IntegrityEventKind) => {
    setCounts((current) => ({ ...current, [kind]: current[kind] + 1 }));
    /* Never replaces a warning already on screen: the first thing a student
       did wrong is the one worth reading, and a stack of dialogs during a
       running clock is its own punishment. */
    setWarning((current) => current ?? kind);
  }, []);

  /* Refresh, close and back get the browser's own "leave site?" prompt.
     A custom message is not possible — every browser shows its own text —
     so this only arms the prompt; the wording is the browser's. */
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      /* Legacy browsers require a returnValue to show the prompt at all. */
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  /* Tab switch, window switch, minimise, or the screen locking. `blur` is
     not enough on its own (it also fires for an iframe or a devtools
     focus) and visibilitychange misses a switch to another window on the
     same screen, so both are watched and the pair is debounced below. */
  useEffect(() => {
    if (!active) return;
    let lastAt = 0;
    const leave = () => {
      const now = Date.now();
      /* One switch away can fire visibilitychange and blur together;
         count it once. */
      if (now - lastAt < 750) return;
      lastAt = now;
      record("left_exam");
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
    };
  }, [active, record]);

  /* Clipboard and the right-click menu, blocked in the capture phase so a
     component's own handler cannot let one through. */
  useEffect(() => {
    if (!active) return;
    const blockClipboard = (event: Event) => {
      event.preventDefault();
      record("clipboard");
    };
    const blockContextMenu = (event: Event) => {
      event.preventDefault();
      record("context_menu");
    };
    for (const type of ["copy", "cut", "paste"]) {
      document.addEventListener(type, blockClipboard, true);
    }
    document.addEventListener("contextmenu", blockContextMenu, true);
    return () => {
      for (const type of ["copy", "cut", "paste"]) {
        document.removeEventListener(type, blockClipboard, true);
      }
      document.removeEventListener("contextmenu", blockContextMenu, true);
    };
  }, [active, record]);

  if (!active) return null;

  const total = counts.left_exam + counts.clipboard + counts.context_menu;
  const copy = warning ? EVENT_COPY[warning] : null;

  return (
    <>
      <span
        data-testid="integrity-status"
        title={
          total === 0
            ? "Exam conditions are on: copy, paste and right-click are off, and leaving this window is recorded."
            : `${counts.left_exam} time(s) away from this window, ${counts.clipboard} clipboard attempt(s), ${counts.context_menu} right-click attempt(s).`
        }
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold ${
          total === 0
            ? "bg-royal/6 text-royal"
            : "bg-warning/10 text-warning"
        }`}
      >
        {total === 0 ? (
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        ) : (
          <ShieldAlert aria-hidden="true" className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {total === 0 ? "Exam conditions" : `${total} warning${total === 1 ? "" : "s"}`}
        </span>
        <span className="sm:hidden">{total === 0 ? "Exam" : total}</span>
      </span>

      <Modal
        open={warning !== null}
        onClose={() => setWarning(null)}
        title={copy?.title ?? ""}
        description={copy?.body}
      >
        <div className="flex justify-end">
          <Button type="button" onClick={() => setWarning(null)} data-testid="integrity-dismiss">
            Back to the exam
          </Button>
        </div>
      </Modal>
    </>
  );
}
