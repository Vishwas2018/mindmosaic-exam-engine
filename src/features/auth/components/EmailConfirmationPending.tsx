"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui";

import { useAuth } from "../AuthProvider";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Shown right after a parent signs up when Supabase requires email
 * confirmation (D1: only parent sign-up is self-service, so this is the only
 * account type that ever needs it — students are created pre-confirmed by
 * ../provision-child.ts). A client-side cooldown throttles the resend button
 * so a confused/impatient click doesn't hammer the real Supabase rate limit.
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
    <div className="w-full max-w-md text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-royal/10">
        <Mail aria-hidden="true" className="h-7 w-7 text-royal" />
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.03em] text-ink">Check your email</h1>
      <p className="mt-2 text-base text-muted">
        We sent a confirmation link to <span className="font-bold text-ink">{email}</span>. Click it to
        activate your account, then sign in.
      </p>

      {feedback && (
        <p
          role="status"
          className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
            feedback.tone === "error" ? "bg-error/10 text-error" : "bg-success/10 text-success"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={() => void handleResend()}
        disabled={sending || cooldown > 0}
        className="mt-6 w-full"
      >
        {sending && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
        {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation email"}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-block py-3 text-sm font-bold text-royal hover:underline"
      >
        ← Back to sign in
      </button>
    </div>
  );
}
