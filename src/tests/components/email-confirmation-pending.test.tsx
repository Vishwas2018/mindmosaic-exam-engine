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

    /* "Sent" only because the server accepted the resend. */
    expect(await screen.findByRole("status")).toHaveTextContent(/a new link is on its way/i);
    expect(screen.getByRole("button", { name: /resend available in \d+s/i })).toBeDisabled();
  });

  it("does not claim a new link was sent when the resend fails, and offers a person", async () => {
    mockResend.mockResolvedValue({ error: { message: "SMTP exploded", status: 500 } });
    const user = userEvent.setup();
    renderPending();

    await user.click(screen.getByRole("button", { name: /resend confirmation email/i }));

    const status = await screen.findByRole("status");
    expect(status).not.toHaveTextContent(/on its way|resent|sent/i);
    expect(status).not.toHaveTextContent(/smtp/i);
    expect(status).toHaveTextContent(/hello@mindmosaic\.app/i);
  });

  it("says how long to wait and where to look, without stating an unverified expiry time", () => {
    renderPending();
    expect(screen.getByText(/give it a minute, then check spam/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/24 hours|expires in \d/i);
  });

  it("calls onBack when 'sign in' is chosen for an already-confirmed address", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderPending(onBack);

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("offers to change the email only when the caller can take the person back to the form", async () => {
    const { rerender } = renderPending();
    expect(screen.queryByRole("button", { name: /change your email/i })).not.toBeInTheDocument();

    const onChangeEmail = vi.fn();
    rerender(
      <AuthProvider>
        <EmailConfirmationPending email="jamie@example.com" onBack={vi.fn()} onChangeEmail={onChangeEmail} />
      </AuthProvider>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /change your email/i }));
    expect(onChangeEmail).toHaveBeenCalledTimes(1);
  });
});
