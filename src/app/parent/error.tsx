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
      segment="/parent"
      title="Your dashboard didn't load"
      description="We couldn't fetch your children's progress just now. Nothing has been changed or lost — this is a loading problem."
      retryLabel="Try again"
      escape={{ href: "/", label: "Back to the home page" }}
    />
  );
}
