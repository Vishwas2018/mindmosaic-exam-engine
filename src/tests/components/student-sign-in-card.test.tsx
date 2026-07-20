import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import { StudentSignInCard } from "@/features/auth/components/StudentSignInCard";

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
const mockGetSession = vi.fn(async () => ({ data: { session: null } }));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));
const mockGetUser = vi.fn(async () => ({ data: { user: null } }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null }),
        }),
      }),
    }),
  }),
}));

function renderCard() {
  return render(
    <AuthProvider>
      <StudentSignInCard />
    </AuthProvider>,
  );
}

describe("StudentSignInCard", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    mockSignInWithPassword.mockReset();
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  it("never renders an email field — only a login code and a PIN", () => {
    renderCard();
    expect(screen.getByLabelText(/login code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("signs in by reconstructing the internal alias email from the code, never sending it as typed", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.type(screen.getByLabelText(/login code/i), "k7xj-2p9r");
    await user.type(screen.getByLabelText(/pin/i), "424242");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "childcode+k7xj2p9r@students.mindmosaic.internal",
      password: "424242",
    });
  });

  it("shows an error and does not navigate when the code/PIN pair is wrong", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const user = userEvent.setup();
    renderCard();

    await user.type(screen.getByLabelText(/login code/i), "AAAA-AAAA");
    await user.type(screen.getByLabelText(/pin/i), "000000");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/don't match/i);
    expect(push).not.toHaveBeenCalled();
  });
});
