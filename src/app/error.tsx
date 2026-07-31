"use client";

import { RouteError } from "@/components/route-boundaries";

/*
 * Root boundary: catches anything thrown by a public page that has no closer boundary of its own. The root layout is covered separately by global-error.tsx.
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
      segment="/ (public pages)"
      title="This page didn't load"
      description="Something went wrong on our side. It's usually temporary — trying again is the fastest fix."
      retryLabel="Try again"
    />
  );
}
