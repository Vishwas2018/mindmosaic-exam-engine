"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { useHydrated } from "@/lib/use-hydrated";

import { useAuth } from "../AuthProvider";
import { configuredOAuthProviders } from "../oauth-providers";
import { evaluatePassword } from "../password";
import { AuthCard, AuthCardHeading } from "./AuthMosaicPanel";
import {
  MmCheckbox,
  MmErrorPanel,
  MmField,
  MmRevealButton,
  mmAuthButton,
  mmFocus,
  useShakeOnInvalidSubmit,
} from "./auth-fields";
import { EmailConfirmationPending } from "./EmailConfirmationPending";
import { SocialButtons } from "./SocialButtons";

/**
 * Create a family account — Claude Design auth artboards 05 (desktop) and 09 (mobile): one card, one step.
 * The parent makes their own account here; children are added after sign-in from the parent's setup screen
 * ("Welcome — add your first child"), which is where a child's login code and PIN are issued.
 *
 * The draft (name, email, consent — never the password) is kept in sessionStorage, and Terms / Privacy open in a
 * new tab, so reading them never costs the parent what they had typed.
 */

const DRAFT_KEY = "mm-signup-draft";

const STRENGTH = {
  empty: { label: "", width: "0%", fill: "bg-mm-line-soft" },
  weak: { label: "Weak", width: "30%", fill: "bg-mm-coral" },
  fair: { label: "Fair", width: "65%", fill: "bg-[var(--mm-ember-ink)]" },
  strong: { label: "Strong", width: "100%", fill: "bg-[#0f6b32]" },
} as const;

function readDraft(): { name: string; email: string; agreed: boolean } {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<{ name: string; email: string; agreed: boolean }>;
      return { name: v.name ?? "", email: v.email ?? "", agreed: v.agreed === true };
    }
  } catch {
    /* storage unavailable: start empty */
  }
  return { name: "", email: "", agreed: false };
}

export function SignUpForm() {
  const router = useRouter();
  const auth = useAuth();
  const hydrated = useHydrated();
  const oauthProviders = configuredOAuthProviders();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const shake = useShakeOnInvalidSubmit();

  /* sessionStorage exists only in the browser, so the draft is restored after hydration (a lazy initial state
     would make the server and client markup disagree). The fields stay disabled until then. */
  useEffect(() => {
    const d = readDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of client-only persisted state
    setName(d.name);
    setEmail(d.email);
    setAgreed(d.agreed);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, email, agreed }));
    } catch {
      /* best effort */
    }
  }, [name, email, agreed, restored]);

  const evaluation = useMemo(() => evaluatePassword(password), [password]);
  const meter = STRENGTH[evaluation.strength];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!name.trim() || !email.trim() || !password) {
      setError("Enter your name, your email address and a password.");
      shake.trigger();
      return;
    }
    if (!evaluation.allMet) {
      setError("Choose a password that meets every rule under the field.");
      shake.trigger();
      return;
    }
    if (!agreed) {
      setError("Tick the box to agree to the Terms and Privacy Policy.");
      shake.trigger();
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await auth.signUp({ email: email.trim(), password, displayName: name.trim(), role: "parent" });
    if (!result.ok) {
      setError(result.message ?? "Could not create your account. Please try again.");
      shake.trigger();
      setSubmitting(false);
      return;
    }
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* best effort */
    }
    if (result.needsEmailConfirmation) {
      setConfirmEmail(email.trim());
      setSubmitting(false);
      return;
    }
    router.push("/parent");
    router.refresh();
  }

  if (confirmEmail) {
    return (
      <AuthCard>
        <EmailConfirmationPending
          email={confirmEmail}
          onBack={() => router.push("/sign-in?role=parent")}
          onChangeEmail={() => setConfirmEmail(null)}
        />
      </AuthCard>
    );
  }

  const legal = twMerge("rounded font-semibold text-mm-brand hover:underline", mmFocus);

  return (
    <AuthCard className="grid gap-[22px]">
      <AuthCardHeading
        title="Create a family account"
        lead="One account for you. You add your children once you are in."
      />

      {oauthProviders.length > 0 && (
        <>
          <SocialButtons nextPath="/parent" providers={oauthProviders} />
          <div className="flex items-center gap-3 text-[13px] text-mm-muted">
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
            or with your email
            <span aria-hidden="true" className="h-px flex-1 bg-mm-line" />
          </div>
        </>
      )}

      <form key={shake.key} onSubmit={handleSubmit} noValidate className={twMerge("grid gap-4", shake.className)}>
        <MmField
          id="su-name"
          label="Your name"
          autoComplete="name"
          placeholder="Priya Raman"
          disabled={!hydrated}
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
            setError(null);
          }}
        />
        <MmField
          id="su-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          hint="We send one confirmation link here. You sign in with this address."
          disabled={!hydrated}
          value={email}
          onChange={(e) => {
            setEmail(e.currentTarget.value);
            setError(null);
          }}
        />
        <div className="grid gap-2">
          <MmField
            id="su-password"
            label="Create a password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            disabled={!hydrated}
            trailingRoom
            trailing={
              <MmRevealButton controls="su-password" visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
            value={password}
            onChange={(e) => {
              setPassword(e.currentTarget.value);
              setError(null);
            }}
          />
          <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-mm-track">
            <span className={clsx("block h-full rounded-full transition-all duration-300", meter.fill)} style={{ width: meter.width }} />
          </span>
          <p aria-live="polite" className="min-h-[21px] text-[13px] text-mm-muted">
            {meter.label && (
              <>
                Strength: <span className="font-semibold text-mm-ink-soft">{meter.label}</span>
              </>
            )}
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]" aria-label="Password rules">
            {evaluation.results.map((rule) => (
              <li key={rule.id} className={clsx("flex items-center gap-1.5", rule.met ? "text-[#0f6b32]" : "text-mm-muted")}>
                <Check aria-hidden="true" className={clsx("h-3.5 w-3.5", rule.met ? "opacity-100" : "opacity-30")} />
                {rule.label}
                <span className="sr-only">{rule.met ? " (met)" : " (not yet)"}</span>
              </li>
            ))}
          </ul>
        </div>

        <MmCheckbox id="su-consent" align="start" checked={agreed} onToggle={() => setAgreed((v) => !v)}>
          I agree to the{" "}
          <Link href="/terms" target="_blank" rel="noopener" className={legal}>
            Terms<span className="sr-only"> (opens in a new tab)</span>
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" rel="noopener" className={legal}>
            Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          .
        </MmCheckbox>

        {error && (
          <MmErrorPanel id="su-error" focusOnMount>
            {error}
          </MmErrorPanel>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={mmAuthButton({ disabled: submitting, className: "mt-1 min-h-[50px] w-full rounded-xl text-[15px]" })}
        >
          {submitting && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-mm-muted">
        Already have one?{" "}
        <Link href="/sign-in?role=parent" className={legal}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
