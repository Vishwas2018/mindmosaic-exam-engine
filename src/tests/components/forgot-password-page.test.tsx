import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/features/auth/AuthProvider";
import ForgotPasswordPage from "@/app/auth/forgot/page";

function makeAuth(sendPasswordReset: AuthContextValue["sendPasswordReset"]): AuthContextValue {
  return {
    status: "anonymous",
    configured: true,
    user: null,
    session: null,
    displayName: null,
    role: null,
    fetchRole: vi.fn().mockResolvedValue(null),
    signInWithPassword: vi.fn().mockResolvedValue({ ok: false }),
    signInWithStudentCode: vi.fn().mockResolvedValue({ ok: false }),
    signUp: vi.fn().mockResolvedValue({ ok: false }),
    signInWithOAuth: vi.fn().mockResolvedValue({ ok: false }),
    sendPasswordReset,
    updatePassword: vi.fn().mockResolvedValue({ ok: false }),
    resendConfirmationEmail: vi.fn().mockResolvedValue({ ok: false }),
    confirmEmail: vi.fn().mockResolvedValue({ ok: false }),
    verifyEmailToken: vi.fn().mockResolvedValue({ ok: false }),
    verifyRecoveryToken: vi.fn().mockResolvedValue({ ok: false }),
    verifyRecoverySession: vi.fn().mockResolvedValue(false),
    adoptSessionTokens: vi.fn().mockResolvedValue({ ok: false }),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
}

describe("ForgotPasswordPage (DEF-AUTH-006 parity & resend cooldown)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects empty and malformed emails client-side without calling sendPasswordReset", async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue({ ok: true });
    render(
      <AuthContext.Provider value={makeAuth(sendPasswordReset)}>
        <ForgotPasswordPage />
      </AuthContext.Provider>,
    );

    // Empty email
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/enter the email address/i);
    expect(sendPasswordReset).not.toHaveBeenCalled();

    // Malformed email
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "not-an-email" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/complete email address/i);
    expect(sendPasswordReset).not.toHaveBeenCalled();
  });

  it("shows confirmation screen with 30s resend cooldown and allows resend after expiry", async () => {
    const sendPasswordReset = vi.fn().mockResolvedValue({ ok: true });
    render(
      <AuthContext.Provider value={makeAuth(sendPasswordReset)}>
        <ForgotPasswordPage />
      </AuthContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "parent@example.org" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    });

    expect(sendPasswordReset).toHaveBeenCalledTimes(1);
    expect(sendPasswordReset).toHaveBeenCalledWith("parent@example.org");
    expect(screen.getByRole("heading", { name: /check your email/i })).toBeVisible();

    // Resend button is disabled during 30s cooldown
    const resendBtn = screen.getByRole("button", { name: /resend available in 30s/i });
    expect(resendBtn).toBeDisabled();

    // Advance 30s -> button enables as "Resend reset link"
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    const enabledResend = screen.getByRole("button", { name: /^resend reset link$/i });
    expect(enabledResend).toBeEnabled();

    // Clicking resend calls sendPasswordReset again and restarts cooldown
    await act(async () => {
      fireEvent.click(enabledResend);
    });
    expect(sendPasswordReset).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /resend available in 30s/i })).toBeDisabled();
    expect(screen.getByText(/fresh reset link/i)).toBeVisible();
  });

  it("handles rate-limited and thrown network failures cleanly without leaking account existence", async () => {
    const sendPasswordReset = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: false,
        failure: "rate_limited",
        message: "Too many requests. Wait a little while before asking for another link.",
      });

    render(
      <AuthContext.Provider value={makeAuth(sendPasswordReset)}>
        <ForgotPasswordPage />
      </AuthContext.Provider>,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "parent@example.org" } });

    // Network exception -> friendly error, button stays enabled for retry
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn.t reach mindmosaic/i);
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeEnabled();

    // Rate-limited response -> error + 30s cooldown applied
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/too many requests/i);
    expect(screen.getByRole("button", { name: /resend available in 30s/i })).toBeDisabled();
  });
});
