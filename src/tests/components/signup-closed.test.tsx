import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("mode=signup"),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockSignUp = vi.fn(async () => ({ data: {}, error: null }));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: mockSignUp,
      signInWithPassword: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}));

import { AuthCard, AuthProvider } from "@/features/auth";
import { SignupClosedCard } from "@/features/auth/components/SignupClosedCard";
import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";

/**
 * Public sign-up is closed on this deployment. These cases pin the app's
 * half of that — the honest UI, and refusing before calling out.
 *
 * They are deliberately NOT the security control and must never be read as
 * one: the anon key ships to every browser, so GoTrue's /auth/v1/signup is
 * reachable without any of this code. The project-level Supabase setting is
 * what closes the door, and `npm run verify:signup-closed` is what proves
 * it. See docs/DEPLOYMENT.md.
 */
describe("public sign-up closure — the app's half", () => {
  beforeEach(() => {
    mockSignUp.mockClear();
    push.mockClear();
  });

  it("is configured closed on this deployment", () => {
    expect(PUBLIC_SIGNUP_ENABLED).toBe(false);
  });

  /*
   * The refusal happens before the network call. A form that posts to a
   * closed backend gets GoTrue's own wording back, which reads to whoever
   * typed it like they got something wrong.
   */
  it("refuses signUp without calling Supabase at all", async () => {
    const { useAuth } = await import("@/features/auth/AuthProvider");
    let auth: ReturnType<typeof useAuth> | null = null;
    function Probe() {
      auth = useAuth();
      return null;
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    const result = await auth!.signUp({
      email: "someone@example.com",
      password: "Str0ng!pass",
      displayName: "Someone",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/isn't open for public sign-up/i);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  /*
   * ?mode=signup is a query parameter — anyone can ask for the form. The
   * mocked useSearchParams above requests exactly that.
   */
  it("falls back to sign-in when ?mode=signup asks for the closed form", () => {
    render(
      <AuthProvider>
        <AuthCard initialMode="signin" />
      </AuthProvider>,
    );

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
  });

  it("does not invite anyone to create an account from the sign-in card", () => {
    render(
      <AuthProvider>
        <AuthCard initialMode="signin" />
      </AuthProvider>,
    );

    expect(screen.queryByRole("button", { name: /create an account/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /use a login code/i })).toHaveAttribute(
      "href",
      "/student-sign-in",
    );
  });

  it("explains the closure and offers real routes out", () => {
    render(<SignupClosedCard />);

    expect(screen.getByRole("heading", { name: /sign-up is closed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in to an existing account/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("link", { name: /login code/i })).toHaveAttribute(
      "href",
      "/student-sign-in",
    );
    /* Guest practice must never be gated behind an account — it is the one
       thing this product promises without one. */
    expect(screen.getByRole("link", { name: /start practising/i })).toHaveAttribute(
      "href",
      "/practice",
    );
  });
});

describe("the landing page no longer advertises account creation", () => {
  it("has no CTA pointing at /sign-up", async () => {
    const { forParents, pricing, footer } = await import("@/features/landing/content");
    expect(forParents.cta.href).not.toBe("/sign-up");
    for (const plan of pricing.plans) {
      expect(plan.cta.href).not.toBe("/sign-up");
    }
    for (const column of footer.columns) {
      for (const link of column.links) {
        expect(link.href).not.toBe("/sign-up");
      }
    }
  });
});
