"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { useAuth } from "../AuthProvider";
import { roleHomePath } from "../roles";

type Stage = "verifying" | "success" | "error";

/*
 * Read once at mount, via a lazy useState initializer rather than an effect:
 * next/navigation's useSearchParams() (unlike raw window.location) is
 * already consistent between the server and client render, so computing the
 * link's initial stage here carries no hydration-mismatch risk — only the
 * *async* confirmEmail() call genuinely needs to live in an effect.
 */
function computeInitialStage(
  searchParams: URLSearchParams,
  configured: boolean,
): { stage: Stage; message: string | null } {
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (errorCode || !code) {
    return {
      stage: "error",
      message:
        errorCode === "otp_expired"
          ? "This verification link has expired."
          : (errorDescription?.replace(/\+/g, " ") ??
              "This verification link is invalid or has already been used."),
    };
  }
  if (!configured) {
    return { stage: "error", message: "Accounts aren't connected on this device yet." };
  }
  return { stage: "verifying", message: null };
}

/**
 * Screen 6: lands from the confirmation-email link (see AuthProvider.signUp's
 * emailRedirectTo and /auth/confirm). Exchanges the `code` for a session,
 * then redirects to the confirmed user's role home — matching the same
 * role-based routing AuthCard uses after sign-in. An expired/invalid link
 * (Supabase reports this via `error_code`/`error_description` query params
 * rather than a `code`) shows a resend form instead of spinning forever.
 */
export function EmailVerificationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmEmail, resendConfirmationEmail, configured } = useAuth();

  const [initial] = useState(() => computeInitialStage(searchParams, configured));
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [message, setMessage] = useState<string | null>(initial.message);
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initial.stage !== "verifying") return;
    // Guaranteed present: computeInitialStage only returns "verifying" when a `code` param exists.
    const code = searchParams.get("code")!;

    let active = true;
    confirmEmail(code).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStage("error");
        setMessage(result.message ?? "Could not verify your email.");
        return;
      }
      setStage("success");
      const destination = roleHomePath(result.role);
      setTimeout(() => {
        if (!active) return;
        router.push(destination);
        router.refresh();
      }, 1200);
    });
    return () => {
      active = false;
    };
    // Runs once against the link's query params — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    if (resending || email.trim().length === 0) return;
    setResending(true);
    setResendFeedback(null);
    const result = await resendConfirmationEmail(email.trim());
    setResendFeedback(
      result.message ?? (result.ok ? "Confirmation email resent." : "Could not resend the email."),
    );
    setResending(false);
  }

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-page px-4 py-10"
    >
      <div className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-[0_20px_60px_rgba(49,32,86,0.08)] sm:p-10">
        {stage === "verifying" && (
          <>
            <Loader2 aria-hidden="true" className="mx-auto h-10 w-10 animate-spin text-royal" />
            <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-muted">This only takes a moment.</p>
          </>
        )}

        {stage === "success" && (
          <>
            <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-success" />
            <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink">Email confirmed!</h1>
            <p role="status" className="mt-2 text-sm text-muted">
              Taking you to your dashboard…
            </p>
          </>
        )}

        {stage === "error" && (
          <>
            <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-warning" />
            <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink">
              Link expired or invalid
            </h1>
            <p role="alert" className="mt-2 text-sm text-muted">
              {message}
            </p>

            <form onSubmit={handleResend} className="mt-6 flex flex-col gap-3 text-left">
              <Input
                id="verify-resend-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <Button type="submit" variant="primary" size="lg" disabled={resending || email.trim().length === 0}>
                {resending && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
                Resend verification email
              </Button>
            </form>

            {resendFeedback && (
              <p role="status" className="mt-4 rounded-xl bg-royal/10 px-4 py-3 text-sm font-semibold text-royal">
                {resendFeedback}
              </p>
            )}

            <Link
              href="/sign-in"
              className="mt-5 inline-block py-3 text-sm font-bold text-royal hover:underline"
            >
              ← Back to sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
