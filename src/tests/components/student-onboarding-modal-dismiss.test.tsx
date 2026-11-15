import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

import { StudentOnboardingModal } from "@/features/student/components/onboarding/StudentOnboardingModal";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

describe("StudentOnboardingModal welcome", () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => useOnboardingStore.getState().reset());
  });
  afterEach(() => {
    act(() => useOnboardingStore.getState().reset());
  });

  const mount = () =>
    render(<StudentOnboardingModal firstName="Ava" yearLevel={3} onboardingCompleted={false} studentId="child-1" />);

  it("opens for a child who has not onboarded", () => {
    mount();
    expect(useOnboardingStore.getState().isOpen).toBe(true);
  });

  it("does not reopen on the next visit once the child closed it", () => {
    const first = mount();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(useOnboardingStore.getState().isOpen).toBe(false);
    first.unmount();

    mount();
    expect(useOnboardingStore.getState().isOpen).toBe(false);
  });

  it("is per child: a sibling on the same browser still sees it", () => {
    window.localStorage.setItem("mm.onboarding.welcome-dismissed.child-1", "1");
    render(<StudentOnboardingModal firstName="Ben" yearLevel={5} onboardingCompleted={false} studentId="child-2" />);
    expect(useOnboardingStore.getState().isOpen).toBe(true);
  });
});
