"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/features/auth";
import {
  MmErrorPanel,
  MmField,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "@/features/auth/components/auth-fields";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { evaluatePassword } from "@/features/auth/password";

function readLinkError(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const errorCode = url.searchParams.get("error_code") ?? hashParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description") ?? hashParams.get("error_description");
  if (!errorCode) return null;
  return errorCode === "otp_expired"
    ? "This password reset link has expired."
    : (errorDescription?.replace(/\+/g, " ") ?? "This password reset link is invalid.");
}

/**
 * Landing page for the password-reset email link (the second half of
 * Account Recovery — the first half is SignInPanel's "forgot" screen).
 * Supabase establishes a short-lived recovery session when the user
 * arrives here, so we simply let them set a new password via
 * `updateUser`. An expired or already-used link comes back as
 * `error`/`error_code` query or hash params instead of a session — that
 * state gets its own screen rather than a confusing form.
 *
 * Restyled onto the mm-* auth system (was the product's generic
 * `@/components/ui` kit) to match /sign-in and /sign-up.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, configured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const shake = useShakeOnInvalidSubmit();

  useEffect(() => {
    /* Deliberately deferred to an effect rather than a lazy useState
       initializer: reading window.location during render would make the
       client's first hydration pass diverge from the server-rendered HTML
       (which always shows the form, having no access to the URL's hash/query
       error params at request time) — a hydration mismatch, not just an
       unnecessary render. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLinkError(readLinkError());
  }, []);

  const ready = evaluatePassword(password).allMet && confirm === password;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setMessage(null);
    const result = await updatePassword(password);
    setSubmitting(false);
    if (result.ok) {
      setMessage({ tone: "success", text: "Password updated — taking you to sign in…" });
      setTimeout(() => router.push("/sign-in"), 1500);
    } else if (result.message && /session/i.test(result.message)) {
      // No recovery session (e.g. the link was already used, or opened cold
      // without following it from the email) — same dead-end as an expired link.
      setLinkError("This password reset link has expired or has already been used.");
    } else {
      setMessage({ tone: "error", text: result.message ?? "Could not update your password." });
      shake.trigger();
    }
  }

  if (linkError) {
    return (
      <main
        id="main-content"
        className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
      >
        <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
          <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-coral-deep" />
          <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
            Link expired or invalid
          </h1>
          <p role="alert" className="mt-2 text-sm leading-[1.5] text-mm-muted">
            {linkError}
          </p>
          <Link
            href="/sign-in?mode=forgot"
            className={mmAuthButton({ className: "mt-6 w-full" })}
          >
            Request a new reset link
          </Link>
          <Link
            href="/sign-in"
            className={twMerge(
              "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
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
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        <h1 className="text-2xl font-[700] tracking-[-0.03em] text-mm-ink">Choose a new password</h1>
        <p className="mt-2 text-sm leading-[1.5] text-mm-muted">
          Enter a new password for your account below.
        </p>

        {!configured && (
          <p
            role="status"
            className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-ink-soft"
          >
            Accounts aren&apos;t connected on this device yet.
          </p>
        )}

        {message &&
          (message.tone === "error" ? (
            <div className="mt-5">
              <MmErrorPanel>{message.text}</MmErrorPanel>
            </div>
          ) : (
            <p
              role="status"
              className="mm-rise-fast mt-5 rounded-xl bg-mm-tint px-4 py-3 text-sm font-semibold text-mm-brand"
            >
              {message.text}
            </p>
          ))}

        <form
          key={shake.key}
          onSubmit={handleSubmit}
          className={twMerge("mt-6 grid gap-4", shake.className)}
        >
          <div>
            <MmField
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            {password.length > 0 && <PasswordStrength password={password} />}
          </div>
          <div>
            <MmField
              id="confirm-password"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              invalid={confirm.length > 0 && confirm !== password}
            />
            {confirm.length > 0 && (
              <p
                className={twMerge(
                  "mt-2 text-sm font-semibold",
                  confirm === password ? "text-mm-brand" : "text-mm-coral-deep",
                )}
              >
                {confirm === password ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!ready || submitting}
            className={mmAuthButton({ disabled: !ready || submitting, className: "w-full" })}
          >
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
