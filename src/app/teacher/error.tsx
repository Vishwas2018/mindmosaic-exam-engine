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
      segment="/teacher"
      title="This teacher page didn't load"
      description="We couldn't fetch class data just now. No student record has been changed."
      retryLabel="Try again"
      escape={{ href: "/teacher", label: "Back to the overview" }}
    />
  );
}
