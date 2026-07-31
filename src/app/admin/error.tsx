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
      segment="/admin"
      title="This admin page didn't load"
      description="An aggregate view failed to load. No platform data has been changed."
      retryLabel="Try again"
      escape={{ href: "/admin", label: "Back to admin home" }}
    />
  );
}
