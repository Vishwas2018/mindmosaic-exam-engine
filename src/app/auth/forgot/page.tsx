"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { AuthShell } from "@/features/auth/components/AuthMosaicPanel";
import {
  MmErrorPanel,
  MmField,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "@/features/auth/components/auth-fields";
import {
  FORGOT_COOLDOWN_SECONDS,
  FORGOT_FALLBACK_ERROR,
  FORGOT_NETWORK_ERROR,
  FORGOT_SUCCESS_NOTICE,
  validateForgotEmail,
} from "@/features/auth/forgot-password";

/**
 * First half of Account Recovery: enter an email and request a reset link.
 * Supabase then sends the reset email; the link lands on /auth/reset (the
 * second half, which sets a new password). Shares validation, anti-enumeration
 * copy and the 30-second resend cooldown with `/sign-in?mode=forgot` (DEF-AUTH-006).
 */
export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const shake = useShakeOnInvalidSubmit();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function submitReset(targetEmail: string, isResend: boolean) {
    if (submitting || cooldown > 0) return;
    setSubmitting(true);
    setError(null);
    if (isResend) setResendNotice(null);

    let result: Awaited<ReturnType<typeof sendPasswordReset>>;
    try {
      result = await sendPasswordReset(targetEmail);
    } catch {
      result = { ok: false, failure: "network", message: FORGOT_NETWORK_ERROR };
    }
    setSubmitting(false);

    if (result.ok) {
      setSent(true);
      setCooldown(FORGOT_COOLDOWN_SECONDS);
      if (isResend) {
        setResendNotice("If that email has an account, we sent a fresh reset link.");
      }
    } else {
      // Never reveal whether the email exists — GoTrue's own message handles it.
      setError(result.message ?? FORGOT_FALLBACK_ERROR);
      if (result.failure === "rate_limited") {
        setCooldown(FORGOT_COOLDOWN_SECONDS);
      }
      shake.trigger();
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateForgotEmail(email);
    if (validationError) {
      setError(validationError);
      shake.trigger();
      return;
    }
    await submitReset(email.trim(), false);
  }

  if (sent) {
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
          <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-brand" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Check your email
          </h1>
          <p role="status" className="mt-2 text-sm leading-[1.6] text-mm-muted">
            {FORGOT_SUCCESS_NOTICE}
          </p>

          {resendNotice && (
            <p
              role="status"
              className="mm-rise-fast mt-4 rounded-xl border border-mm-tint-line bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-ink-soft"
            >
              {resendNotice}
            </p>
          )}

          {error && (
            <div className="mt-4 text-left">
              <MmErrorPanel id="auth-error" focusOnMount>
                {error}
              </MmErrorPanel>
            </div>
          )}

          <button
            type="button"
            disabled={submitting || cooldown > 0}
            onClick={() => void submitReset(email.trim(), true)}
            className={mmAuthButton({
              variant: "outline",
              disabled: submitting || cooldown > 0,
              className: "mt-6 w-full",
            })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend reset link"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setError(null);
              setResendNotice(null);
            }}
            className={twMerge(
              "mt-3 inline-flex min-h-11 items-center rounded text-sm font-semibold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            Use a different email
          </button>

          <div>
            <Link
              href="/sign-in"
              className={twMerge(
                "mt-2 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
                mmFocus,
              )}
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthShell
      panel={{
        heading: "A reset link is on its way.",
        intro:
          "Enter the email address on your account and we’ll send a reset link. If that email has an account, the link expires in one hour.",
      }}
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Enter the email address on your account and we&rsquo;ll send a reset link. Student PINs
          are reset by a parent from the parent view, not from here.
        </p>

        <form
          key={shake.key}
          onSubmit={handleSubmit}
          noValidate
          className={twMerge("mt-6 grid gap-4", shake.className)}
        >
          <MmField
            id="forgot-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
              setError(null);
            }}
            invalid={error !== null}
            errorId="auth-error"
          />

          {error && (
            <MmErrorPanel id="auth-error" focusOnMount>
              {error}
            </MmErrorPanel>
          )}

          <button
            type="submit"
            disabled={submitting || cooldown > 0}
            className={mmAuthButton({ disabled: submitting || cooldown > 0, className: "w-full" })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            {submitting
              ? "Sending…"
              : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-[13px] leading-[1.6] text-mm-muted">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className={twMerge("rounded font-bold text-mm-brand hover:underline", mmFocus)}
          >
            Sign in instead
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
