"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "../AuthProvider";
import { mmAuthButton, mmFocus } from "./auth-fields";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Shown right after a parent signs up when Supabase requires email
 * confirmation (D1: only parent sign-up is self-service, so this is the only
 * account type that ever needs it — students are created pre-confirmed by
 * ../provision-child.ts). A client-side cooldown throttles the resend button
 * so a confused/impatient click doesn't hammer the real Supabase rate limit.
 *
 * Restyled onto the mm-* auth system (was the product's generic
 * `@/components/ui` kit) to match the card it renders inside —
 * SignUpWizard's terminal "confirm your email" state.
 */
export function EmailConfirmationPending({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const { resendConfirmationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    if (sending || cooldown > 0) return;
    setSending(true);
    setFeedback(null);
    const result = await resendConfirmationEmail(email);
    setFeedback({
      tone: result.ok ? "success" : "error",
      text: result.message ?? (result.ok ? "Confirmation email resent." : "Could not resend the email."),
    });
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setSending(false);
  }

  return (
    <div className="mm-rise w-full max-w-md text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mm-tint">
        <Mail aria-hidden="true" className="h-7 w-7 text-mm-brand" />
      </span>
      <h1 className="mt-5 text-3xl font-[700] tracking-[-0.03em] text-mm-ink">Check your email</h1>
      <p className="mt-2 text-base leading-[1.6] text-mm-muted">
        We sent a confirmation link to <span className="font-bold text-mm-ink">{email}</span>.
        Click it to activate your account, then sign in.
      </p>

      {feedback && (
        <p
          role="status"
          className={twMerge(
            "mm-rise-fast mt-5 rounded-xl px-4 py-3 text-sm font-semibold",
            feedback.tone === "error"
              ? "border border-mm-alert-line bg-mm-alert text-mm-coral-deep"
              : "bg-mm-tint text-mm-brand",
          )}
        >
          {feedback.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={sending || cooldown > 0}
        className={mmAuthButton({
          variant: "outline",
          disabled: sending || cooldown > 0,
          className: "mt-6 w-full",
        })}
      >
        {sending && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
        {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation email"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className={twMerge(
          "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
          mmFocus,
        )}
      >
        ← Back to sign in
      </button>
    </div>
  );
}
