import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import ResetPasswordPage from "@/app/auth/reset/page";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockUpdateUser = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSetSession = vi.fn();
const mockGetUser = vi.fn();
const mockAssurance = vi.fn();
const mockSignOut = vi.fn(async () => ({ error: null }));
const mockGetSession = vi.fn(async () => ({ data: { session: null } }));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      updateUser: mockUpdateUser,
      verifyOtp: mockVerifyOtp,
      setSession: mockSetSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
      mfa: { getAuthenticatorAssuranceLevel: mockAssurance },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

function renderReset() {
  return render(
    <AuthProvider>
      <ResetPasswordPage />
    </AuthProvider>,
  );
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

/** An access token whose payload carries a session_id (the signature is irrelevant: the server check is mocked). */
function fakeJwt(sessionId: string): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return b64({ alg: "none" }) + "." + b64({ session_id: sessionId }) + ".sig";
}

/** A signed-in session whose server-verified authentication methods are exactly `methods`. */
function signedInWith(methods: Array<{ method: string; timestamp: number }>, serverAccepts = true, sessionId = "sess-1") {
  mockGetSession.mockImplementation(
    async () => ({ data: { session: { user: { id: "u1" }, access_token: fakeJwt(sessionId) } } }) as never,
  );
  mockGetUser.mockResolvedValue(
    serverAccepts
      ? { data: { user: { id: "u1" } }, error: null }
      : { data: { user: null }, error: { message: "invalid JWT" } },
  );
  mockAssurance.mockResolvedValue({ data: { currentAuthenticationMethods: methods }, error: null });
}
const recoveryNow = () => [{ method: "recovery", timestamp: nowSeconds() }];

