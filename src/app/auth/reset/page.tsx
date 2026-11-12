"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import {
  MmErrorPanel,
  MmField,
  MmRevealButton,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "@/features/auth/components/auth-fields";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { evaluatePassword } from "@/features/auth/password";

/**
 * Why the link cannot be used. The provider reports an expired link by code
 * (`otp_expired`); a link that was already spent, or that was opened without
 * ever carrying a recovery session, arrives as anything else. Those two are
 * told apart because they call for different next steps, but the provider's
 * own wording is never shown.
 */
type LinkProblem = "expired" | "used";

function readLinkProblem(): LinkProblem | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const errorCode = url.searchParams.get("error_code") ?? hashParams.get("error_code");
  if (!errorCode) return null;
  return errorCode === "otp_expired" ? "expired" : "used";
}

const LINK_COPY: Record<LinkProblem, { title: string; body: string }> = {
  expired: {
    title: "This reset link has expired",
    body: "This password reset link has expired. Ask for a new one and we’ll send it.",
  },
  used: {
    title: "This link can’t be used",
    body: "This link has already been used or isn’t valid. If that was you, your password is already changed — just sign in. If it wasn’t, ask for a new link straight away.",
  },
};

/**
 * Landing page for the password-reset email link (the second half of
 * Account Recovery — the first half is SignInPanel's "forgot" screen).
 * Supabase establishes a short-lived recovery session when the user
 * arrives here, so we simply let them set a new password via
 * `updateUser`. A dead link comes back as `error`/`error_code` query or hash
 * params instead of a session — that state gets its own screen rather than
 * a confusing form.
 *
 * Honesty rules: "changed" is shown only once the server accepted the
 * change, and "we signed out your other devices" only when the server
 * confirmed that too.
 */
export default function ResetPasswordPage() {
  const { updatePassword, signOut, configured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkProblem, setLinkProblem] = useState<LinkProblem | null>(null);
  const [saved, setSaved] = useState<{ otherDevicesSignedOut: boolean } | null>(null);
  const shake = useShakeOnInvalidSubmit();

  useEffect(() => {
    /* Deliberately deferred to an effect rather than a lazy useState
       initializer: reading window.location during render would make the
       client's first hydration pass diverge from the server-rendered HTML
       (which always shows the form, having no access to the URL's hash/query
       error params at request time) — a hydration mismatch, not just an
       unnecessary render. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLinkProblem(readLinkProblem());
  }, []);

  const rules = evaluatePassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const ready = rules.allMet && confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    let result: Awaited<ReturnType<typeof updatePassword>>;
    try {
      result = await updatePassword(password);
    } catch {
      result = { ok: false, failure: "network", message: "We couldn’t reach MindMosaic. Check your connection and try again." };
    }
    setSubmitting(false);
    if (result.ok) {
      /* The recovery session on this device is spent: end it too, so the next
         step really is "sign in with the new password". */
      await signOut();
      setSaved({ otherDevicesSignedOut: result.otherDevicesSignedOut === true });
    } else if (result.message && /session/i.test(result.message)) {
      // No recovery session (the link was already used, or opened cold
      // without following it from the email) — same dead end as a spent link.
      setLinkProblem("used");
    } else {
      setError(
        result.failure === "network"
          ? (result.message ?? "We couldn’t reach MindMosaic. Check your connection and try again.")
          : (result.message ?? "We couldn’t change your password just now. Please try again."),
      );
      shake.trigger();
    }
  }

  if (saved) {
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#0B6B63]" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Password changed
          </h1>
          <p role="status" className="mt-2 text-sm leading-[1.6] text-mm-muted">
            You can sign in with it now.
            {saved.otherDevicesSignedOut &&
              " We signed out your other devices, so they will ask for the new one."}
          </p>
          <Link href="/sign-in" className={mmAuthButton({ className: "mt-6 w-full" })}>
            Go to sign-in
          </Link>
        </div>
      </main>
    );
  }

  if (linkProblem) {
    const copy = LINK_COPY[linkProblem];
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-coral-deep" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">{copy.title}</h1>
          <p role="alert" className="mt-2 text-sm leading-[1.5] text-mm-muted">
            {copy.body}
          </p>
          <Link
            href="/sign-in?mode=forgot"
            className={mmAuthButton({ className: "mt-6 w-full" })}
          >
            {linkProblem === "expired" ? "Start again" : "Reset again"}
          </Link>
          <Link
            href="/sign-in"
            className={twMerge(
              "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
              mmFocus,
            )}
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">Set a new password</h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Choose a password you have not used here before.
        </p>

        {!configured && (
          <p
            role="status"
            className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-ink-soft"
          >
            Accounts aren&apos;t connected on this device yet.
          </p>
        )}

        {error && (
          <div className="mt-5">
            <MmErrorPanel id="reset-error">{error}</MmErrorPanel>
          </div>
        )}

        <form
          key={shake.key}
          onSubmit={handleSubmit}
          className={twMerge("mt-6 grid gap-4", shake.className)}
        >
          <div>
            <MmField
              id="new-password"
              label="New password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              invalid={error !== null}
              errorId="reset-error"
              trailingRoom
              trailing={
                <MmRevealButton
                  controls="new-password"
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />
            {password.length > 0 && <PasswordStrength password={password} />}
          </div>
          <div>
            <MmField
              id="confirm-password"
              label="Confirm new password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              invalid={mismatch}
              errorId="confirm-mismatch"
              trailingRoom
              trailing={
                <MmRevealButton
                  controls="confirm-password"
                  visible={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              }
            />
            {confirm.length > 0 && (
              <p
                id="confirm-mismatch"
                role={mismatch ? "alert" : "status"}
                className={twMerge(
                  "mt-2 text-sm font-semibold",
                  mismatch ? "text-mm-coral-deep" : "text-mm-brand",
                )}
              >
                {mismatch ? "The two passwords don’t match yet." : "Passwords match"}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!ready || submitting}
            className={mmAuthButton({ disabled: !ready || submitting, className: "w-full" })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            Save new password
          </button>
          <p className="text-[13px] leading-[1.5] text-mm-muted">
            Saving this signs you out on your other devices, so you sign in fresh with the new
            password.
          </p>
        </form>
      </div>
    </main>
  );
}
