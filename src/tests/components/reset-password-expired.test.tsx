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
const mockSignOut = vi.fn();
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
      signOut: mockSignOut,
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
    mockSignOut.mockReset();
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

    expect(screen.getByRole("heading", { name: /reset link has expired/i })).toBeInTheDocument();
    expect(screen.getByText(/ask for a new one/i)).toBeInTheDocument();
    /* The provider's own wording is not shown. */
    expect(screen.queryByText(/email link is invalid/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start again/i })).toHaveAttribute(
      "href",
      "/sign-in?mode=forgot",
    );
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  it("renders the normal form when there is no link error", () => {
    window.history.pushState({}, "", "/auth/reset");
    renderReset();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /link/i })).not.toBeInTheDocument();
  });

  it("tells a spent link apart from an expired one, and points at sign-in", () => {
    window.history.pushState({}, "", "/auth/reset?error=access_denied&error_code=access_denied");
    renderReset();
    expect(screen.getByText(/already been used or isn.t valid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: /reset again/i })).toBeInTheDocument();
    expect(screen.queryByText(/has expired/i)).not.toBeInTheDocument();
  });

  it("falls back to the expired-link screen when updatePassword fails with a missing session", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockUpdateUser.mockResolvedValue({ error: { message: "Auth session missing!" } });
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByText(/already been used or isn.t valid/i)).toBeInTheDocument();
  });

  it("only says other devices were signed out when the server confirmed it", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValueOnce({ error: null }); // scope: others
    mockSignOut.mockResolvedValueOnce({ error: null }); // this device
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByRole("heading", { name: /password changed/i })).toBeInTheDocument();
    expect(screen.getByText(/we signed out your other devices/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign-in/i })).toHaveAttribute("href", "/sign-in");
  });

  it("does not claim other devices were signed out when that step failed", async () => {
    window.history.pushState({}, "", "/auth/reset");
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValueOnce({ error: { message: "boom", status: 500 } });
    mockSignOut.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    renderReset();

    await user.type(screen.getByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /save new password/i }));

    expect(await screen.findByRole("heading", { name: /password changed/i })).toBeInTheDocument();
    expect(screen.queryByText(/we signed out your other devices/i)).not.toBeInTheDocument();
  });

  it("flags a mismatch next to the field and keeps save disabled", async () => {
    window.history.pushState({}, "", "/auth/reset");
    const user = userEvent.setup();
    renderReset();
    await user.type(screen.getByLabelText("New password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm new password/i), "Different1!");
    expect(screen.getByText(/don.t match yet/i)).toHaveAttribute("id", "confirm-mismatch");
    expect(screen.getByLabelText(/confirm new password/i)).toHaveAttribute(
      "aria-describedby",
      "confirm-mismatch",
    );
    expect(screen.getByRole("button", { name: /save new password/i })).toBeDisabled();
  });
});
