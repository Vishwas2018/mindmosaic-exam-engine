import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import { EmailVerificationScreen } from "@/features/auth/components/EmailVerificationScreen";

const push = vi.fn();
const refresh = vi.fn();
let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => currentParams,
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockExchangeCodeForSession = vi.fn();
const mockResend = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSetSession = vi.fn();
const mockGetUser = vi.fn();
const mockAssurance = vi.fn();
const mockGetSession = vi.fn(async () => ({ data: { session: null } }));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      exchangeCodeForSession: mockExchangeCodeForSession,
      resend: mockResend,
      verifyOtp: mockVerifyOtp,
      setSession: mockSetSession,
      getUser: mockGetUser,
      mfa: { getAuthenticatorAssuranceLevel: mockAssurance },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { role: "parent" } }) }) }),
    }),
  }),
}));

function renderScreen() {
  return render(
    <AuthProvider>
      <EmailVerificationScreen />
    </AuthProvider>,
  );
}

describe("EmailVerificationScreen (screen 6 gap)", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    mockExchangeCodeForSession.mockReset();
    mockResend.mockReset();
    mockResend.mockResolvedValue({ error: null });
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
    mockGetUser.mockReset();
    mockAssurance.mockReset();
    mockGetSession.mockImplementation(async () => ({ data: { session: null } }));
    window.history.pushState({}, "", "/auth/confirm");
  });

  it("shows a verifying state, then confirms and redirects to the role home", async () => {
    currentParams = new URLSearchParams({ code: "good-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });

    renderScreen();

    expect(screen.getByText(/confirming your email/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /email confirmed/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue/i })).toHaveAttribute("href", "/parent");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/parent"), { timeout: 2000 });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an expired-link error with resend guidance when there is no code", async () => {
    const user = userEvent.setup();
    currentParams = new URLSearchParams({ error_code: "otp_expired" });

    renderScreen();

    expect(await screen.findByRole("heading", { name: /this link has expired/i })).toBeInTheDocument();
    expect(screen.getByText(/we.ll send a fresh one/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0][0]).toMatchObject({ type: "signup", email: "jamie@example.com" });
    /* "Sent" appears only once the send was accepted. */
    expect(await screen.findByText(/a new link is on its way/i)).toBeInTheDocument();
  });

  it("does not claim a new link was sent when the resend fails", async () => {
    currentParams = new URLSearchParams({ error_code: "otp_expired" });
    mockResend.mockResolvedValue({ error: { message: "SMTP exploded", status: 500 } });
    renderScreen();

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/email address/i), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: /send a new link/i }));

    expect(screen.queryByText(/a new link is on its way/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/couldn.t send a new link/i)).toBeInTheDocument();
    expect(screen.queryByText(/smtp/i)).not.toBeInTheDocument();
  });

  it("tells a used or invalid link apart from an expired one, and points at sign-in", async () => {
    currentParams = new URLSearchParams({ error_code: "access_denied" });
    renderScreen();

    expect(await screen.findByText(/invalid or has already been used/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByText(/has expired/i)).not.toBeInTheDocument();
  });

  it("shows an error state when the code exchange itself fails", async () => {
    currentParams = new URLSearchParams({ code: "bad-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Token has expired or is invalid" },
    });

    renderScreen();

    expect(await screen.findByText(/invalid or has already been used/i)).toBeInTheDocument();
    /* The provider's own wording is never shown. */
    expect(screen.queryByText(/token has expired or is invalid/i)).not.toBeInTheDocument();
  });

  it("says it is our side, not the link, when the exchange cannot be completed", async () => {
    currentParams = new URLSearchParams({ code: "any-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "upstream", status: 503 },
    });

    renderScreen();

    expect(await screen.findByText(/problem on our side, not with your link/i)).toBeInTheDocument();
  });

  it("confirms from a token_hash link, which needs no verifier from the requesting browser", async () => {
    currentParams = new URLSearchParams({ token_hash: "th-1", type: "signup" });
    mockVerifyOtp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    renderScreen();

    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();
    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: "th-1", type: "signup" });
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/parent"), { timeout: 2000 });
  });

  it("confirms from an implicit-flow link whose tokens are in the fragment", async () => {
    currentParams = new URLSearchParams();
    window.history.pushState({}, "", "/auth/confirm#access_token=at&refresh_token=rt&type=signup");
    mockSetSession.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });

    renderScreen();

    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" });
    expect(window.location.hash).toBe("");
  });

  it("replaces the raw PKCE verifier error with a plain-language explanation and focuses the heading", async () => {
    currentParams = new URLSearchParams({ code: "other-device-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: {
        message:
          "PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device",
      },
    });

    renderScreen();

    expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
    expect(screen.queryByText(/verifier/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /open this link on the same device/i })).toHaveFocus();
  });

  it("explains a link with no credentials at all rather than spinning", async () => {
    currentParams = new URLSearchParams();

    renderScreen();

    expect(await screen.findByText(/invalid or has already been used/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  const nowSeconds = () => Math.floor(Date.now() / 1000);
  function existingSession(methods: Array<{ method: string; timestamp: number }>, serverAccepts = true) {
    mockGetSession.mockImplementation(async () => ({ data: { session: { user: { id: "u1" } } } }) as never);
    mockGetUser.mockResolvedValue(
      serverAccepts
        ? { data: { user: { id: "u1" } }, error: null }
        : { data: { user: null }, error: { message: "invalid JWT" } },
    );
    mockAssurance.mockResolvedValue({ data: { currentAuthenticationMethods: methods }, error: null });
  }
  const verifierGone = {
    data: { session: null },
    error: { message: "PKCE code verifier not found in storage." },
  };

  it("succeeds when the SDK already exchanged this link's code on startup (no second, doomed exchange)", async () => {
    currentParams = new URLSearchParams({ code: "already-consumed" });
    existingSession([{ method: "email/signup", timestamp: nowSeconds() }]);
    mockExchangeCodeForSession.mockResolvedValue(verifierGone);

    renderScreen();

    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("does not mistake an older ordinary session for a confirmation: it still exchanges and reports the failure", async () => {
    currentParams = new URLSearchParams({ code: "other-device-code" });
    existingSession([{ method: "password", timestamp: nowSeconds() }]);
    mockExchangeCodeForSession.mockResolvedValue(verifierGone);

    renderScreen();

    expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).toHaveBeenCalledTimes(1);
  });

  it("does not trust a signup-looking session the server rejects", async () => {
    currentParams = new URLSearchParams({ code: "forged" });
    existingSession([{ method: "email/signup", timestamp: nowSeconds() }], false);
    mockExchangeCodeForSession.mockResolvedValue(verifierGone);

    renderScreen();

    expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
    expect(screen.queryByText(/email confirmed/i)).not.toBeInTheDocument();
  });

  it("does not trust a stale signup session from earlier", async () => {
    currentParams = new URLSearchParams({ code: "stale" });
    existingSession([{ method: "email/signup", timestamp: nowSeconds() - 3600 }]);
    mockExchangeCodeForSession.mockResolvedValue(verifierGone);

    renderScreen();

    expect(await screen.findByText(/different device or browser/i)).toBeInTheDocument();
  });
});
