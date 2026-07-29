import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CheckoutStatusToast } from "@/features/parent-dashboard/components/CheckoutStatusToast";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function setUrl(path: string) {
  window.history.pushState(null, "", path);
}

describe("CheckoutStatusToast", () => {
  beforeEach(() => {
    setUrl("/parent");
  });

  afterEach(() => {
    refresh.mockReset();
    vi.useRealTimers();
  });

  it("renders nothing when there is no checkout query param", () => {
    render(<CheckoutStatusToast />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a success banner and strips the query param for ?checkout=success", () => {
    setUrl("/parent?checkout=success");
    render(<CheckoutStatusToast />);
    expect(screen.getByRole("status")).toHaveTextContent(/payment received/i);
    expect(window.location.search).toBe("");
  });

  it("shows a cancelled banner for ?checkout=cancelled", () => {
    setUrl("/parent?checkout=cancelled");
    render(<CheckoutStatusToast />);
    expect(screen.getByRole("status")).toHaveTextContent(/checkout was cancelled/i);
  });

  it("refreshes the router once, after a delay, following a successful checkout", () => {
    vi.useFakeTimers();
    setUrl("/parent?checkout=success");
    render(<CheckoutStatusToast />);

    expect(refresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2500);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("preserves other query params when stripping checkout", () => {
    setUrl("/parent?foo=bar&checkout=success");
    render(<CheckoutStatusToast />);
    expect(window.location.search).toBe("?foo=bar");
  });
});
