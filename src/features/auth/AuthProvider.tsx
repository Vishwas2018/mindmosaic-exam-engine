"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "@/lib/supabase/config";

import { isCrossDeviceLinkError } from "./link-errors";
import { RECOVERY_WINDOW_SECONDS, forgetRecovery, recoveryMarkerMatches, rememberRecovery } from "./recovery-marker";
import { isProfileRole, type ProfileRole, type SignUpRole } from "./roles";
import { clearSessionPersistence, shouldDiscardStoredSession } from "./session-persistence";
import { PUBLIC_SIGNUP_ENABLED, SIGNUP_CLOSED_MESSAGE } from "./signup-policy";
import { buildAliasEmail } from "./student-alias";

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "unconfigured";
export type OAuthProvider = "google" | "apple" | "azure" | "facebook";

export interface AuthResult {
  readonly ok: boolean;
  /** Human-readable message for the UI (success or error). */
  readonly message?: string;
  /** True when sign-up created a user that must confirm their email first. */
  readonly needsEmailConfirmation?: boolean;
  /**
   * Why a call failed, when the cause changes what the person should do.
   * `network` = we never got an answer; `rate_limited` = the server asked us
   * to slow down; `unavailable` = the auth server failed (5xx), which is not
   * an account problem; `paused` = the auth server refused a banned user
   * (an archived child, but also an erased or revoked account, so callers
   * must not say anything about what is kept). Absent for an ordinary rejection.
   */
  readonly failure?: "network" | "rate_limited" | "unavailable" | "paused";
  /** updatePassword only: true once the server confirmed other sessions were ended. */
  readonly otherDevicesSignedOut?: boolean;
}

/** Classifies a Supabase auth error by what the person can do about it. */
export function classifyAuthFailure(error: {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
}): AuthResult["failure"] | undefined {
  /* `status` is 0 for a request that never got an answer. It is undefined
     (not 0) for errors that simply carry no HTTP status; those are not
     network failures. */
  const status = error.status ?? -1;
  if (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    /failed to fetch|networkerror|network request failed/i.test(error.message ?? "")
  ) {
    return "network";
  }
  if (
    status === 429 ||
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit"
  ) {
    return "rate_limited";
  }
  if (error.code === "user_banned") return "paused";
  if (status >= 500) return "unavailable";
  return undefined;
}

export interface AuthContextValue {
  readonly status: AuthStatus;
  readonly configured: boolean;
  readonly user: User | null;
  readonly session: Session | null;
  readonly displayName: string | null;
  /** Role from the user's profiles row; null while loading or signed out. */
  readonly role: ProfileRole | null;
  /** Fetch the current user's role directly (post-sign-in routing needs it before state settles). */
  fetchRole(): Promise<ProfileRole | null>;
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  /** Student sign-in: no email field, just the parent-issued login code and PIN. */
  signInWithStudentCode(loginCode: string, pin: string): Promise<AuthResult>;
  signUp(input: {
    email: string;
    password: string;
    displayName: string;
    role?: SignUpRole;
  }): Promise<AuthResult>;
  signInWithOAuth(provider: OAuthProvider, nextPath?: string): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  /** Resends the sign-up confirmation email (unverified accounts only). */
  resendConfirmationEmail(email: string): Promise<AuthResult>;
  /** Exchanges an email-confirmation `code` (from /auth/confirm) for a session. */
  confirmEmail(code: string): Promise<EmailConfirmResult>;
  /** Device-independent confirmation: verifies a `token_hash` link, which needs no verifier from the requesting browser. */
  verifyEmailToken(tokenHash: string, type: "signup" | "email"): Promise<EmailConfirmResult>;
  /** Device-independent password recovery: opens the recovery session from a `token_hash` link. */
  verifyRecoveryToken(tokenHash: string): Promise<AuthResult>;
  /**
   * True only when the current session was created by a password-recovery link. The server must accept the token
   * (`getUser` validates it; decoding a JWT locally proves nothing) and the authentication methods the SDK reports for
   * it must include a recent `recovery` entry. A password, signup, magic-link or OTP session is not a recovery session.
   */
  verifyRecoverySession(): Promise<boolean>;
  /** Adopts the session carried by an implicit-flow link (`#access_token=…&refresh_token=…`). */
  adoptSessionTokens(accessToken: string, refreshToken: string): Promise<EmailConfirmResult>;
  signOut(): Promise<void>;
}

