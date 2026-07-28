import { render, screen } from "@testing-library/react";
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

  it("renders the normal form when there is no link error", () => {
    window.history.pushState({}, "", "/auth/reset");
    renderReset();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.queryByText(/link expired or invalid/i)).not.toBeInTheDocument();
  });

  it("falls back to the expired-link screen when updatePassword fails with a missing session", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockUpdateUser.mockResolvedValue({ error: { message: "Auth session missing!" } });
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/link expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/already been used/i)).toBeInTheDocument();
  });
});
