"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { useAuth } from "../AuthProvider";
import { evaluatePassword } from "../password";
import { PasswordStrength } from "./PasswordStrength";
import { SocialButtons } from "./SocialButtons";

type Mode = "signin" | "signup" | "forgot";

interface Feedback {
  readonly tone: "error" | "success";
  readonly text: string;
}

const inputShell =
  "min-h-12 w-full rounded-xl border border-royal/15 bg-white px-4 py-3 text-base text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] outline-none transition placeholder:text-muted/70 hover:border-royal/30 focus:border-royal focus:ring-4 focus:ring-royal/15";

/** Password field with a show/hide toggle, styled to match the shared Input. */
function PasswordField({
  id,
  label,
  value,
  autoComplete,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          className={`${inputShell} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition hover:text-royal"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

export function AuthCard({ initialMode = "signin" }: { initialMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const auth = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const passwordOk = useMemo(() => evaluatePassword(password).allMet, [password]);
  const confirmMatches = confirm.length > 0 && confirm === password;

  const switchMode = (next: Mode) => {
    setMode(next);
    setFeedback(null);
    setPassword("");
    setConfirm("");
  };

  const heading =
    mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const subheading =
    mode === "signin"
      ? "Sign in to continue your learning journey."
      : mode === "signup"
        ? "Start practising in minutes — it's free to try."
        : "We'll email you a secure link to set a new password.";

  const canSubmit =
    mode === "signin"
      ? email.length > 0 && password.length > 0
      : mode === "signup"
        ? name.trim().length > 0 && email.length > 0 && passwordOk && confirmMatches
        : email.length > 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    if (mode === "signin") {
      const result = await auth.signInWithPassword(email, password);
      if (result.ok) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      setFeedback({ tone: "error", text: result.message ?? "Could not sign in." });
    } else if (mode === "signup") {
      const result = await auth.signUp({ email, password, displayName: name.trim() });
      if (result.ok && !result.needsEmailConfirmation) {
        router.push(nextPath);
        router.refresh();
        return;
      }
      if (result.ok) {
        setFeedback({ tone: "success", text: result.message ?? "Check your email to confirm." });
        setMode("signin");
      } else {
        setFeedback({ tone: "error", text: result.message ?? "Could not create your account." });
      }
    } else {
      const result = await auth.sendPasswordReset(email);
      setFeedback({
        tone: result.ok ? "success" : "error",
        text: result.message ?? (result.ok ? "Reset link sent." : "Could not send reset link."),
      });
    }

    setSubmitting(false);
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-black tracking-[-0.03em] text-ink">{heading}</h1>
      <p className="mt-2 text-base text-muted">{subheading}</p>

      {!auth.configured && (
        <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          Accounts aren&apos;t connected on this device yet. You can still practise as a guest —
          add Supabase keys to <code className="font-mono">.env.local</code> to enable sign-in.
        </p>
      )}

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

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <Input
            id="su-name"
            label="Display name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        )}

        <Input
          id="auth-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        {mode !== "forgot" && (
          <div>
            <PasswordField
              id="auth-password"
              label="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={setPassword}
            />
            {mode === "signup" && password.length > 0 && <PasswordStrength password={password} />}
            {mode === "signin" && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm font-bold text-royal hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "signup" && (
          <div>
            <PasswordField
              id="auth-confirm"
              label="Confirm password"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
            />
            {confirm.length > 0 && (
              <p
                className={`mt-2 text-sm font-semibold ${
                  confirmMatches ? "text-success" : "text-error"
                }`}
              >
                {confirmMatches ? "Passwords match" : "Passwords do not match"}
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="orange" size="lg" disabled={!canSubmit || submitting} className="mt-1 w-full">
          {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-royal/10" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Or continue with</span>
            <span className="h-px flex-1 bg-royal/10" />
          </div>
          <SocialButtons nextPath={nextPath} />
        </>
      )}

      <p className="mt-7 text-center text-sm font-semibold text-muted">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="font-bold text-royal hover:underline">
              Create an account
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => switchMode("signin")} className="font-bold text-royal hover:underline">
              Sign in
            </button>
          </>
        ) : (
          <button type="button" onClick={() => switchMode("signin")} className="font-bold text-royal hover:underline">
            ← Back to sign in
          </button>
        )}
      </p>
    </div>
  );
}
