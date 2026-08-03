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
      title="We couldn't load the practice catalogue."
      description="This is usually temporary. Try again, or head back and come to practice from there."
      retryLabel="Try again"
      /* "/" rather than a role dashboard: this boundary catches errors for
         guests too, and a link to /student that bounces them to sign-in
         would be a second failure on top of the first. */
      escape={{ href: "/", label: "Back to the home page" }}
    />
  );
}
