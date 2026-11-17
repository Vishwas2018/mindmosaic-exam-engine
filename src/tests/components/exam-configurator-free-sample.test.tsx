import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const authState = { status: "anonymous" as string, role: null as string | null };
vi.mock("@/features/auth", () => ({ useAuth: () => authState }));
vi.mock("server-only", () => ({}));

import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { getBankEligibility } from "@/server/exam-bank";

const eligibility = getBankEligibility();

describe("ExamConfigurator on the Free plan", () => {
  it("shows a guest at most the 5-question sample and says so", () => {
    authState.status = "anonymous";
    render(<ExamConfigurator bankEligibility={eligibility} />);

    expect(screen.getByTestId("free-sample-note")).toHaveTextContent(/5 sample questions per programme/i);
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    const shown = Number(screen.getByTestId("eligible-count").textContent?.match(/\d+/)?.[0]);
    expect(shown).toBeLessThanOrEqual(5);
  });

  it("does not show the Free note to a signed-in student", () => {
    authState.status = "authenticated";
    authState.role = "student";
    render(<ExamConfigurator bankEligibility={eligibility} />);

    expect(screen.queryByTestId("free-sample-note")).not.toBeInTheDocument();
  });
});
