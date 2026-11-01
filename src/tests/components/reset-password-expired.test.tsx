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

describe("ResetPasswordPage — expired/invalid link handling", () => {
  const originalHref = window.location.href;

  beforeEach(() => {
    push.mockClear();
    mockUpdateUser.mockReset();
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
    mockGetSession.mockImplementation(async () => ({ data: { session: null } }));
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

  it("renders the normal form for a signed-in recovery session with no link error", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockGetSession.mockImplementation(async () => ({ data: { session: { user: { id: "u1" }, recovery: true } } }) as never);
    renderReset();
    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
  });

  it("locks out an ordinary authenticated session accessing /auth/reset cold without a recovery context", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockGetSession.mockImplementation(async () => ({ data: { session: { user: { id: "parent-1" }, amr: [{ method: "password" }] } } }) as never);
    renderReset();

    expect(await screen.findByRole("heading", { name: /open your reset link/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute(
      "href",
      "/sign-in?mode=forgot",
    );
  });

  it("falls back to the expired-link screen when updatePassword fails with a missing session", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockGetSession.mockImplementation(async () => ({ data: { session: { user: { id: "u1" }, recovery: true } } }) as never);
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
    expect(heading).toHaveFocus();
  });

  it("opens the form from a token_hash link without needing anything from the requesting browser", async () => {
    window.history.pushState({}, "", "/auth/reset?token_hash=th-123&type=recovery");
    mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    renderReset();

    expect(await screen.findByLabelText("New password")).toBeInTheDocument();
    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "th-123", type: "recovery" });
    // The single-use credential is removed from the address bar.
    expect(window.location.search).not.toContain("token_hash");
  });

  it("opens the form from an implicit-flow link whose tokens are in the fragment", async () => {
    window.history.pushState({}, "", "/auth/reset#access_token=at&refresh_token=rt&type=recovery");
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
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

    const heading = await screen.findByRole("heading", { name: /link expired or invalid/i });
    await waitFor(() => expect(heading).toHaveFocus());
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
});
