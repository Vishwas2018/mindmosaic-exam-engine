"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { safeNextPath } from "../safe-next";
import { readWorkStatus, type WorkStatus } from "../session-work-status";
import { mmAuthButton, mmFocus } from "./auth-fields";

/** "4:02 pm", in the viewer's own time zone. */
export function formatSavedTime(savedAt: string): string {
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(savedAt))
    .replace(/\s?([ap])m$/i, (_m, letter: string) => ` ${letter.toLowerCase()}m`);
}

/**
 * One sign-out, three different true statements about work in progress. Which
 * one is shown depends only on what the server last confirmed to this browser
 * (see ../session-work-status.ts). "Saved" is reserved for a confirmed save
 * with its time; "nothing in progress" only for a confirmed-empty status; an
 * unknown status is neither "saved" nor "lost".
 */
export function workStatusSentence(status: WorkStatus): string {
  switch (status.kind) {
    case "confirmed":
      return `Your paper was saved on our server at ${formatSavedTime(status.savedAt)}. Sign in and carry on from where you were.`;
    case "empty":
      return "Nothing was in progress. Sign in whenever you’re ready.";
    default:
      return "We can’t confirm the last few answers from here. Sign in to see exactly where your work is.";
  }
}

export function SessionExpiredScreen() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  /* Read after mount: localStorage does not exist on the server, and reading
     it during render would make the first client render differ from the HTML. */
  const [status, setStatus] = useState<WorkStatus | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(readWorkStatus());
  }, []);

  const signInHref = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <Clock aria-hidden="true" className="mx-auto h-10 w-10 text-mm-brand" />
        <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
          You were signed out
        </h1>
        <p role="status" className="mt-2 text-base leading-[1.6] text-mm-muted">
          {/* Nothing is claimed until the status has been read. */}
          {status ? workStatusSentence(status) : "Sign in to carry on."}
        </p>
        <Link href={signInHref} className={mmAuthButton({ className: "mt-6 w-full" })}>
          Sign in and continue
        </Link>
        <Link
          href="/sign-in"
          className={twMerge(
            "mt-4 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
            mmFocus,
          )}
        >
          Not you? Sign in as someone else
        </Link>
      </div>
    </main>
  );
}
