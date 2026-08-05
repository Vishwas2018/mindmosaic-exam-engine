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

const mockSignInWithPassword = vi.fn();
const mockResend = vi.fn();
const mockGetSession = vi.fn(async () => ({ data: { session: null } }));
const mockGetUser = vi.fn(async () => ({ data: { user: null } }));
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      resend: mockResend,
      resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

import { AuthProvider } from "@/features/auth";
import { SignInPanel } from "@/features/auth/components/SignInPanel";

/**
 * Log in — design handoff screen 6. These cases pin the parts of it that
 * are behaviour rather than styling: the Parent/Student split, what each
 * tab actually sends to Supabase, and the three failure states.
 *
 * The Student tab is the one worth reading closely. The design speculated
 * "student username + password"; a student on MindMosaic has neither. What
 * this asserts is the real contract from src/features/auth/student-alias.ts
 * — the login code is normalised and expanded into an internal alias email
 * that is never shown to anyone, and the PIN is the password.
 */
function renderPanel(props?: { defaultKind?: "parent" | "student" }) {
  return render(
    <AuthProvider>
      <SignInPanel {...props} />
    </AuthProvider>,
  );
}

describe("SignInPanel — the Parent/Student segmented control", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    mockSignInWithPassword.mockReset();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("opens on Parent and asks for an email address", () => {
    renderPanel();
    expect(screen.getByRole("tab", { name: "Parent" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/login code/i)).not.toBeInTheDocument();
  });

  it("swaps the identity field, its placeholder and the submit label on the Student tab", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("tab", { name: "Student" }));

    const code = screen.getByLabelText(/login code/i);
    expect(code).toBeInTheDocument();
    /* The real formatted shape from formatLoginCode(), not an invented
       username like the design file's "aisha.r5". */
    expect(code).toHaveAttribute("placeholder", "K7XJ-2P9R");
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in and start learning/i }),
    ).toBeInTheDocument();
  });

  it("opens straight onto the Student tab when asked (the /student-sign-in route)", () => {
    renderPanel({ defaultKind: "student" });
    expect(screen.getByRole("tab", { name: "Student" })).toHaveAttribute("aria-selected", "true");
  });

  it("signs a student in by rebuilding the alias email from the code, never sending it as typed", async () => {
    const user = userEvent.setup();
    renderPanel({ defaultKind: "student" });

    await user.type(screen.getByLabelText(/login code/i), "k7xj-2p9r");
    await user.type(screen.getByLabelText("PIN"), "424242");
    await user.click(screen.getByRole("button", { name: /sign in and start learning/i }));

    await waitFor(() =>
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "childcode+k7xj2p9r@students.mindmosaic.internal",
        password: "424242",
      }),
    );
  });

  it("does not offer a forgot-password link on the Student tab — a parent resets a PIN", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.getByRole("button", { name: /forgot password/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Student" }));
    expect(screen.queryByRole("button", { name: /forgot password/i })).not.toBeInTheDocument();
  });
});

describe("SignInPanel — failure states", () => {
  beforeEach(() => {
    push.mockClear();
    mockSignInWithPassword.mockReset();
    mockResend.mockReset();
    mockResend.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  async function attempt(user: ReturnType<typeof userEvent.setup>) {
    await user.clear(screen.getByLabelText(/email address/i));
    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "wrongpass1!");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));
  }

  /*
   * The design triggers the error panel on empty fields rather than
   * disabling the button — a disabled control tells a keyboard user
   * nothing about why.
   */
  it("errors on an empty submit instead of silently doing nothing", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter your email address/i);
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("does not repeat Supabase's wording for a bad credential pair", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    const user = userEvent.setup();
    renderPanel();

    await attempt(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/could not find an account with that email and password/i);
    expect(alert).not.toHaveTextContent(/invalid login credentials/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("offers a resend action when the account's email isn't confirmed yet", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Email not confirmed" } });
    const user = userEvent.setup();
    renderPanel();

    await attempt(user);

    expect(await screen.findByText(/confirm your email before signing in/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /resend confirmation email/i }));

    await waitFor(() => expect(mockResend).toHaveBeenCalledTimes(1));
    expect(mockResend.mock.calls[0][0]).toMatchObject({
      type: "signup",
      email: "jamie@example.com",
    });
  });

  it("distinguishes a thrown network failure from a rejected credential", async () => {
    mockSignInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();
    renderPanel();

    await attempt(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(/network error/i);
    expect(push).not.toHaveBeenCalled();
  });

  it(
    "locks out after repeated failures and says how long for",
    async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
      const user = userEvent.setup();
      renderPanel();

      for (let i = 0; i < 5; i += 1) {
        await attempt(user);
        await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalledTimes(i + 1));
      }

      expect(
        await screen.findByText(/too many failed attempts/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /try again in \d+s/i })).toBeDisabled();
    },
    // Five full fill-and-submit cycles are slow under full-suite CPU
    // contention; the default 5000ms budget flakes under load.
    15000,
  );
});

describe("SignInPanel — keep me signed in", () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("defaults to on and records nothing when left on", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");

    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));

    await waitFor(() => expect(mockSignInWithPassword).toHaveBeenCalled());
    expect(window.localStorage.getItem("mm.auth.ephemeral")).toBeNull();
  });

  /*
   * The marker has to land in BOTH stores: localStorage survives closing
   * the browser and sessionStorage does not, and it is the difference
   * between them one boot later that identifies a session the user asked
   * not to keep. See src/features/auth/session-persistence.ts.
   */
  it("marks the session ephemeral in both stores when unticked", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");

    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));

    await waitFor(() =>
      expect(window.localStorage.getItem("mm.auth.ephemeral")).toBe("1"),
    );
    expect(window.sessionStorage.getItem("mm.auth.ephemeral")).toBe("1");
  });
});
