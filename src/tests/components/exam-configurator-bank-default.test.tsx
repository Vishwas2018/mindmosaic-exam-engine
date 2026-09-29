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

/** Gated pool (18) is short of a 30-question exam; the seed pool (52) is not. */
const ICAS_G5_READING = {
  yearLevel: 5,
  examStyle: "icas_style",
  subject: "reading",
} as const;

describe("ExamConfigurator — extended bank removed", () => {
  it("does not render the toggle-practice checkbox for any program", () => {
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="published"
      />,
    );

    expect(screen.queryByTestId("toggle-practice")).toBeNull();
  });

  it("does not render the toggle-practice checkbox even when initialBankId is practice", () => {
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G3_NUMERACY}
        lockScope
        initialBankId="practice"
      />,
    );

    expect(screen.queryByTestId("toggle-practice")).toBeNull();
  });

  it("counts only published questions and cannot be widened", () => {
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

    expect(
      screen.getByText(new RegExp(`^${gated} matching question`)),
    ).toBeInTheDocument();
  });

  it("does not offer unreviewed content when the gated pool cannot fill the chosen length", async () => {
    const user = userEvent.setup();
    const mockKey = eligibilityKey(ICAS_G5_READING);
    const mockEligibility = {
      ...eligibility,
      published: {
        ...eligibility.published,
        [mockKey]: {
          ...(eligibility.published[mockKey] ?? { fullDurationSeconds: 1800 }),
          count: 18,
          total: 18,
        },
      },
    };

    render(
      <ExamConfigurator
        bankEligibility={mockEligibility}
        initialScope={ICAS_G5_READING}
        lockScope
        initialBankId="published"
      />,
    );

    await user.selectOptions(screen.getByTestId("select-question-count"), "30");
    const message = screen.getByTestId("insufficient-message");
    expect(message).toHaveTextContent(/fewer than the 30 requested/i);
    expect(message).not.toHaveTextContent(/extended practice bank/i);
    expect(message).not.toHaveTextContent(/have not been reviewed/i);
  });
});
