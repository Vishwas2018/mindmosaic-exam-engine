import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hasStoredAuthSession, isAuthRoute, urlCarriesAuthParams } from "@/features/auth/stored-session";

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const createClient = vi.fn();
const signInWithPassword = vi.fn(async () => ({ error: null }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    createClient();
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword,
        signOut: async () => ({ error: null }),
      },
      from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
    };
  },
}));

let signIn: ((email: string, password: string) => Promise<{ ok: boolean }>) | null = null;

/* A fresh copy of the provider per test, as a fresh page load would have: it keeps one client per
   page lifetime in a module variable, which is exactly what must not leak between tests. */
async function mount() {
  vi.resetModules();
  const { AuthProvider, useAuth } = await import("@/features/auth");
  function Probe() {
    const auth = useAuth();
    signIn = auth.signInWithPassword;
    return <p data-testid="status">{auth.status}</p>;
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

function setLocation(path: string) {
  window.history.replaceState({}, "", path);
}

/**
 * The ~70 KB Supabase client is loaded with a dynamic import and skipped altogether for a visit
 * with nothing for it to do. These pin when it loads and, just as important, that every case that
 * needs it still gets it.
 */
describe("AuthProvider loads the Supabase client lazily", () => {
  beforeEach(() => {
    createClient.mockClear();
    signInWithPassword.mockClear();
    setLocation("/");
  });
  afterEach(() => {
    document.cookie = "sb-test-auth-token=; path=/; max-age=0";
    setLocation("/");
  });

  it("does not create the client for an anonymous visitor, who is simply anonymous", async () => {
    await mount();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates the client at once when a stored session exists", async () => {
    document.cookie = "sb-test-auth-token=stored; path=/";
    await mount();
    await waitFor(() => expect(createClient).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
  });

  it("creates the client at once for an email link, whose URL is what turns into a session", async () => {
    setLocation("/auth/confirm?token_hash=abc&type=signup");
    await mount();
    await waitFor(() => expect(createClient).toHaveBeenCalledTimes(1));
  });

  it("loads the client on demand when an anonymous visitor signs in, and only once", async () => {
    await mount();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
    expect(createClient).not.toHaveBeenCalled();

    let result: { ok: boolean } | undefined;
    await act(async () => {
      result = await signIn?.("a@b.co", "pw");
    });
    await act(async () => {
      await signIn?.("a@b.co", "pw");
    });

    expect(result?.ok).toBe(true);
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "a@b.co", password: "pw" });
    expect(createClient).toHaveBeenCalledTimes(1);
  });
});

describe("stored-session helpers", () => {
  afterEach(() => {
    document.cookie = "sb-abc-auth-token=; path=/; max-age=0";
    document.cookie = "sb-abc-auth-token.0=; path=/; max-age=0";
    setLocation("/");
  });

  it("recognises the session cookie, including its chunked form", () => {
    expect(hasStoredAuthSession()).toBe(false);
    document.cookie = "sb-abc-auth-token.0=chunk; path=/";
    expect(hasStoredAuthSession()).toBe(true);
  });

  it("recognises a URL that carries an auth result", () => {
    expect(urlCarriesAuthParams()).toBe(false);
    setLocation("/reset#access_token=x&type=recovery");
    expect(urlCarriesAuthParams()).toBe(true);
  });

  it("treats the auth routes as needing the client", () => {
    for (const path of ["/sign-in", "/sign-up", "/student-sign-in", "/auth/reset", "/auth/confirm"]) {
      expect(isAuthRoute(path)).toBe(true);
    }
    for (const path of ["/", "/practice", "/programs", "/pricing"]) {
      expect(isAuthRoute(path)).toBe(false);
    }
  });
});
