"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { useAuth } from "../AuthProvider";
import { roleHomePath } from "../roles";
import { MmErrorPanel, MmField, mmAuthButton, mmFocus } from "./auth-fields";

type Stage = "verifying" | "success" | "error";
/**
 * Why a link is dead. "Expired" is about time; "invalid" covers a link that
 * was already used or never valid: the provider does not tell those two
 * apart, and the screen does not pretend to. Neither echoes the provider's
 * own wording.
 */
type LinkProblem = "expired" | "invalid" | "unconfigured" | "unavailable";

const PROBLEM_COPY: Record<LinkProblem, { title: string; body: string }> = {
  expired: {
    title: "This link has expired",
    body: "This link has expired. We’ll send a fresh one to the address below.",
  },
  invalid: {
    title: "This link can’t be used",
    body: "This link is invalid or has already been used. If you have already confirmed, just sign in.",
  },
  unconfigured: {
    title: "Accounts aren’t connected",
    body: "Accounts aren’t connected on this device yet.",
  },
  unavailable: {
    title: "We couldn’t confirm your email",
    body: "We couldn’t confirm your email just now. This is a problem on our side, not with your link. Please try the link again in a few minutes.",
  },
};

/*
 * Read once at mount, via a lazy useState initializer rather than an effect:
 * next/navigation's useSearchParams() (unlike raw window.location) is
 * already consistent between the server and client render, so computing the
 * link's initial stage here carries no hydration-mismatch risk — only the
 * *async* confirmEmail() call genuinely needs to live in an effect.
 */
function computeInitialStage(
  searchParams: URLSearchParams,
  configured: boolean,
): { stage: Stage; problem: LinkProblem | null } {
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error_code");

  if (errorCode || !code) {
    return { stage: "error", problem: errorCode === "otp_expired" ? "expired" : "invalid" };
  }
  if (!configured) return { stage: "error", problem: "unconfigured" };
  return { stage: "verifying", problem: null };
}

/**
 * Lands from the confirmation-email link (see AuthProvider.signUp's
 * emailRedirectTo and /auth/confirm). Exchanges the `code` for a session,
 * then redirects to the confirmed user's role home. A dead link (Supabase
 * reports it via `error_code` query params rather than a `code`) shows a
 * resend form instead of spinning forever.
 *
 * Honesty rules: "confirmed" is shown only after the exchange succeeded; a
 * resend says "sent" only after the server accepted it; provider error text
 * is never shown.
 */
export function EmailVerificationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmEmail, resendConfirmationEmail, configured } = useAuth();

  const [initial] = useState(() => computeInitialStage(searchParams, configured));
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [problem, setProblem] = useState<LinkProblem | null>(initial.problem);
  const [destination, setDestination] = useState("/");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [resending, setResending] = useState(false);
  const [resend, setResend] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (initial.stage !== "verifying") return;
    // Guaranteed present: computeInitialStage only returns "verifying" when a `code` param exists.
    const code = searchParams.get("code")!;

    let active = true;
    confirmEmail(code).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStage("error");
        setProblem(
          result.failure === "network" || result.failure === "unavailable"
            ? "unavailable"
            : /expired/i.test(result.message ?? "")
              ? "expired"
              : "invalid",
        );
        return;
      }
      const next = roleHomePath(result.role);
      setDestination(next);
      setStage("success");
      setTimeout(() => {
        if (!active) return;
        router.push(next);
        router.refresh();
      }, 1200);
    });
    return () => {
      active = false;
    };
    // Runs once against the link's query params — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend(event: FormEvent) {
    event.preventDefault();
    if (resending || email.trim().length === 0) return;
    setResending(true);
    setResend(null);
    let result: Awaited<ReturnType<typeof resendConfirmationEmail>>;
    try {
      result = await resendConfirmationEmail(email.trim());
    } catch {
      result = { ok: false, message: "We couldn’t reach MindMosaic. Check your connection and try again." };
    }
    setResend(
      result.ok
        ? {
            ok: true,
            text: `A new link is on its way. Check ${email.trim()}.`,
          }
        : {
            ok: false,
            text: `${result.message ?? "We couldn’t send a new link just now."} If it keeps happening, email hello@mindmosaic.app.`,
          },
    );
    setResending(false);
  }

  const copy = problem ? PROBLEM_COPY[problem] : null;

  return (
    <main
      id="main-content"
      className="mm-root flex min-h-screen items-center justify-center bg-mm-page px-4 py-10 text-mm-ink"
    >
      <div className="mm-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(89,37,168,0.1)] sm:p-10">
        {stage === "verifying" && (
          <>
            <Loader2 aria-hidden="true" className="mx-auto h-10 w-10 animate-spin text-mm-brand" />
            <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
              Confirming your email…
            </h1>
            <p role="status" className="mt-2 text-sm text-mm-muted">This only takes a moment.</p>
          </>
        )}

        {stage === "success" && (
          <>
            <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#0B6B63]" />
            <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
              Email confirmed
            </h1>
            <p role="status" className="mt-2 text-sm text-mm-muted">
              Taking you to your account…
            </p>
            <Link
              href={destination}
              className={mmAuthButton({ className: "mt-6 w-full" })}
            >
              Continue
            </Link>
          </>
        )}

        {stage === "error" && copy && (
          <>
            <MailWarning aria-hidden="true" className="mx-auto h-10 w-10 text-mm-coral-deep" />
            <h1 className="mt-5 text-2xl font-[700] tracking-[-0.03em] text-mm-ink">
              {copy.title}
            </h1>
            <MmErrorPanel>{copy.body}</MmErrorPanel>

            {problem !== "unconfigured" && problem !== "unavailable" && (
              <form onSubmit={handleResend} className="mt-6 grid gap-4 text-left">
                <MmField
                  id="verify-resend-email"
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
                <button
                  type="submit"
                  disabled={resending || email.trim().length === 0}
                  className={mmAuthButton({
                    disabled: resending || email.trim().length === 0,
                    className: "w-full",
                  })}
                >
                  {resending && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
                  Send a new link
                </button>
              </form>
            )}

            {resend && (
              <p
                role={resend.ok ? "status" : "alert"}
                className={twMerge(
                  "mm-rise-fast mt-4 rounded-xl px-4 py-3 text-sm font-semibold",
                  resend.ok
                    ? "bg-mm-tint text-mm-brand"
                    : "border border-mm-alert-line bg-mm-alert text-mm-coral-deep",
                )}
              >
                {resend.text}
              </p>
            )}

            <Link
              href="/sign-in"
              className={twMerge(
                "mt-5 inline-flex min-h-11 items-center rounded font-bold text-mm-brand hover:underline",
                mmFocus,
              )}
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
