"use client";

import { RouteError } from "@/components/route-boundaries";

/*
 * A child looking for a mark they just earned needs to be told the mark still exists before anything else.
 */

export default function SegmentError({
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
      segment="/results"
      title="Your results didn't load"
      description="The scores themselves are safe — they're stored on our servers when an exam is submitted, not in this page. This is a display problem, not a lost result."
      retryLabel="Try again"
      escape={{ href: "/practice", label: "Back to practice" }}
    />
  );
}
