import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ProfileRole } from "@/features/auth/roles";

const authMock = vi.hoisted(() => ({
  status: "anonymous" as "anonymous" | "authenticated" | "loading",
  role: null as ProfileRole | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    status: authMock.status,
    role: authMock.role,
  }),
}));

vi.mock("server-only", () => ({}));

import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { getBankEligibility } from "@/server/exam-bank";

const eligibility = getBankEligibility();

describe("ExamConfigurator role authorization & notices", () => {
  beforeEach(() => {
    authMock.status = "anonymous";
    authMock.role = null;
  });

  it("shows non-student notice and disables start button for admin", () => {
    authMock.status = "authenticated";
    authMock.role = "admin";

    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={{ yearLevel: 3, examStyle: "naplan_style", subject: "numeracy" }}
        initialBankId="published"
      />,
    );

    const notice = screen.getByTestId("non-student-role-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/signed in as an administrator/i);
    expect(notice).toHaveTextContent(/only be sat by student accounts/i);
    expect(screen.getByRole("link", { name: /admin dashboard/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByTestId("start-exam")).toBeDisabled();
  });

  it("shows non-student notice and disables start button for parent", () => {
    authMock.status = "authenticated";
    authMock.role = "parent";

    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={{ yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" }}
        initialBankId="published"
      />,
    );

    const notice = screen.getByTestId("non-student-role-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/signed in as a parent/i);
    expect(screen.getByRole("link", { name: /parent dashboard/i })).toHaveAttribute("href", "/parent");
    expect(screen.getByTestId("start-exam")).toBeDisabled();
  });

  it("permits student without non-student notice", () => {
    authMock.status = "authenticated";
    authMock.role = "student";

    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={{ yearLevel: 3, examStyle: "naplan_style", subject: "numeracy" }}
        initialBankId="published"
      />,
    );

    expect(screen.queryByTestId("non-student-role-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("start-exam")).toBeEnabled();
  });
});
