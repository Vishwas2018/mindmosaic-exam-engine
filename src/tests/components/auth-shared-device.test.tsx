import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

const authState = {
  status: "authenticated" as "authenticated" | "anonymous",
  user: { id: "u-parent" },
  role: "parent" as const,
  displayName: "Priya Raman",
  signOut: vi.fn(async () => undefined),
};
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => authState,
}));

import { SwitchAccountScreen } from "@/features/auth/components/SwitchAccountScreen";
import {
  clearDeviceAccounts,
  forgetDeviceAccount,
  listDeviceAccounts,
  rememberDeviceAccount,
} from "@/features/auth/device-accounts";
import SignedOutPage from "@/app/signed-out/page";
import WelcomePage from "@/app/welcome/page";

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  refresh.mockClear();
  authState.signOut.mockClear();
});

describe("device account list", () => {
  it("stores nothing unless asked, and never a credential", () => {
    expect(listDeviceAccounts()).toEqual([]);
    rememberDeviceAccount({ id: "a", name: "Aisha", role: "student", yearLevel: 3 });
    const raw = window.localStorage.getItem("mm.device-accounts") ?? "";
    expect(raw).not.toMatch(/pin|password|token|email|code/i);
    expect(listDeviceAccounts()).toHaveLength(1);
  });

  it("refreshes rather than duplicates, can forget one, and can clear all", () => {
    rememberDeviceAccount({ id: "a", name: "Aisha", role: "student", yearLevel: 3 });
    rememberDeviceAccount({ id: "a", name: "Aisha R", role: "student", yearLevel: 3 });
    expect(listDeviceAccounts()).toHaveLength(1);
    rememberDeviceAccount({ id: "k", name: "Kiran", role: "student", yearLevel: 5 });
    expect(forgetDeviceAccount("a").map((a) => a.id)).toEqual(["k"]);
    clearDeviceAccounts();
    expect(listDeviceAccounts()).toEqual([]);
  });

  it("ignores corrupted or hostile storage", () => {
    window.localStorage.setItem("mm.device-accounts", "{nope");
    expect(listDeviceAccounts()).toEqual([]);
    window.localStorage.setItem(
      "mm.device-accounts",
      JSON.stringify([{ id: "x", name: "X", role: "root", yearLevel: null }, 5, null]),
    );
    expect(listDeviceAccounts()).toEqual([]);
  });
});

describe("SwitchAccountScreen", () => {
  it("shows the current account as signed in and offers to remember it only on request", async () => {
    const user = userEvent.setup();
    render(<SwitchAccountScreen />);
    expect(screen.getByText("Priya Raman")).toBeInTheDocument();
    expect(screen.getByText(/parent · signed in/i)).toBeInTheDocument();
    expect(listDeviceAccounts()).toEqual([]);

    await user.click(screen.getByRole("button", { name: /remember on this device/i }));
    expect(listDeviceAccounts().map((a) => a.name)).toEqual(["Priya Raman"]);
  });

  it("picking another account signs out first and sends a student to the student sign-in", async () => {
    rememberDeviceAccount({ id: "a", name: "Aisha", role: "student", yearLevel: 3 });
    const user = userEvent.setup();
    render(<SwitchAccountScreen />);
    await user.click(await screen.findByRole("button", { name: /aisha.*sign in again to switch/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/student-sign-in"));
    expect(authState.signOut).toHaveBeenCalledTimes(1);
  });

  it("'Sign everyone out' ends the session and forgets everyone", async () => {
    rememberDeviceAccount({ id: "a", name: "Aisha", role: "student", yearLevel: 3 });
    const user = userEvent.setup();
    render(<SwitchAccountScreen />);
    await user.click(screen.getByRole("button", { name: /sign everyone out/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signed-out"));
    expect(authState.signOut).toHaveBeenCalledTimes(1);
    expect(listDeviceAccounts()).toEqual([]);
  });
});

describe("signed-out and welcome screens", () => {
  it("signed-out says only what is true: signed out on this device", () => {
    render(<SignedOutPage />);
    expect(screen.getByRole("heading", { name: /you.re signed out/i })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/work is safe|nothing was lost|saved/i);
    expect(screen.getByRole("link", { name: /switch to another account/i })).toHaveAttribute("href", "/switch-account");
  });

  it("welcome offers both doors and the create-account link while sign-up is open", () => {
    render(<WelcomePage />);
    expect(screen.getByRole("link", { name: /i.m a parent/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: /i.m a student/i })).toHaveAttribute("href", "/student-sign-in");
    expect(screen.getByRole("link", { name: /create a family account/i })).toHaveAttribute("href", "/sign-up");
  });
});
