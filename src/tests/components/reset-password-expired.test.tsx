import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import ResetPasswordPage from "@/app/auth/reset/page";

/**
 * The reset page's behaviour. The page talks to OUR recovery endpoints (mocked here at the fetch boundary; their own
 * decisions are covered by src/tests/unit/recovery-routes.test.ts and, against a real Auth service, by
 * e2e/auth/email-confirmation-and-recovery.spec.ts). What this file proves is what the page does with each answer, and
 * that it never reaches for Supabase's own update-user, verify or exchange calls.
 */
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
const mockExchange = vi.fn();
const mockSetSession = vi.fn();
const mockSignOut = vi.fn(async () => ({ error: null }));
const mockGetSession = vi.fn(async () => ({ data: { session: null as unknown } }));
let authListener: ((event: string, session: unknown) => void) | null = null;
const mockOnAuthStateChange = vi.fn((callback: (event: string, session: unknown) => void) => {
  authListener = callback;
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      updateUser: mockUpdateUser,
      verifyOtp: mockVerifyOtp,
      exchangeCodeForSession: mockExchange,
      setSession: mockSetSession,
      signOut: mockSignOut,
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}));

type Handler = (init?: RequestInit) => { status: number; body: unknown };
let routes: Record<string, Handler> = {};
const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const key = `${init?.method ?? "GET"} ${String(input)}`;
  const handler = routes[key];
  if (!handler) throw new Error(`unexpected request: ${key}`);
  const { status, body } = handler(init);
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
});

const VERIFY = "POST /api/auth/recovery/verify";
const SESSION_POST = "POST /api/auth/recovery/session";
const SESSION_GET = "GET /api/auth/recovery/session";
const SESSION_DELETE = "DELETE /api/auth/recovery/session";
const PASSWORD = "POST /api/auth/recovery/password";
const ok = (body: unknown = {}): Handler => () => ({ status: 200, body });
const fail = (status: number, body: unknown = {}): Handler => () => ({ status, body });

function renderReset() {
  return render(
    <AuthProvider>
      <ResetPasswordPage />
    </AuthProvider>,
  );
}

const signedInSession = () => ({ access_token: "at-1", refresh_token: "rt-1", user: { id: "u1" } });

