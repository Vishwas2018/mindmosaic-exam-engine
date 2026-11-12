"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function PracticeStudioError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-lg rounded-2xl border border-mm-line bg-white p-8 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mm-tint text-primary">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
        We couldn&rsquo;t load Practice Studio
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mm-muted">
        There was an unexpected problem loading practice availability. Please try again.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center gap-2 rounded-btn bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/student"
          className="inline-flex min-h-11 items-center rounded-btn border border-mm-line bg-white px-5 text-sm font-semibold text-mm-ink transition-colors hover:bg-mm-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Return to My Space
        </Link>
      </div>
    </div>
  );
}
