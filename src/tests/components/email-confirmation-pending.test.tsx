import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import { EmailConfirmationPending } from "@/features/auth/components/EmailConfirmationPending";

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

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
      resend: mockResend,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

function renderPending(onBack = vi.fn()) {
  return render(
    <AuthProvider>
      <EmailConfirmationPending email="jamie@example.com" onBack={onBack} />
    </AuthProvider>,
  );
}

describe("EmailConfirmationPending (parent sign-up screen 2 gap)", () => {
  beforeEach(() => {
    mockResend.mockReset();
    mockResend.mockResolvedValue({ error: null });
  });

  it("shows the address the confirmation was sent to", () => {
    renderPending();
    expect(screen.getByText("jamie@example.com")).toBeInTheDocument();
  });

  it("resends the confirmation email for type='signup' and starts a cooldown", async () => {
    const user = userEvent.setup();
    renderPending();

    const resendButton = screen.getByRole("button", { name: /resend confirmation email/i });
    await user.click(resendButton);

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0][0]).toMatchObject({ type: "signup", email: "jamie@example.com" });

    expect(await screen.findByRole("status")).toHaveTextContent(/resent/i);
    expect(screen.getByRole("button", { name: /resend available in \d+s/i })).toBeDisabled();
  });

  it("calls onBack when the back-to-sign-in link is used", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderPending(onBack);

    await user.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