export interface EmailConfirmResult extends AuthResult {
  /** The confirmed user's role, once their profile row is readable. */
  readonly role?: ProfileRole | null;
}

/** A confirmation session found at page load must have been created by this very link, so only moments ago. */
const CONFIRMATION_WINDOW_SECONDS = 300;

/**
 * True when the server accepts the current access token (`getUser` validates it; decoding a JWT locally proves
 * nothing) and the authentication methods the SDK reports for it include one of `methods` within the window.
 */
async function hasRecentMethod(
  client: SupabaseClient,
  methods: readonly string[],
  windowSeconds: number,
): Promise<boolean> {
  const { data: verified, error } = await client.auth.getUser();
  if (error || !verified.user) return false;
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const now = Math.floor(Date.now() / 1000);
  return (assurance?.currentAuthenticationMethods ?? []).some(
    (entry) => typeof entry === "object" && methods.includes(entry.method) && now - entry.timestamp <= windowSeconds,
  );
}

/**
 * A dead emailed link, reported as a reason code and never in the provider's own words. The provider's text
 * ("Email link is invalid or has expired") covers two cases at once, so only the error *code* is trusted to say
 * "expired". `other_device` is a PKCE link opened away from the browser that asked for it.
 */
function linkFailure(error: { message?: string; status?: number; code?: string; name?: string }): AuthResult {
  return {
    ok: false,
    failure: classifyAuthFailure(error),
    message: isCrossDeviceLinkError(error.message)
      ? "other_device"
      : error.code === "otp_expired"
        ? "expired"
        : "invalid",
  };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const notConfigured = (): AuthResult => ({
  ok: false,
  message: SUPABASE_NOT_CONFIGURED_MESSAGE,
});

function deriveName(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return (
    (meta.display_name as string | undefined) ??
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user.email ??
    null
  );
}

/** Pages where a sign-out is part of the flow, so it must not bounce to "session expired". */
function isAuthRoute(pathname: string): boolean {
  return /^\/(sign-in|sign-up|student-sign-in|session-expired|signed-out|switch-account|welcome|auth)(\/|$)/.test(
    pathname,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured;
  // One stable client instance for the provider's lifetime (only when
  // configured). A useState initialiser runs exactly once and is safe to read
  // during render, unlike a ref.
  const [supabase] = useState<SupabaseClient | null>(() =>
    configured ? createClient() : null,
  );

  const [status, setStatus] = useState<AuthStatus>(
    configured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<ProfileRole | null>(null);
  /* Sign-out bookkeeping for "session expired". A SIGNED_OUT event that this
     app did not cause, on a browser that had a session, is the session ending
     on its own (expiry, revoked refresh token, signed out in another tab). */
  const hadSession = useRef(false);
  const endedByThisApp = useRef(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      /*
       * "Keep me signed in on this device" (Log in screen) is enforced
       * here, on the first read of a stored session — see
       * ./session-persistence.ts for why it cannot be enforced at
       * sign-in time. Signing out drives the auth-state listener below,
       * which sets the anonymous state; nothing else is needed.
       */
      if (data.session && shouldDiscardStoredSession()) {
        clearSessionPersistence();
        endedByThisApp.current = true;
        void supabase.auth.signOut();
        setStatus("anonymous");
        return;
      }
      if (data.session) hadSession.current = true;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setStatus(data.session?.user ? "authenticated" : "anonymous");
      if (!data.session?.user) setRole(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession) hadSession.current = true;
      if (
        event === "SIGNED_OUT" &&
        hadSession.current &&
        !endedByThisApp.current &&
        typeof window !== "undefined" &&
        !isAuthRoute(window.location.pathname)
      ) {
        const here = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/session-expired?next=${encodeURIComponent(here)}`);
      }
      if (event === "SIGNED_OUT") {
        hadSession.current = false;
        endedByThisApp.current = false;
      }
      /* PASSWORD_RECOVERY is emitted only when the SDK has just turned a recovery link into this session. */
      if (event === "PASSWORD_RECOVERY") rememberRecovery(nextSession?.access_token);
      if (event === "SIGNED_OUT") forgetRecovery();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setStatus(nextSession?.user ? "authenticated" : "anonymous");
      if (!nextSession?.user) setRole(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  /*
   * The role lives on the profiles row (created by the sign-up trigger),
   * not in the auth token, so it is fetched whenever the signed-in user
   * changes. Clearing on sign-out happens in the auth-state callbacks
   * above, keeping this effect purely a subscription to external data.
   */
  const userId = user?.id ?? null;
  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!active) return;
        setRole(isProfileRole(data?.role) ? data.role : null);
      });
    return () => {
      active = false;
    };
  }, [supabase, userId]);

  const value = useMemo<AuthContextValue>(() => {
    const origin = () => (typeof window !== "undefined" ? window.location.origin : "");

    /* Shared tail of every confirmation shape: the role lives on the profiles row, not in the token. */
    const finishConfirmation = async (id: string | undefined): Promise<EmailConfirmResult> => {
      if (!supabase || !id) return { ok: true, role: null };
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", id).single();
      const fetched = isProfileRole(profile?.role) ? profile.role : null;
      setRole(fetched);
      return { ok: true, role: fetched };
    };

    return {
      status,
      configured,
      user,
      session,
      displayName: deriveName(user),
      role,

      async fetchRole() {
        if (!supabase) return null;
        const { data: userData } = await supabase.auth.getUser();
        const id = userData.user?.id;
        if (!id) return null;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", id)
          .single();
        const fetched = isProfileRole(data?.role) ? data.role : null;
        setRole(fetched);
        return fetched;
      },

      async signInWithPassword(email, password) {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { ok: false, message: error.message, failure: classifyAuthFailure(error) };
        }
        return { ok: true };
      },

      async signInWithStudentCode(loginCode, pin) {
        if (!supabase) return notConfigured();
        /*
         * D1: students never have a real email. The alias is reconstructed
         * from the login code alone (see ./student-alias.ts) — there is no
         * server round-trip and no lookup table, so this stays a plain
         * signInWithPassword call under the hood.
         */
        const { error } = await supabase.auth.signInWithPassword({
          email: buildAliasEmail(loginCode),
          password: pin,
        });
        if (error) {
          /* One message whether the code is unknown or the PIN is wrong, so a
             code cannot be fished for. Only a failure that is NOT about the
             credentials (network, rate limit, our side) is told apart. */
          return {
            ok: false,
            message: "That code and PIN didn't match. Check them with the grown-up who set them up, and try again.",
            failure: classifyAuthFailure(error),
          };
        }
        return { ok: true };
      },

      async signUp({ email, password, displayName, role: signUpRole = "parent" }) {
        if (!supabase) return notConfigured();
        /*
         * Refuse before calling out. This is honesty, not security — the
         * anon key is public, so GoTrue's /auth/v1/signup is reachable
         * without this code. The project-level setting is what actually
         * closes it (docs/DEPLOYMENT.md); this stops the UI from sending a
         * request it knows will be rejected and then reporting the backend's
         * wording as if the user had mistyped something.
         */
        if (!PUBLIC_SIGNUP_ENABLED) {
          return { ok: false, message: SIGNUP_CLOSED_MESSAGE };
        }
        /*
         * The role rides along as user metadata; the on_auth_user_created
         * database trigger reads it when creating the profiles row and
         * accepts only 'student' or 'parent'. Public sign-up only ever sends
         * 'parent' (D1: students are parent-provisioned, never self-service —
         * see ./provision-child.ts); teacher/admin are assigned manually in
         * the database.
         */
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, role: signUpRole },
            emailRedirectTo: `${origin()}/auth/confirm`,
          },
        });
        if (error) {
          const failure = classifyAuthFailure(error);
          if (failure === "network") {
            return { ok: false, failure, message: "We couldn't reach MindMosaic. Check your connection and try again." };
          }
          if (failure === "rate_limited") {
            return { ok: false, failure, message: "Too many attempts. Wait a little while and try again." };
          }
          /* An address that already has an account is never announced on the
             form. It is treated like any other new sign-up: the same
             "check your email" screen. The existing account holder is not
             told anything here. */
          if (error.code === "user_already_exists" || /already (been )?registered/i.test(error.message)) {
            return { ok: true, needsEmailConfirmation: true };
          }
          /* The password rule is the one rejection the person can act on. */
          if (error.code === "weak_password") {
            return { ok: false, message: error.message };
          }
          /* So is an address the mail provider will not accept (no mail server, a reserved domain, a typo).
             "Try again" would send the parent round the same loop with the same address. */
          if (error.code === "email_address_invalid") {
            return {
              ok: false,
              message: "That email address can't receive mail. Check it for typos, or use a different address.",
            };
          }
          return { ok: false, failure, message: "We couldn't create your account just now. Please try again." };
        }
        // When email confirmation is on, no session is returned yet.
        const needsEmailConfirmation = !data.session;
        return {
          ok: true,
          needsEmailConfirmation,
          message: needsEmailConfirmation
            ? "Check your email to confirm your account, then sign in."
            : undefined,
        };
      },

      async signInWithOAuth(provider, nextPath = "/") {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) return { ok: false, message: error.message };
        return { ok: true };
      },

      async sendPasswordReset(email) {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${origin()}/auth/reset`,
        });
        if (error) {
          /* Supabase answers "ok" for an address with no account, so a real
             error here is about delivery, never about existence. It is told
             apart only by what the person can do: wait, or check the
             connection. The provider's own wording is never shown. */
          const failure = classifyAuthFailure(error);
          return {
            ok: false,
            failure,
            message:
              failure === "network"
                ? "We couldn't reach MindMosaic. Check your connection and try again."
                : failure === "rate_limited"
                  ? "Too many requests. Wait a little while before asking for another link."
                  : "We couldn't send a reset link just now. Please try again in a few minutes.",
          };
        }
        return { ok: true, message: "If that email has an account, a reset link is on its way." };
      },

      async updatePassword(password) {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { ok: false, message: error.message };
        /* "We signed out your other devices" is only true if the server says
           so. A failure here does not undo the password change, so it is
           reported as success with the flag false rather than as an error. */
        const { error: othersError } = await supabase.auth.signOut({ scope: "others" });
        return {
          ok: true,
          message: "Your password has been updated.",
          otherDevicesSignedOut: !othersError,
        };
      },

      async resendConfirmationEmail(email) {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: `${origin()}/auth/confirm` },
        });
        if (error) {
          const failure = classifyAuthFailure(error);
          return {
            ok: false,
            failure,
            message:
              failure === "network"
                ? "We couldn't reach MindMosaic. Check your connection and try again."
                : "We couldn't send a new link just now. Please try again in a few minutes, or contact support.",
          };
        }
        return { ok: true, message: "Confirmation email resent — check your inbox." };
      },

      async confirmEmail(code) {
        if (!supabase) return notConfigured();
        /* The browser client exchanges a `?code=` found in the URL by itself while it initialises, and consumes the
           stored verifier doing so; exchanging it a second time fails with "code verifier not found" even though the
           link worked. getSession() waits for that initialisation, so first check whether it already produced the
           confirmation session. The session must be server-accepted and made by a signup confirmation moments ago:
           an older ordinary session must never be mistaken for it. */
        const existing = await supabase.auth.getSession();
        if (existing.data.session && (await hasRecentMethod(supabase, ["email/signup"], CONFIRMATION_WINDOW_SECONDS))) {
          return finishConfirmation(existing.data.session.user.id);
        }
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return linkFailure(error);
        return finishConfirmation(data.session?.user.id);
      },

      async verifyEmailToken(tokenHash, type) {
        if (!supabase) return notConfigured();
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) return linkFailure(error);
        return finishConfirmation(data.session?.user.id);
      },

      async verifyRecoverySession() {
        if (!supabase) return false;
        const { data: verified, error } = await supabase.auth.getUser(); // the server must accept the token first
        if (error || !verified.user) return false;
        const { data: current } = await supabase.auth.getSession();
        if (recoveryMarkerMatches(current.session?.access_token)) return true;
        /* Links delivered by GET /verify (PKCE code, implicit fragment) record the method as `recovery`. The method
           `otp` is deliberately NOT accepted: any OTP sign-in has it. */
        return hasRecentMethod(supabase, ["recovery"], RECOVERY_WINDOW_SECONDS);
      },

      async verifyRecoveryToken(tokenHash) {
        if (!supabase) return notConfigured();
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) return linkFailure(error);
        rememberRecovery(data.session?.access_token); // GoTrue accepted a RECOVERY token: record it for this session
        return { ok: true };
      },

      async adoptSessionTokens(accessToken, refreshToken) {
        if (!supabase) return notConfigured();
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) return linkFailure(error);
        return finishConfirmation(data.session?.user.id);
      },

      async signOut() {
        if (!supabase) return;
        /* Drop the persistence marker with the session it described, so it
           can never outlive it and sign the next user out on their first
           boot. */
        clearSessionPersistence();
        endedByThisApp.current = true;
        /* Clear any recovery marker so it cannot outlive the sign-out. */
        forgetRecovery();
        await supabase.auth.signOut();
      },
    };
  }, [supabase, configured, status, user, session, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>.");
  }
  return ctx;
}
