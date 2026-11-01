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
    window.history.pushState({}, "", "/auth/confirm");
  });

  it("shows a verifying state, then confirms and redirects to the role home", async () => {
    currentParams = new URLSearchParams({ code: "good-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });

    renderScreen();

    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/parent"), { timeout: 2000 });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an expired-link error with resend guidance when there is no code", async () => {
    const user = userEvent.setup();
    currentParams = new URLSearchParams({ error_code: "otp_expired" });

    renderScreen();

    expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/this verification link has expired/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.click(screen.getByRole("button", { name: /resend verification email/i }));

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0][0]).toMatchObject({ type: "signup", email: "jamie@example.com" });
  });

  it("shows an error state when the code exchange itself fails", async () => {
    currentParams = new URLSearchParams({ code: "bad-code" });
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Token has expired or is invalid" },
    });

    renderScreen();

    expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/token has expired or is invalid/i)).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: /link expired or invalid/i })).toHaveFocus();
  });

  it("explains a link with no credentials at all rather than spinning", async () => {
    currentParams = new URLSearchParams();

    renderScreen();

    expect(await screen.findByText(/invalid or has already been used/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });
});
