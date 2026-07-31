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
      segment="/auth"
      title="That link didn't work"
      description="The sign-in or reset link couldn't be processed. These links expire, so requesting a fresh one usually solves it."
      retryLabel="Try again"
      escape={{ href: "/sign-in", label: "Go to sign in" }}
    />
  );
}