describe("ResetPasswordPage — expired/invalid link handling", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    push.mockClear();
    mockUpdateUser.mockReset();
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
    mockGetSession.mockImplementation(async () => ({ data: { session: null } }));
    mockGetUser.mockReset();
    mockAssurance.mockReset();
    mockSignOut.mockClear();
  });

  afterEach(() => {
    window.history.pushState({}, "", originalHref);
  });

  it("shows an expired-link screen instead of the form when Supabase reports otp_expired", () => {
    window.history.pushState(
      {},
      "",
      "/auth/reset?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );

    renderReset();

    expect(screen.getByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/this password reset link has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute(
      "href",
      "/sign-in?mode=forgot",
    );
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("renders the form for a session that a recovery link created", async () => {
    window.history.pushState({}, "", "/auth/reset");
    signedInWith(recoveryNow());
    renderReset();
    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
  });

  it("falls back to the expired-link screen when updatePassword fails with a missing session", async () => {
    window.history.pushState({}, "", "/auth/reset");
    signedInWith(recoveryNow());
    mockUpdateUser.mockResolvedValue({ error: { message: "Auth session missing!" } });
    const user = userEvent.setup();
    renderReset();

    await user.type(await screen.findByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/already been used/i)).toBeInTheDocument();
  });
});

describe("ResetPasswordPage — link shapes, cold access and focus", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    mockUpdateUser.mockReset();
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
    mockGetSession.mockImplementation(async () => ({ data: { session: null } }));
    mockGetUser.mockReset();
    mockAssurance.mockReset();
    mockSignOut.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.history.pushState({}, "", originalHref);
    vi.useRealTimers();
  });

  it("does not show the password form to someone who opened /auth/reset cold, and says what to do", async () => {
    window.history.pushState({}, "", "/auth/reset");
    renderReset();

    expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute(
      "href",
      "/sign-in?mode=forgot",
    );
  });

  it("moves focus to the heading when the page lands on a problem state", async () => {
    window.history.pushState({}, "", "/auth/reset?error_code=otp_expired");
    renderReset();

    const heading = await screen.findByRole("heading", { name: /link expired or invalid/i });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("opens the form from a token_hash link without needing anything from the requesting browser", async () => {
    window.history.pushState({}, "", "/auth/reset?token_hash=th-123&type=recovery");
    mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    signedInWith(recoveryNow());
    renderReset();

    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "th-123", type: "recovery" });
    // The single-use credential is removed from the address bar.
    expect(window.location.search).not.toContain("token_hash");
  });

  it("opens the form from an implicit-flow link whose tokens are in the fragment", async () => {
    window.history.pushState({}, "", "/auth/reset#access_token=at&refresh_token=rt&type=recovery");
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    signedInWith(recoveryNow());
    renderReset();

    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" });
    expect(window.location.hash).toBe("");
  });

  it("explains a rejected token_hash link instead of showing the form", async () => {
    window.history.pushState({}, "", "/auth/reset?token_hash=used&type=recovery");
    mockVerifyOtp.mockResolvedValue({
      data: { session: null },
      error: { message: "Email link is invalid or has expired" },
    });
    renderReset();

    const expiredHeading = await screen.findByRole("heading", { name: /link expired or invalid/i });
    await waitFor(() => expect(expiredHeading).toHaveFocus());
    expect(screen.getByText(/email link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("tells the user a PKCE link cannot complete on this device when no session appears", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.history.pushState({}, "", "/auth/reset?code=pkce-code");
    renderReset();

    expect(await screen.findByRole("heading", { name: /checking your link/i })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6500);
    });
    expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  describe("a session is not proof of recovery", () => {
    const refusals: Array<[string, Array<{ method: string; timestamp: number }>]> = [
      ["an ordinary password sign-in", [{ method: "password", timestamp: nowSeconds() }]],
      ["a signup-confirmation session", [{ method: "email/signup", timestamp: nowSeconds() }]],
      ["a magic-link session", [{ method: "magiclink", timestamp: nowSeconds() }]],
      ["a generic OTP sign-in", [{ method: "otp", timestamp: nowSeconds() }]],
      ["a recovery session older than the link lifetime", [{ method: "recovery", timestamp: nowSeconds() - 3601 }]],
      ["a session with no authentication methods", []],
    ];

    for (const [name, methods] of refusals) {
      it(`does not open the form for ${name} reached cold`, async () => {
        window.history.pushState({}, "", "/auth/reset");
        signedInWith(methods);
        renderReset();

        const coldHeading = await screen.findByRole("heading", { name: /open your reset link/i });
        await waitFor(() => expect(coldHeading).toHaveFocus());
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      });
    }

    it("does not open the form when the server rejects the token, even if its claims say recovery", async () => {
      window.history.pushState({}, "", "/auth/reset");
      signedInWith(recoveryNow(), false);
      renderReset();

      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      expect(mockGetUser).toHaveBeenCalled();
    });

    it("does not open the form for an authenticated ordinary session opening an invalid PKCE link", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      window.history.pushState({}, "", "/auth/reset?code=invalid-code");
      signedInWith([{ method: "password", timestamp: nowSeconds() }]);
      renderReset();

      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      const problemHeading = await screen.findByRole("heading", { name: /link expired or invalid/i });
      await waitFor(() => expect(problemHeading).toHaveFocus());
    });

    it("opens the form after a token_hash link verified as recovery, whose method is recorded as plain otp", async () => {
      window.history.pushState({}, "", "/auth/reset?token_hash=th&type=recovery");
      mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" }, access_token: fakeJwt("sess-th") } }, error: null });
      signedInWith([{ method: "otp", timestamp: nowSeconds() }], true, "sess-th");
      renderReset();

      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    });

    it("keeps the form open across a reload of the same recovery session, but not for a different session", async () => {
      window.history.pushState({}, "", "/auth/reset?token_hash=th&type=recovery");
      mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" }, access_token: fakeJwt("sess-a") } }, error: null });
      signedInWith([{ method: "otp", timestamp: nowSeconds() }], true, "sess-a");
      const first = renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      first.unmount();

      // Reload: credentials are gone from the URL, the marker for sess-a is still in this tab.
      window.history.pushState({}, "", "/auth/reset");
      renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    });

    it("refuses an otp session whose id the marker was not made for (another sign-in in the same tab)", async () => {
      window.history.pushState({}, "", "/auth/reset?token_hash=th&type=recovery");
      mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" }, access_token: fakeJwt("sess-a") } }, error: null });
      signedInWith([{ method: "otp", timestamp: nowSeconds() }], true, "sess-a");
      const first = renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      first.unmount();

      window.history.pushState({}, "", "/auth/reset");
      signedInWith([{ method: "otp", timestamp: nowSeconds() }], true, "sess-other");
      renderReset();
      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("refuses a token_hash link the server rejected", async () => {
      window.history.pushState({}, "", "/auth/reset?token_hash=bad&type=recovery");
      mockVerifyOtp.mockResolvedValue({ data: { session: null }, error: { message: "Email link is invalid or has expired" } });
      renderReset();

      expect(await screen.findByRole("heading", { name: /link expired or invalid/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("does not open the form when fragment tokens carry a non-recovery session", async () => {
      window.history.pushState({}, "", "/auth/reset#access_token=at&refresh_token=rt&type=signup");
      mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
      signedInWith([{ method: "password", timestamp: nowSeconds() }]);
      renderReset();

      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("ends the recovery session after the password is changed", async () => {
      window.history.pushState({}, "", "/auth/reset");
      signedInWith(recoveryNow());
      mockUpdateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      const user = userEvent.setup();
      renderReset();

      await user.type(await screen.findByLabelText("New password"), "Str0ng!pass");
      await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
