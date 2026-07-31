"use client";

import { RouteError } from "@/components/route-boundaries";

/**
 * The boundary that matters most: a child is mid-exam.
 *
 * The copy does one job before anything else — say that their answers are
 * not gone. They are not: every answer is autosaved server-side to
 * exam_responses as it is given (POST /api/exam/session/[id]/responses), and
 * /api/exam/session/active reconstructs the session from that autosave plus
 * the server's own stored question selection. So "try again" really does
 * resume, and saying so is the difference between a child who clicks it and
 * a child who thinks the work is lost.
 *
 * The escape hatch goes to /practice rather than "/" because that is where
 * a new session starts; sending them to the marketing page mid-exam would
 * be an odd place to land.
 */
export default function ExamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      segment="/exam"
      title="The exam hit a problem"
      description="Your answers so far are saved. Picking up where you left off usually works — nothing has been submitted or marked yet."
      retryLabel="Resume the exam"
      escape={{ href: "/practice", label: "Back to practice" }}
    />
  );
}
