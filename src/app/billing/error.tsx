"use client";

import { RouteError } from "@/components/route-boundaries";

/*
 * Money screens need the reassurance stated explicitly: a failure here reads as 'did something happen to my payment?' unless told otherwise.
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
      segment="/billing"
      title="Billing didn't load"
      description="We couldn't reach your subscription details. Nothing has been charged, changed or cancelled — this is a display problem."
      retryLabel="Try again"
      escape={{ href: "/", label: "Back to the home page" }}
    />
  );
}
