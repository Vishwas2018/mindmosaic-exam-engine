import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SignInCard } from "@/features/auth/components/SignInCard";
import StudentSignInHelpPage from "@/app/student-sign-in/help/page";

describe("SignInCard", () => {
  it("prints a blank PIN line when the PIN is not known, never a guess", () => {
    render(<SignInCard childName="Aisha" loginCode="K7XJ-2P9R" signInUrl="https://x.test/student-sign-in" />);
    const card = screen.getByTestId("signin-card");
    expect(card).toHaveTextContent("K7XJ-2P9R");
    expect(card).toHaveTextContent("_ _ _ _ _ _");
    expect(card).toHaveTextContent("https://x.test/student-sign-in");
  });

  it("shows the PIN only when it was passed in", () => {
    render(<SignInCard childName="Aisha" loginCode="K7XJ-2P9R" pin="424242" signInUrl="u" />);
    expect(screen.getByTestId("signin-card")).toHaveTextContent("424242");
  });

  it("opens the browser print dialog", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<SignInCard childName="Aisha" loginCode="K7XJ-2P9R" signInUrl="u" />);
    await userEvent.setup().click(screen.getByRole("button", { name: /print sign-in card/i }));
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});

describe("student help page", () => {
  it("points a child at a grown-up and never at e-mail recovery", () => {
    render(<StudentSignInHelpPage />);
    expect(screen.getByRole("heading", { level: 1, name: /can.t sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/can you reset my pin/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to sign-in/i })).toHaveAttribute("href", "/student-sign-in");
    expect(screen.getByRole("link", { name: /a grown-up signs in/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByText(/reset.*email|email.*link/i)).not.toBeInTheDocument();
  });

  it("never uses deletion language about a paused account", () => {
    render(<StudentSignInHelpPage />);
    expect(screen.queryByText(/delete|closed|removed/i)).not.toBeInTheDocument();
  });
});
