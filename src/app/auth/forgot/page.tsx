"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import { AuthMosaicPanel } from "@/features/auth/components/AuthMosaicPanel";
import { MmErrorPanel, MmField, mmAuthButton, mmFocus } from "@/features/auth/components/auth-fields";

/** First half of Account Recovery: enter an email and request a reset link.
 * Supabase then sends the reset email; the link lands on /auth/reset (the
 * second half, which sets a new password). This screen never reveals whether
 * the email has an account — GoTrue's own message handles that. */
export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await sendPasswordReset(email.trim());
    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      // Never reveal whether the email exists — GoTrue's own message handles it.
      setError(result.message ?? "Could not send a reset link. Try again.");
    }
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
          <p className="mt-2 text-sm leading-[1.6] text-mm-muted">
            If that email has an account, a reset link is on its way. It expires in one hour.
          </p>
          <Link
            href="/sign-in"
            className={twMerge(
              "mt-6 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            ← Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AuthMosaicPanel
        eyebrow="Forgot password"
        heading="A reset link is on its way."
        intro="Enter the email address on your account and we&rsquo;ll send a reset link. If that email has an account, the link expires in one hour."
        footnote="Independent learning platform. Assessment-style practice contains original questions and is not official examination material."
      />
      <main
        id="main-content"
        className="grid content-center justify-items-center px-[clamp(20px,4vw,64px)] py-[clamp(28px,3vw,56px)]"
      >
        <div className="mb-8 w-full max-w-[440px] lg:hidden">
          <Link href="/" aria-label="MindMosaic home" className="inline-flex min-h-11 items-center">
            <span className="sr-only">MindMosaic home</span>
          </Link>
        </div>
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10 lg:p-12">
          <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
            Enter the email address on your account and we&rsquo;ll send a reset link.
          </p>

          {error && (
            <MmErrorPanel>{error}</MmErrorPanel>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <MmField
              id="forgot-email"
              label="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className={mmAuthButton({ disabled: submitting || !email.trim(), className: "w-full" })}
            >
              {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
              {submitting ? "Sending…" : "Send reset link"}
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
      </main>
    </div>
  );
}
