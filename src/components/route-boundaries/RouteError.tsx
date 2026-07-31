"use client";

import { useEffect } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { WidgetError, buttonClasses } from "@/components/ui";

export interface RouteErrorProps {
  /** The error Next.js caught. `digest` is the only part safe to show. */
  error: Error & { digest?: string };
  /** Next's own retry — re-renders the segment without a full reload. */
  reset: () => void;
  /** Where this boundary sits, for the server log. */
  segment: string;
  title?: string;
  description?: string;
  retryLabel?: string;
  /** A real way out when retrying doesn't help. */
  escape?: { href: string; label: string };
}

/**
 * The shared body of every route-level error boundary.
 *
 * Before this existed there were no error boundaries anywhere in src/app, so
 * any throw — including mid-exam — fell through to Next.js's own error page:
 * unbranded, unexplained, and offering a child nothing but a stack trace.
 *
 * Three things every boundary needs, and none of which the default gives:
 *  - it says what happened in words the person reading it can act on;
 *  - `reset()` is wired to a real button, so the common case (a transient
 *    fetch failure) costs one click rather than a lost session;
 *  - there is always a way out that isn't the back button.
 *
 * The error is logged to the console with its digest, deliberately. An
 * opaque failure with nothing behind it is exactly what made the billing
 * card undiagnosable — the message stays off the screen, but it must not
 * vanish.
 */
export function RouteError({
  error,
  reset,
  segment,
  title = "Something went wrong",
  description = "This page didn't load. It's usually temporary — trying again is the fastest fix.",
  retryLabel = "Try again",
  escape,
}: RouteErrorProps) {
  useEffect(() => {
    console.error(`[route-error] ${segment}`, { digest: error.digest, message: error.message });
  }, [error, segment]);

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-page px-4 py-16"
    >
      <Link href="/" aria-label="MindMosaic home">
        <MindMosaicLogo />
      </Link>

      <div className="w-full max-w-lg">
        <WidgetError
          title={title}
          description={description}
          onRetry={reset}
          retryLabel={retryLabel}
        />

        {escape && (
          <div className="mt-6 flex justify-center">
            <Link href={escape.href} className={buttonClasses({ variant: "secondary" })}>
              {escape.label}
            </Link>
          </div>
        )}

        {/*
          The digest is the only part of a production error that is safe to
          show and the only part that makes a support conversation possible —
          it is what correlates this screen with the server log above.
        */}
        {error.digest && (
          <p className="mt-6 text-center text-xs font-semibold text-muted">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