describe("ResetPasswordPage", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    push.mockClear();
    for (const mock of [mockUpdateUser, mockVerifyOtp, mockExchange, mockSetSession, fetchMock]) mock.mockClear();
    mockSignOut.mockClear();
    mockGetSession.mockImplementation(async () => ({ data: { session: null } }));
    authListener = null;
    window.sessionStorage.clear();
    window.localStorage.clear();
    routes = { [SESSION_DELETE]: ok() };
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    window.history.pushState({}, "", originalHref);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Whatever the path, the page must never use Supabase's own credential-spending or password calls. */
  const neverCallsSupabaseDirectly = () => {
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockVerifyOtp).not.toHaveBeenCalled();
    expect(mockExchange).not.toHaveBeenCalled();
  };

  describe("links that cannot work", () => {
    it("shows an expired-link screen instead of the form when Supabase reports otp_expired", () => {
      window.history.pushState({}, "", "/auth/reset?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
      renderReset();
      expect(screen.getByText(/link expired or invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/this password reset link has expired/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute("href", "/sign-in?mode=forgot");
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("moves focus to the heading when the page lands on a problem state", async () => {
      window.history.pushState({}, "", "/auth/reset?error_code=otp_expired");
      renderReset();
      const heading = await screen.findByRole("heading", { name: /link expired or invalid/i });
      await waitFor(() => expect(heading).toHaveFocus());
    });

    it("explains a token_hash link the server rejected (expired, reused or malformed) instead of showing the form", async () => {
      window.history.pushState({}, "", "/auth/reset#token_hash=used-link-hash-123&type=recovery");
      routes[VERIFY] = fail(400, { error: "invalid_or_expired_link" });
      renderReset();
      const heading = await screen.findByRole("heading", { name: /link expired or invalid/i });
      await waitFor(() => expect(heading).toHaveFocus());
      expect(screen.getByText(/expired or has already been used/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      neverCallsSupabaseDirectly();
    });

    it("says so, and offers a retry, when our server could not check the link", async () => {
      window.history.pushState({}, "", "/auth/reset#token_hash=some-link-hash-123&type=recovery");
      routes[VERIFY] = fail(503, { error: "not_configured" });
      renderReset();
      expect(await screen.findByRole("heading", { name: /couldn't check your link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it("does not open the form for a recovery-type link that carries no token", async () => {
      window.history.pushState({}, "", "/auth/reset#type=recovery");
      renderReset();
      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });
  });

  describe("token_hash links (verified by the server, on any device)", () => {
    it("sends the token to the server in a POST body, removes it from the address bar first, and opens the form", async () => {
      window.history.pushState({}, "", "/auth/reset#token_hash=th-123456789&type=recovery");
      let sentBody = "";
      let urlAtRequestTime = "";
      routes[VERIFY] = (init) => {
        sentBody = String(init?.body);
        urlAtRequestTime = window.location.href;
        return { status: 200, body: { ok: true, csrfToken: "csrf-1" } };
      };
      renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      expect(JSON.parse(sentBody)).toEqual({ tokenHash: "th-123456789" });
      expect(urlAtRequestTime).not.toContain("th-123456789");
      expect(window.location.href).not.toContain("th-123456789");
      expect(fetchMock.mock.calls.every(([url]) => !String(url).includes("th-123456789"))).toBe(true);
      neverCallsSupabaseDirectly();
    });

    it("still accepts the older query-string form of the link, and removes it from the address bar", async () => {
      window.history.pushState({}, "", "/auth/reset?token_hash=th-query-12345&type=recovery");
      routes[VERIFY] = ok({ ok: true, csrfToken: "csrf-1" });
      renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      expect(window.location.search).not.toContain("token_hash");
    });

    it("keeps a token out of browser storage", async () => {
      window.history.pushState({}, "", "/auth/reset#token_hash=th-storage-123&type=recovery");
      routes[VERIFY] = ok({ ok: true, csrfToken: "csrf-secret-value" });
      renderReset();
      await screen.findByLabelText("New password");
      const dump = JSON.stringify({ ...window.localStorage }) + JSON.stringify({ ...window.sessionStorage });
      expect(dump).not.toContain("th-storage-123");
      expect(dump).not.toContain("csrf-secret-value");
    });

    it("clears a stale 'do not keep me signed in' marker so the recovery session is not discarded on the next load", async () => {
      window.localStorage.setItem("mm.auth.ephemeral", "1");
      window.history.pushState({}, "", "/auth/reset#token_hash=th-123456789&type=recovery");
      routes[VERIFY] = ok({ ok: true, csrfToken: "csrf-1" });
      renderReset();
      await screen.findByLabelText("New password");
      expect(window.localStorage.getItem("mm.auth.ephemeral")).toBeNull();
    });
  });

  describe("cold access and ordinary sessions", () => {
    it("does not show the form to someone who opened /auth/reset cold, and says what to do", async () => {
      window.history.pushState({}, "", "/auth/reset");
      renderReset();
      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute("href", "/sign-in?mode=forgot");
    });

    it("does not show the form to an ordinary signed-in session with no recovery grant", async () => {
      window.history.pushState({}, "", "/auth/reset");
      mockGetSession.mockImplementation(async () => ({ data: { session: signedInSession() } }));
      routes[SESSION_GET] = ok({ valid: false });
      renderReset();
      const heading = await screen.findByRole("heading", { name: /open your reset link/i });
      await waitFor(() => expect(heading).toHaveFocus());
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/password") && init?.method === "POST")).toBe(false);
    });

    it("reopens the form after a reload when the server still holds a valid grant for the session", async () => {
      window.history.pushState({}, "", "/auth/reset");
      mockGetSession.mockImplementation(async () => ({ data: { session: signedInSession() } }));
      routes[SESSION_GET] = ok({ valid: true, csrfToken: "csrf-after-reload", expiresAt: 4_000_000_000 });
      renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    });
  });

  describe("PKCE code and implicit links (a session the Auth service made itself)", () => {
    it("waits for the SDK's own exchange, asks the server about the resulting session, and never exchanges the code again", async () => {
      window.history.pushState({}, "", "/auth/reset?code=pkce-code");
      routes[SESSION_POST] = ok({ ok: true, csrfToken: "csrf-pkce" });
      renderReset();
      expect(await screen.findByRole("heading", { name: /checking your link/i })).toBeInTheDocument();
      /* The SDK finishes its exchange by itself and announces the session. */
      mockGetSession.mockImplementation(async () => ({ data: { session: signedInSession() } }));
      await act(async () => {
        authListener?.("SIGNED_IN", signedInSession());
      });
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      neverCallsSupabaseDirectly();
      expect(window.location.search).not.toContain("code=");
    });

    it("keeps waiting, then explains, when the only session is an ordinary one and the server says it is not a recovery session", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      window.history.pushState({}, "", "/auth/reset?code=pkce-code");
      mockGetSession.mockImplementation(async () => ({ data: { session: signedInSession() } }));
      routes[SESSION_POST] = fail(403, { error: "not_a_recovery_session" });
      renderReset();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(6500);
      });
      expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
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

    it("adopts implicit-flow fragment tokens once, then asks the server whether that session came from recovery", async () => {
      window.history.pushState({}, "", "/auth/reset#access_token=at&refresh_token=rt&type=recovery");
      mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
      routes[SESSION_POST] = ok({ ok: true, csrfToken: "csrf-implicit" });
      renderReset();
      expect(await screen.findByLabelText("New password")).toBeInTheDocument();
      expect(mockSetSession).toHaveBeenCalledExactlyOnceWith({ access_token: "at", refresh_token: "rt" });
      expect(window.location.hash).toBe("");
      neverCallsSupabaseDirectly();
    });

    it("does not open the form when fragment tokens carry a non-recovery session", async () => {
      window.history.pushState({}, "", "/auth/reset#access_token=at&refresh_token=rt&type=signup");
      mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
      routes[SESSION_POST] = fail(403, { error: "not_a_recovery_session" });
      renderReset();
      expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });
  });

  describe("setting the new password", () => {
    async function openForm() {
      window.history.pushState({}, "", "/auth/reset#token_hash=th-123456789&type=recovery");
      routes[VERIFY] = ok({ ok: true, csrfToken: "csrf-token-1" });
      const user = userEvent.setup();
      renderReset();
      await user.type(await screen.findByLabelText("New password"), "Str0ng!pass");
      await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
      return user;
    }

    it("posts the password to our endpoint with the grant's CSRF token, then ends the session and goes to sign-in", async () => {
      let seen: { headers: Record<string, string>; body: string } | null = null;
      const user = await openForm();
      routes[PASSWORD] = (init) => {
        seen = { headers: init?.headers as Record<string, string>, body: String(init?.body) };
        return { status: 200, body: { ok: true, otherSessionsRevoked: true } };
      };
      await user.click(screen.getByRole("button", { name: /update password/i }));
      expect(await screen.findByText(/password updated and other devices signed out/i)).toBeInTheDocument();
      expect(seen!.headers["x-mm-recovery-csrf"]).toBe("csrf-token-1");
      expect(seen!.headers["content-type"]).toBe("application/json");
      expect(JSON.parse(seen!.body)).toEqual({ password: "Str0ng!pass" });
      await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
      await waitFor(() => expect(push).toHaveBeenCalledWith("/sign-in"), { timeout: 3000 });
      neverCallsSupabaseDirectly();
    });

    it("does not claim other devices were signed out when the server says it could not", async () => {
      const user = await openForm();
      routes[PASSWORD] = ok({ ok: true, otherSessionsRevoked: false });
      await user.click(screen.getByRole("button", { name: /update password/i }));
      expect(await screen.findByText(/^Password updated — taking you to sign in/i)).toBeInTheDocument();
      expect(screen.queryByText(/other devices signed out/i)).not.toBeInTheDocument();
    });

    it("falls back to the expired-link screen when the grant is refused (expired, replayed or for another account)", async () => {
      const user = await openForm();
      routes[PASSWORD] = fail(403, { error: "recovery_required", reason: "mismatch" });
      await user.click(screen.getByRole("button", { name: /update password/i }));
      expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
      expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    });

    it("keeps the form and says so when the password is rejected", async () => {
      const user = await openForm();
      routes[PASSWORD] = fail(400, { error: "password_rejected" });
      await user.click(screen.getByRole("button", { name: /update password/i }));
      expect(await screen.findByText(/can't be used/i)).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
    });

    it("shows a retryable error when the server is unavailable", async () => {
      const user = await openForm();
      routes[PASSWORD] = fail(502, { error: "update_failed" });
      await user.click(screen.getByRole("button", { name: /update password/i }));
      expect(await screen.findByText(/could not update your password/i)).toBeInTheDocument();
      expect(screen.getByLabelText("New password")).toBeInTheDocument();
    });

    it("asks the server to clear the grant when the user signs out", async () => {
      const user = await openForm();
      routes[PASSWORD] = ok({ ok: true, otherSessionsRevoked: true });
      await user.click(screen.getByRole("button", { name: /update password/i }));
      await waitFor(() => expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/session") && init?.method === "DELETE")).toBe(true));
    });
  });
});
