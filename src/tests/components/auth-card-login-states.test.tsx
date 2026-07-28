import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthCard, AuthProvider } from "@/features/auth";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
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
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      resend: mockResend,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

function renderSignIn() {
  return render(
    <AuthProvider>
      <AuthCard initialMode="signin" />
    </AuthProvider>,
  );
}

async function attemptSignIn(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/email address/i));
  await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
  await user.clear(screen.getByLabelText("Password"));
  await user.type(screen.getByLabelText("Password"), "wrongpass1!");
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("AuthCard sign-in — unverified email, lockout, network errors", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    mockSignInWithPassword.mockReset();
    mockSignUp.mockReset();
    mockResend.mockReset();
    mockResend.mockResolvedValue({ error: null });
  });

  it("offers a resend action when the account's email isn't confirmed yet", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Email not confirmed" } });
    const user = userEvent.setup();
    renderSignIn();

    await attemptSignIn(user);

    expect(await screen.findByText(/confirm your email before signing in/i)).toBeInTheDocument();
    const resendButton = screen.getByRole("button", { name: /resend confirmation email/i });
    await user.click(resendButton);

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0][0]).toMatchObject({ type: "signup", email: "jamie@example.com" });
  });

  it("shows a network-error message when sign-in throws instead of resolving", async () => {
    mockSignInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderSignIn();

    await attemptSignIn(user);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it(
    "locks out sign-in after repeated failed attempts with a countdown message",
    async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
      const user = userEvent.setup();
      renderSignIn();

      for (let i = 0; i < 5; i += 1) {
        await attemptSignIn(user);
        await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalledTimes(i + 1));
      }

      expect(await screen.findByRole("alert")).toHaveTextContent(/too many failed attempts/i);
      expect(screen.getByRole("button", { name: /try again in \d+s/i })).toBeDisabled();
    },
    // Five full form-fill-and-submit cycles are slow under a full-suite run's
    // CPU contention; the default 5000ms budget flakes under load even
    // though the same assertions finish in ~3s standalone.
    15000,
  );
});

describe("AuthCard sign-up — email confirmation pending screen", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });
  });

  it("shows the check-your-email screen instead of silently switching back to sign-in", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthCard initialMode="signup" />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/display name/i), "Jamie");
    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
  });
});
