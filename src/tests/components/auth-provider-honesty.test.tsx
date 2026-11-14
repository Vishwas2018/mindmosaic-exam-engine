import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const signInWithPassword = vi.fn();
const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();
const signUp = vi.fn();
const resend = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword,
      resetPasswordForEmail,
      updateUser,
      signOut,
      signUp,
      resend,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

import { AuthProvider, classifyAuthFailure, useAuth, type AuthContextValue } from "@/features/auth";
import { SignInPanel } from "@/features/auth/components/SignInPanel";
import { SocialButtons } from "@/features/auth/components/SocialButtons";

const captured: { current: AuthContextValue | null } = { current: null };
function Probe() {
  const value = useAuth();
  useEffect(() => {
    captured.current = value;
  }, [value]);
  return null;
}
const api = (): AuthContextValue => captured.current as AuthContextValue;
function mountProvider() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  for (const fn of [signInWithPassword, resetPasswordForEmail, updateUser, signOut, signUp, resend]) {
    fn.mockReset();
  }
});

describe("classifyAuthFailure", () => {
  it("separates network, rate limit and server failures from a rejected credential", () => {
    expect(classifyAuthFailure({ name: "AuthRetryableFetchError", status: 0 })).toBe("network");
    expect(classifyAuthFailure({ message: "Failed to fetch" })).toBe("network");
    expect(classifyAuthFailure({ status: 429 })).toBe("rate_limited");
    expect(classifyAuthFailure({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(classifyAuthFailure({ status: 503 })).toBe("unavailable");
    expect(classifyAuthFailure({ status: 400, message: "Invalid login credentials" })).toBeUndefined();
    /* No HTTP status at all is not a network failure. */
    expect(classifyAuthFailure({ message: "Invalid login credentials" })).toBeUndefined();
  });
});

describe("password recovery is generic", () => {
  it("says the same thing for any address once the server accepts the request", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    mountProvider();
    const a = await api().sendPasswordReset("has-account@example.com");
    const b = await api().sendPasswordReset("no-account@example.com");
    expect(a).toEqual(b);
    expect(a.message).toMatch(/if that email has an account/i);
  });

  it("never repeats the provider's wording when the send fails", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found for this email", status: 400 },
    });
    mountProvider();
    const result = await api().sendPasswordReset("someone@example.com");
    expect(result.ok).toBe(false);
    expect(result.message).not.toMatch(/not found|user|exist/i);
  });

  it("tells a dropped connection apart from other failures", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { name: "AuthRetryableFetchError", status: 0, message: "Failed to fetch" },
    });
    mountProvider();
    const result = await api().sendPasswordReset("someone@example.com");
    expect(result.failure).toBe("network");
    expect(result.message).toMatch(/couldn.t reach mindmosaic/i);
  });
});

describe("student sign-in gives one answer for a wrong code and a wrong PIN", () => {
  it("returns an identical message whichever part was wrong", async () => {
    mountProvider();
    signInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid login credentials", status: 400 } });
    const wrongPin = await api().signInWithStudentCode("K7XJ-2P9R", "000000");
    signInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid login credentials", status: 400 } });
    const unknownCode = await api().signInWithStudentCode("ZZZZ-ZZZZ", "424242");
    expect(wrongPin.message).toBe(unknownCode.message);
    expect(wrongPin.message).not.toMatch(/unknown|no such|not found|incorrect pin|wrong pin/i);
  });
});

describe("setting a new password", () => {
  it("reports other devices as signed out only when the server confirmed it", async () => {
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValueOnce({ error: null });
    mountProvider();
    const ok = await api().updatePassword("N3w-passw0rd!");
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(ok).toMatchObject({ ok: true, otherDevicesSignedOut: true });

    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValueOnce({ error: { message: "boom", status: 500 } });
    const partial = await api().updatePassword("N3w-passw0rd!");
    expect(partial).toMatchObject({ ok: true, otherDevicesSignedOut: false });
  });

  it("does not sign anything out when the password was not changed", async () => {
    updateUser.mockResolvedValue({ error: { message: "Session missing", status: 401 } });
    mountProvider();
    const result = await api().updatePassword("N3w-passw0rd!");
    expect(result.ok).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe("signup never announces that an address already has an account", () => {
  it("treats an already-registered address like any new sign-up", async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "user_already_exists", message: "User already registered", status: 422 },
    });
    mountProvider();
    const result = await api().signUp({
      email: "taken@example.com",
      password: "Str0ng!pass",
      displayName: "Taken Person",
    });
    expect(result).toEqual({ ok: true, needsEmailConfirmation: true });
  });

  it("still shows the password rule, which the person can act on", async () => {
    signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "weak_password", message: "Password is too weak", status: 422 },
    });
    mountProvider();
    const result = await api().signUp({ email: "a@example.com", password: "x", displayName: "A B" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/password/i);
  });
});

