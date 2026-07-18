"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { evaluatePassword } from "@/features/auth/password";

/**
 * Landing page for the password-reset email link. Supabase establishes a
 * short-lived recovery session when the user arrives here, so we simply let
 * them set a new password via `updateUser`.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, configured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

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
    } else {
      setMessage({ tone: "error", text: result.message ?? "Could not update your password." });
    }
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
