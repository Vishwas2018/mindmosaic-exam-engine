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
    currentParams = new URLSearchParams({ error_code: "otp_expired" });

    renderScreen();

    expect(await screen.findByRole("heading", { name: /this link has expired/i })).toBeInTheDocument();
    expect(screen.getByText(/we.ll send a fresh one/i)).toBeInTheDocument();
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();

    const user = userEvent.setup();
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
});