describe("a failed resend never says it was sent", () => {
  it("is not ok and does not echo provider text", async () => {
    resend.mockResolvedValue({ error: { message: "SMTP exploded", status: 500 } });
    mountProvider();
    const result = await api().resendConfirmationEmail("a@example.com");
    expect(result.ok).toBe(false);
    expect(result.message).not.toMatch(/smtp|resent —/i);
  });
});

describe("no dead social button", () => {
  it("renders nothing when no provider is configured", () => {
    const { container } = render(
      <AuthProvider>
        <SocialButtons providers={[]} />
      </AuthProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the configured providers", () => {
    render(
      <AuthProvider>
        <SocialButtons providers={["google"]} />
      </AuthProvider>,
    );
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apple|microsoft|facebook/i })).not.toBeInTheDocument();
  });

  it("the sign-in panel shows no social controls or 'or' divider by default", () => {
    render(
      <AuthProvider>
        <SignInPanel />
      </AuthProvider>,
    );
    expect(screen.queryByRole("button", { name: /google|apple|microsoft|facebook/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^or$/i)).not.toBeInTheDocument();
  });
});

describe("sign-in failure states that are not about the credentials", () => {
  async function attempt() {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignInPanel />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/email address/i), "jamie@example.com");
    await user.type(screen.getByLabelText("Password"), "whatever1!");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));
  }

  it("calls an auth-server outage our problem, not the account's", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "upstream", status: 503 } });
    await attempt();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/problem on our side, not with your account/i);
    expect(alert).not.toHaveTextContent(/didn.t match|reset your password/i);
  });

  it("shows a countdown for a server-side rate limit and does not claim a wrong password", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "slow down", status: 429 } });
    await attempt();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /try again in \d+s/i })).toBeDisabled(),
    );
    expect(screen.queryByText(/didn.t match/i)).not.toBeInTheDocument();
  });

  it("links the error to the fields it describes", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials", status: 400 } });
    await attempt();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("id", "auth-error");
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute("aria-describedby", "auth-error");
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-describedby", "auth-error");
  });
});

describe("a banned account never claims anything about what is kept", () => {
  it("student tab: gives the same sentence as a wrong PIN, so a paused account is not distinguishable (QA-003)", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "user_banned", message: "User is banned", status: 403 },
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignInPanel defaultKind="student" />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/login code/i), "K7XJ-2P9R");
    await user.type(screen.getByLabelText(/your pin, number 1 of 6/i), "424242");
    await user.click(screen.getByRole("button", { name: /sign in and start learning/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/That code and PIN didn.t match/i);
    expect(alert).not.toHaveTextContent(/paused|banned|right now|safe|kept|closed|deleted|removed|gone|erased/i);
  });

  it("parent tab: stays generic, so a revoked account is not distinguishable", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "user_banned", message: "User is banned", status: 403 },
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignInPanel />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/email address/i), "p@example.com");
    await user.type(screen.getByLabelText("Password"), "whatever1!");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/didn.t match/i);
  });
});

describe("validation before anything is sent", () => {
  it("rejects an incomplete email in the field and does not call the server", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignInPanel />
      </AuthProvider>,
    );
    await user.type(screen.getByLabelText(/email address/i), "jamie@example");
    await user.type(screen.getByLabelText("Password"), "whatever1!");
    await user.click(screen.getByRole("button", { name: /sign in to parent account/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/doesn.t look like a complete email address/i);
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute("aria-describedby", "auth-error");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
