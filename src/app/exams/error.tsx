"use client";

import { RouteError } from "@/components/route-boundaries";

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
      segment="/exams"
      title="We couldn't load the practice papers."
      description="This is usually temporary. Try again, or head back and come to practice papers from there."
      retryLabel="Try again"
      /* "/" rather than a role dashboard: this boundary catches errors for
         guests too, and a link to /student that bounces them to sign-in
         would be a second failure on top of the first. */
      escape={{ href: "/", label: "Back to the home page" }}
    />
  );
}
