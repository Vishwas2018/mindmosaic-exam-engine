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

  it("names the opt-in when the gated pool cannot fill the chosen length", async () => {
    const user = userEvent.setup();
    render(
      <ExamConfigurator
        bankEligibility={eligibility}
        initialScope={ICAS_G5_READING}
        lockScope
        initialBankId="published"
      />,
    );

    /*
     * Reaching the insufficient state now takes a longer exam, not a
     * thinner program. The 2026-08-08 Grade 3 ingest lifted every Grade 3
     * scope past the DEFAULT 10 — this previously used icas-g3-numeracy at
     * 7 — and promoting the 16 pilot language items then took Grade 3 ICAS
     * language past 30 as well.
     *
     * Year 5 ICAS reading is the remaining fit and is untouched by a Grade
     * 3 ingest: 18 gated against 52 in the seed pool, so asking for 30 is
     * short on gated content while the opt-in genuinely would cover it —
     * which is the case this message exists for.
     */
    await user.selectOptions(screen.getByTestId("select-question-count"), "30");
    const message = screen.getByTestId("insufficient-message");
    expect(message).toHaveTextContent(/fewer than the 30 requested/i);
    expect(message).toHaveTextContent(/have not been reviewed/i);
  });
});
