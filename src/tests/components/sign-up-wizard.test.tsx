import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const mockSignUp = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: mockSignUp,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

import { AuthProvider } from "@/features/auth";
import { SignUpWizard } from "@/features/auth/components/SignUpWizard";

/**
 * Sign up — design handoff screen 7, reconciled (DESIGN_AUDIT.md §4, §7).
 *
 * The cases below pin the four reconciliations that would otherwise be
 * silently lost the next time someone "restores fidelity" from the design
 * file: the consent gate, parent-only role, the year levels that actually
 * have content behind them, and the fact that no account exists until the
 * final step.
 */
function renderWizard() {
  return render(
    <AuthProvider>
      <SignUpWizard availableYearLevels={[3, 5]} />
    </AuthProvider>,
  );
}

async function completeStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/first name/i), "Priya");
  await user.type(screen.getByLabelText(/last name/i), "Raman");
  await user.type(screen.getByLabelText(/email address/i), "priya@example.com");
  await user.type(screen.getByLabelText(/create a password/i), "Str0ng!pass");
  await user.click(screen.getByRole("checkbox"));
}

describe("SignUpWizard — step 1, the parent account", () => {
  beforeEach(() => {
    push.mockClear();
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });
  });

  it("opens on step 1 of 3", () => {
    renderWizard();
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /create the parent account/i })).toBeInTheDocument();
  });

  /*
   * The handoff makes the consent checkbox a hard gate on the primary
   * button. It is the only field on the screen with a legal consequence,
   * so it is not something a filled-in form should be able to skip past.
   */
  it("keeps Continue disabled until consent is ticked, and says why", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByLabelText(/first name/i), "Priya");
    await user.type(screen.getByLabelText(/last name/i), "Raman");
    await user.type(screen.getByLabelText(/email address/i), "priya@example.com");
    await user.type(screen.getByLabelText(/create a password/i), "Str0ng!pass");

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    expect(screen.getByText(/accept the terms to continue/i)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    expect(button).toBeEnabled();
    expect(screen.getByText(/no card required/i)).toBeInTheDocument();
  });

  /*
   * The design's meter is length-only: it would read "Strong" at ten
   * lowercase characters, which src/features/auth/password.ts then
   * rejects. Driving it from the real rules means the meter and the gate
   * cannot disagree.
   */
  it("does not call a long-but-weak password strong", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByLabelText(/create a password/i), "abcdefghijkl");

    /* Twelve characters, but only two of the five rules met — the design's
       length-only meter would have read "Strong" here. */
    expect(screen.queryByText("Strong")).not.toBeInTheDocument();
    expect(screen.getByText(/too weak · 2\/5/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});

describe("SignUpWizard — step 2, the student", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
  });

  /*
   * Provisioning rejects anything that is not Year 3 or Year 5
   * (src/features/auth/provision-child.ts). Rendering all twelve buttons
   * matches the design; making the other ten selectable would just move
   * the rejection to the server, after the account had been created.
   */
  it("renders all twelve year levels but only enables the ones with a question bank", async () => {
    const user = userEvent.setup();
    renderWizard();
    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("button", { name: "Year 3" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Year 5" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /year 7 — no practice content yet/i })).toBeDisabled();
    /* Never colour alone — the constraint is also stated in prose. */
    expect(screen.getByText(/years 3 and 5 have a full question bank today/i)).toBeInTheDocument();
  });

  it("offers Skip for now, which reaches step 3 without a student", async () => {
    const user = userEvent.setup();
    renderWizard();
    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByRole("button", { name: /skip for now/i }));

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
  });
});

describe("SignUpWizard — step 3 and account creation", () => {
  beforeEach(() => {
    push.mockClear();
    mockSignUp.mockReset();
  });

  /*
   * The design treats all three steps as one form submitted at the end.
   * In this product the account genuinely is created at the end — nothing
   * is sent to Supabase while stepping through — because provisioning a
   * student requires the parent session that sign-up returns.
   */
  it("sends nothing to Supabase until the final step", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    const user = userEvent.setup();
    renderWizard();

    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /skip for now/i }));

    expect(mockSignUp).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /create the account/i }));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
  });

  it("always creates the account as role='parent'", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    const user = userEvent.setup();
    renderWizard();

    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /skip for now/i }));
    await user.click(screen.getByRole("button", { name: /create the account/i }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    const [payload] = mockSignUp.mock.calls[0];
    expect(payload.options.data.role).toBe("parent");
    expect(payload.options.data.display_name).toBe("Priya Raman");
  });

  /*
   * With email confirmation on there is no session, so no student can be
   * provisioned. Losing the name that was just typed in silently would be
   * the worst version of this; the screen says what happened to it.
   */
  it("explains what happened to the student when email confirmation interrupts", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null, user: { id: "u1" } }, error: null });
    const user = userEvent.setup();
    renderWizard();

    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByLabelText(/student first name/i), "Aisha");
    await user.click(screen.getByRole("button", { name: "Year 5" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /create the account/i }));

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText(/aisha hasn't been added yet/i)).toBeInTheDocument();
  });

  it("marks Singapore Maths as being confirmed rather than offering content that does not exist", async () => {
    mockSignUp.mockResolvedValue({ data: { session: { user: { id: "u1" } } }, error: null });
    const user = userEvent.setup();
    renderWizard();

    await completeStepOne(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /skip for now/i }));

    const singapore = screen.getByRole("radio", { name: /singapore maths/i });
    expect(singapore).toBeDisabled();
    expect(singapore).toHaveTextContent(/being confirmed/i);
  });
});
