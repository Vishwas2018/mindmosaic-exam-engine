import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to MindMosaic — parent accounts and student profiles both sign in here.",
};

export const dynamic = "force-dynamic";

/**
 * The one sign-in journey (Claude Design auth artboards 01–08, 15–17).
 *
 * `/sign-in` with no role opens "Who is signing in?". Choosing a card opens that role's form in the same card; the
 * Parent / Student control inside the form switches role without leaving the page, and the role is kept in the URL
 * (`?role=parent|student`) so a refresh or a return from another page lands on the same form. `/student-sign-in`
 * (the URL on a child's printed card) is the same component opened on Student; `/welcome` redirects here.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; entry?: string; role?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const hasRole = params.role === "parent" || params.role === "student";
  const defaultEntry =
    params.mode === "forgot"
      ? "forgot"
      : hasRole || params.entry === "signin" || params.mode === "signin"
        ? "signin"
        : "choose";
  const chooser = defaultEntry === "choose";

  return (
    <AuthShell
      wide={chooser}
      panel={
        chooser
          ? {
              heading: "One place for the whole family.",
              intro: "Parents see honest progress; children get practice that never counts a wrong answer against them.",
            }
          : {
              heading: "Welcome back.",
              intro: "Pick up where your family left off — progress, results and your plan are all here.",
            }
      }
    >
      <Suspense fallback={<div aria-hidden="true" className="h-[560px] w-full animate-pulse rounded-3xl bg-white/70" />}>
        <SignInPanel defaultEntry={defaultEntry} />
      </Suspense>
    </AuthShell>
  );
}
