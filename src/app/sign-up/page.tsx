import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { SignupClosedCard } from "@/features/auth/components/SignupClosedCard";
import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";

export const metadata: Metadata = PUBLIC_SIGNUP_ENABLED
  ? {
      title: "Create a family account",
      description: "Create your parent account, confirm your email, then add each child with a sign-in of their own.",
    }
  : {
      title: "Sign-up closed",
      description: "MindMosaic accounts are created directly for families, not by public sign-up.",
      robots: { index: false, follow: false },
    };

export const dynamic = "force-dynamic";

/**
 * Create a family account — Claude Design auth artboards 05 / 09, one shell (the panel and the card share a
 * single flex row; the earlier page nested a second two-column grid inside the first, which squeezed both).
 * `PUBLIC_SIGNUP_ENABLED` stays the app-side mirror of Supabase Auth's own sign-up setting.
 */
export default function SignUpPage() {
  if (PUBLIC_SIGNUP_ENABLED) {
    return (
      <AuthShell
        panel={{
          heading: "Start with yourself.",
          intro: "Make your account, confirm your email, then add each child with a year level and a sign-in of their own.",
        }}
      >
        <SignUpForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      panel={{
        heading: "Accounts are set up for families directly.",
        intro: "Practice itself is open to anyone — no account, no sign-in, nothing stored.",
      }}
    >
      <SignupClosedCard />
    </AuthShell>
  );
}
