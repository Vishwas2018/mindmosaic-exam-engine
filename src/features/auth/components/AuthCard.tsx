"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { useAuth } from "../AuthProvider";
import { evaluatePassword } from "../password";
import { roleHomePath } from "../roles";
import { EmailConfirmationPending } from "./EmailConfirmationPending";
import { PasswordStrength } from "./PasswordStrength";
import { SocialButtons } from "./SocialButtons";

type Mode = "signin" | "signup" | "forgot";

/** Extra states layered on top of `Mode`, rendered instead of the form. */
type Screen = Mode | "signup-sent";

interface Feedback {
  readonly tone: "error" | "success";
  readonly text: string;
  /** Inline action offered alongside the message (e.g. "Resend confirmation email"). */
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

const FORGOT_COOLDOWN_SECONDS = 30;
/** Soft, client-side-only guard — real lockout enforcement lives server-side in Supabase/GoTrue. */
const LOCKOUT_AFTER_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

function isUnverifiedEmailError(message: string | undefined): boolean {
  return !!message && /email.*not.*confirm|confirm.*your.*email/i.test(message);
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message));
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
  /* An explicit ?next= wins; otherwise the destination is the signed-in
     role's home (student/parent/teacher/admin placeholder routes). */
  const explicitNext = searchParams.get("next");
  const nextPath = explicitNext ?? "/";
  /* A link (e.g. an expired-reset redirect) can ask for a specific starting
     mode via ?mode=forgot|signup — otherwise the route's own default wins. */
  const [screen, setScreen] = useState<Screen>(() => {
    const requested = searchParams.get("mode");
    return requested === "signup" || requested === "forgot" ? requested : initialMode;
  });
  const mode = screen === "signup-sent" ? "signup" : screen;

  const auth = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Soft client-side lockout after repeated failed sign-ins.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Client-side throttle on repeated "send reset link" submits.
  const [forgotCooldown, setForgotCooldown] = useState(0);

  useEffect(() => {
    if (lockedUntil === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const id = setInterval(() => setForgotCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(id);
  }, [forgotCooldown]);

  const isLocked = lockedUntil !== null && now < lockedUntil;
  const lockSecondsRemaining =
    lockedUntil !== null && isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  const passwordOk = useMemo(() => evaluatePassword(password).allMet, [password]);
  const confirmMatches = confirm.length > 0 && confirm === password;

  const switchMode = (next: Mode) => {
    setScreen(next);
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
        ? "Create a parent account to set up practice for your child — it's free to try."
        : "We'll email you a secure link to set a new password.";

  const canSubmit =
    mode === "signin"
      ? email.length > 0 && password.length > 0 && !isLocked
      : mode === "signup"
        ? name.trim().length > 0 && email.length > 0 && passwordOk && confirmMatches
        : email.length > 0 && forgotCooldown === 0;

  async function handleResendFromLogin(target: string) {
    const result = await auth.resendConfirmationEmail(target);
    setFeedback({
      tone: result.ok ? "success" : "error",
      text: result.message ?? (result.ok ? "Confirmation email resent." : "Could not resend the email."),
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFeedback(null);

    /* Explicit ?next= wins; otherwise land on the signed-in role's home. */
    const destination = async () =>
      explicitNext ?? roleHomePath(await auth.fetchRole());

    try {
      if (mode === "signin") {
        const result = await auth.signInWithPassword(email, password);
        if (result.ok) {
          setFailedAttempts(0);
          router.push(await destination());
          router.refresh();
          return;
        }
        if (isUnverifiedEmailError(result.message)) {
          setFeedback({
            tone: "error",
            text: "Confirm your email before signing in — check your inbox for the link we sent.",
            action: { label: "Resend confirmation email", onClick: () => void handleResendFromLogin(email) },
          });
        } else {
          setFeedback({ tone: "error", text: result.message ?? "Could not sign in." });
        }
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= LOCKOUT_AFTER_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        }
      } else if (mode === "signup") {
        const result = await auth.signUp({
          email,
          password,
          displayName: name.trim(),
          role: "parent",
        });
        if (result.ok && !result.needsEmailConfirmation) {
          router.push(await destination());
          router.refresh();
          return;
        }
        if (result.ok) {
          setSentEmail(email);
          setScreen("signup-sent");
        } else {
          setFeedback({ tone: "error", text: result.message ?? "Could not create your account." });
        }
      } else {
        const result = await auth.sendPasswordReset(email);
        setFeedback({
          tone: result.ok ? "success" : "error",
          text: result.message ?? (result.ok ? "Reset link sent." : "Could not send reset link."),
        });
        setForgotCooldown(FORGOT_COOLDOWN_SECONDS);
      }
    } catch (error) {
      setFeedback({
        tone: "error",
        text: isNetworkError(error)
          ? "Network error — check your connection and try again."
          : "Something went wrong. Please try again.",
      });
    }

    setSubmitting(false);
  }

  if (screen === "signup-sent") {
    return <EmailConfirmationPending email={sentEmail} onBack={() => switchMode("signin")} />;
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
        <div
          role="status"
          className={`mt-5 rounded-xl px-4 py-3 text-sm font-semibold ${
            feedback.tone === "error" ? "bg-error/10 text-error" : "bg-success/10 text-success"
          }`}
        >
          <p>{feedback.text}</p>
          {feedback.action && (
            <button
              type="button"
              onClick={feedback.action.onClick}
              className="mt-1 font-bold underline underline-offset-2"
            >
              {feedback.action.label}
            </button>
          )}
        </div>
      )}

      {mode === "signin" && isLocked && (
        <p role="alert" className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          Too many failed attempts. Try again in {lockSecondsRemaining}s, or reset your password.
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
                  className="-my-3 inline-block py-3 text-sm font-bold text-royal hover:underline"
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
          {mode === "signin"
            ? isLocked
              ? `Try again in ${lockSecondsRemaining}s`
              : "Sign in"
            : mode === "signup"
              ? "Create account"
              : forgotCooldown > 0
                ? `Resend available in ${forgotCooldown}s`
                : "Send reset link"}
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
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="-my-3 inline-block py-3 font-bold text-royal hover:underline"
            >
              Create an account
            </button>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="-my-3 inline-block py-3 font-bold text-royal hover:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className="-my-3 inline-block py-3 font-bold text-royal hover:underline"
          >
            ← Back to sign in
          </button>
        )}
      </p>

      {mode !== "forgot" && (
        <p className="mt-3 text-center text-sm font-semibold text-muted">
          Student?{" "}
          <Link
            href="/student-sign-in"
            className="-my-3 inline-block py-3 font-bold text-royal hover:underline"
          >
            Sign in with your code
          </Link>
        </p>
      )}
    </div>
  );
}
