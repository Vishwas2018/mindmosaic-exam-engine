"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, Textarea } from "@/components/ui";

/**
 * Records a mark for one manual-review response. Posts to
 * /api/teacher/marking; the server re-validates the mark against the
 * question's own availableMarks and RLS re-checks class ownership
 * independently of anything chosen here.
 */
export function EssayMarkForm({
  attemptId,
  questionId,
  availableMarks,
  classId,
  initialAwardedMarks,
  initialFeedback,
}: {
  attemptId: string;
  questionId: string;
  availableMarks: number;
  classId: string | null;
  initialAwardedMarks: number | null;
  initialFeedback: string | null;
}) {
  const router = useRouter();
  const [awardedMarks, setAwardedMarks] = useState(
    initialAwardedMarks !== null ? String(initialAwardedMarks) : "",
  );
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numericMarks = Number(awardedMarks);
    if (awardedMarks.trim() === "" || !Number.isFinite(numericMarks)) {
      setError("Enter a mark.");
      return;
    }
    if (numericMarks < 0 || numericMarks > availableMarks) {
      setError(`Mark must be between 0 and ${availableMarks}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/marking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId,
          awardedMarks: numericMarks,
          feedback: feedback.trim() || null,
        }),
      });
      if (!response.ok) {
        setError("The mark could not be saved. Please try again.");
        return;
      }
      const query = classId ? `?class=${classId}` : "";
      router.push(`/teacher/marking${query}`);
      router.refresh();
    } catch {
      setError("The mark could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input
        label="Marks awarded"
        type="number"
        min={0}
        max={availableMarks}
        step={1}
        value={awardedMarks}
        onChange={(event) => setAwardedMarks(event.target.value)}
        hint={`Out of ${availableMarks}.`}
        required
      />
      <Textarea
        label="Feedback (optional)"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        placeholder="Notes for this student's response…"
        maxLength={4000}
      />
      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={isSubmitting} loadingLabel="Saving">
        {initialAwardedMarks !== null ? "Update mark" : "Save mark"}
      </Button>
    </form>
  );
}
