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
      segment="/practice"
      title="The practice catalogue didn't load"
      description="We couldn't fetch the list of practice programs. Trying again usually works."
      retryLabel="Try again"
      escape={{ href: "/", label: "Back to the home page" }}
    />
  );
}
