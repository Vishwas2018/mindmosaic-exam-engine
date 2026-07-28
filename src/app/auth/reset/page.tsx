"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailWarning } from "lucide-react";

import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth";
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
 * Landing page for the password-reset email link. Supabase establishes a
 * short-lived recovery session when the user arrives here, so we simply let
 * them set a new password via `updateUser`. An expired or already-used link
 * comes back as `error`/`error_code` query or hash params instead of a
 * session — that state gets its own screen rather than a confusing form.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, configured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

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
    }
  }

  if (linkError) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-[0_20px_60px_rgba(49,32,86,0.08)] sm:p-10">
          <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-warning" />
          <h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-ink">Link expired or invalid</h1>
          <p role="alert" className="mt-2 text-sm text-muted">
            {linkError}
          </p>
          <Link
            href="/sign-in?mode=forgot"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-royal-orange px-6 py-3.5 text-base font-bold text-ink shadow-[0_10px_24px_rgba(255,138,0,0.2)] hover:brightness-95"
          >
            Request a new reset link
          </Link>
          <Link href="/sign-in" className="mt-5 inline-block py-3 text-sm font-bold text-royal hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-[0_20px_60px_rgba(49,32,86,0.08)] sm:p-10">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-ink">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">Enter a new password for your account below.</p>

        {!configured && (
          <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
            Accounts aren&apos;t connected on this device yet.
          </p>
        )}

        {message && (
          <p
            role="status"
            className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
              message.tone === "error" ? "bg-error/10 text-error" : "bg-success/10 text-success"
            }`}
          >
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-ink">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              className="min-h-12 w-full rounded-xl border border-royal/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-royal focus:ring-4 focus:ring-royal/15"
            />
            {password.length > 0 && <PasswordStrength password={password} />}
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-ink">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              className="min-h-12 w-full rounded-xl border border-royal/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-royal focus:ring-4 focus:ring-royal/15"
            />
            {confirm.length > 0 && (
              <p className={`mt-2 text-sm font-semibold ${confirm === password ? "text-success" : "text-error"}`}>
                {confirm === password ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
          <Button type="submit" variant="orange" size="lg" disabled={!ready || submitting} className="w-full">
            {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </main>
  );
}
