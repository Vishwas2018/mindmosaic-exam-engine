import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

export const metadata: Metadata = {
  title: "Student sign in",
  description: "Sign in with the login code and PIN your parent gave you.",
};

export const dynamic = "force-dynamic";

/**
 * The URL on the card a child is handed. Same component as /sign-in, opened on the Student form, so the two can
 * never drift apart (Claude Design artboards 15–17).
 */
export default function StudentSignInPage() {
  return (
    <AuthShell
      panel={{
        heading: "Ready to practise?",
        intro: "Sign in with your code and PIN. Practice never counts a wrong answer against you — it is just for getting better.",
      }}
    >
      <Suspense fallback={<div aria-hidden="true" className="h-[520px] w-full animate-pulse rounded-3xl bg-white/70" />}>
        <SignInPanel defaultKind="student" defaultEntry="signin" />
      </Suspense>
    </AuthShell>
  );
}
