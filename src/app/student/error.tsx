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
      segment="/student"
      title="Your dashboard didn't load"
      description="We couldn't load your learning page. Your progress is saved — trying again usually fixes it."
      retryLabel="Try again"
      escape={{ href: "/practice", label: "Go to practice" }}
    />
  );
}
