import { render, screen } from "@testing-library/react";
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

/*
 * Public sign-up is closed on this deployment
 * (src/features/auth/signup-policy.ts), so the form these cases describe is
 * not rendered by default. The parent-only invariant still matters — it is
 * what must hold if sign-up is ever re-opened — so the flag is mocked and
 * both states are covered, rather than deleting the coverage.
 */
let signupEnabled = true;
vi.mock("@/features/auth/signup-policy", () => ({
  get PUBLIC_SIGNUP_ENABLED() {
    return signupEnabled;
  },
  SIGNUP_CLOSED_MESSAGE: "Sign-up is closed for this deployment.",
}));

const mockSignUp = vi.fn();
const mockGetSession = vi.fn(async () => ({ data: { session: null } }));
const mockGetUser = vi.fn(async () => ({ data: { user: { id: "u1" } } }));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signUp: mockSignUp,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

function renderSignUp() {
  return render(
    <AuthProvider>
      <AuthCard initialMode="signup" />
    </AuthProvider>,
  );
}

describe("AuthCard sign-up (D1: parent-only self-service, when open)", () => {
  beforeEach(() => {
    signupEnabled = true;
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
  });

  it("no longer offers a student option — there is no role picker at all", () => {
    renderSignUp();
    expect(screen.queryByText(/this account is for/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /student/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /parent/i })).not.toBeInTheDocument();
  });

  it("points students at the separate code+PIN sign-in instead", () => {
    renderSignUp();
    const link = screen.getByRole("link", { name: /sign in with your code/i });
    expect(link).toHaveAttribute("href", "/student-sign-in");
  });

  it("always signs up as role='parent', regardless of any client input", async () => {
    const user = userEvent.setup();
    renderSignUp();

    await user.type(screen.getByLabelText(/display name/i), "Jamie");
    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.type(screen.getByLabelText(/confirm password/i), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockSignUp).toHaveBeenCalledTimes(1);
    const [payload] = mockSignUp.mock.calls[0];
    expect(payload.options.data.role).toBe("parent");
  });
});
