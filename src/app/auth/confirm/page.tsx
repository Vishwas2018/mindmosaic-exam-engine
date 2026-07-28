"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { EmailVerificationScreen } from "@/features/auth/components/EmailVerificationScreen";

export default function EmailConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-page">
          <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-royal" />
        </main>
      }
    >
      <EmailVerificationScreen />
    </Suspense>
  );
}
