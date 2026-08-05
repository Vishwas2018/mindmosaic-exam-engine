import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ status: "anonymous", role: null }),
}));

vi.mock("server-only", () => ({}));

import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { eligibilityKey } from "@/features/exam-engine/selection";
import { getBankEligibility } from "@/server/exam-bank";

/**
 * The configurator's extended-practice-bank checkbox starts UNTICKED, for
 * every program, including the ones that used to pin the seed-inclusive
 * bank (see src/tests/unit/extended-bank-opt-in.test.ts for the policy and
 * why `status` cannot be asserted instead).
 *
 * `initialBankId` still sets the gated floor — it just cannot decide the
 * checkbox any more.
 */
const eligibility = getBankEligibility();

/** A combination whose seed pool is much larger than its gated pool. */
const ICAS_G3_NUMERACY = {
  yearLevel: 3,
  examStyle: "icas_style",
  subject: "numeracy",
} as const;

describe("ExamConfigurator — extended bank default", () => {
  it("starts unticked even for a program that used to pin the practice bank", () => {
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="published"
      />,
    );

    const toggle = screen.getByTestId("toggle-practice").querySelector("input");
    expect(toggle).not.toBeChecked();
  });

  it("starts unticked when a program still passes the practice bank id", () => {
    /* Defence in depth: even if a caller reintroduces initialBankId
       "practice", the checkbox must not follow it. That coupling is what
       shipped ungated content to a real student. */
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="practice"
      />,
    );

    expect(screen.getByTestId("toggle-practice").querySelector("input")).not.toBeChecked();
  });

  it("counts only gated questions until the learner opts in", async () => {
    const user = userEvent.setup();
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="published"
      />,
    );

    const key = eligibilityKey(ICAS_G3_NUMERACY);
    const gated = eligibility.published[key]?.count ?? 0;
    const extended = eligibility.practice[key]?.count ?? 0;
    /* The fixture is only meaningful if opting in actually changes it. */
    expect(extended).toBeGreaterThan(gated);

    expect(
      screen.getByText(new RegExp(`^${gated} matching question`)),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("toggle-practice").querySelector("input")!);

    expect(
      screen.getByText(new RegExp(`^${extended} matching question`)),
    ).toBeInTheDocument();
  });

  it("names the opt-in when the gated pool cannot fill the chosen length", () => {
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="published"
      />,
    );

    /* icas-g3-numeracy has 7 gated questions against a default of 10, so it
       lands in the insufficient state — which must explain the option and
       its cost rather than leaving a disabled button unexplained. */
    const message = screen.getByTestId("insufficient-message");
    expect(message).toHaveTextContent(/fewer than the 10 requested/i);
    expect(message).toHaveTextContent(/have not been reviewed/i);
  });
});
