"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE, isSupabaseConfigured } from "@/lib/supabase/config";

import { isProfileRole, type ProfileRole, type SignUpRole } from "./roles";
import { buildAliasEmail } from "./student-alias";

export type AuthStatus = "loading" | "authenticated" | "anonymous" | "unconfigured";
export type OAuthProvider = "google" | "apple" | "azure" | "facebook";

export interface AuthResult {
  readonly ok: boolean;
  /** Human-readable message for the UI (success or error). */
  readonly message?: string;
  /** True when sign-up created a user that must confirm their email first. */
  readonly needsEmailConfirmation?: boolean;
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
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setStatus(data.session?.user ? "authenticated" : "anonymous");
      if (!data.session?.user) setRole(null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
        if (error) return { ok: false, message: error.message };
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
        if (error) return { ok: false, message: "That code and PIN don't match. Ask your parent to check them." };
        return { ok: true };
      },

      async signUp({ email, password, displayName, role: signUpRole = "parent" }) {
        if (!supabase) return notConfigured();
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
            emailRedirectTo: `${origin()}/auth/callback`,
          },
        });
        if (error) return { ok: false, message: error.message };
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
        if (error) return { ok: false, message: error.message };
        return { ok: true, message: "If that email has an account, a reset link is on its way." };
      },

      async updatePassword(password) {
        if (!supabase) return notConfigured();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { ok: false, message: error.message };
        return { ok: true, message: "Your password has been updated." };
      },

      async signOut() {
        if (!supabase) return;
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
