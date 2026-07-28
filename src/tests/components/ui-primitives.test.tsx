import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  PermissionDenied,
  Skeleton,
  SkeletonText,
  UpgradeRequired,
  WidgetError,
  WidgetErrorBoundary,
} from "@/components/ui";

describe("Skeleton", () => {
  it("renders an aria-hidden placeholder block", () => {
    render(<Skeleton data-testid="skel" className="h-10 w-10" />);
    const skeleton = screen.getByTestId("skel");
    expect(skeleton).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkeletonText", () => {
  it("renders the requested number of placeholder lines under a status role", () => {
    render(<SkeletonText lines={4} label="Loading assignments" />);
    const status = screen.getByRole("status", { name: "Loading assignments" });
    expect(status.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
  });
});

describe("PermissionDenied", () => {
  it("announces the denial as an alert with the supplied description and action", () => {
    render(
      <PermissionDenied
        description="Ask a teacher to grant access."
        action={<button type="button">Request access</button>}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("You don't have access");
    expect(alert).toHaveTextContent("Ask a teacher to grant access.");
    expect(screen.getByRole("button", { name: "Request access" })).toBeInTheDocument();
  });
});

describe("UpgradeRequired", () => {
  it("shows the plan name and upgrade action", () => {
    render(
      <UpgradeRequired
        description="Unlock unlimited practice exams."
        planName="Family Plan"
        action={<button type="button">Upgrade now</button>}
      />,
    );
    expect(screen.getByText("Unlock unlimited practice exams.")).toBeInTheDocument();
    expect(screen.getByText("Family Plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade now" })).toBeInTheDocument();
  });
});

describe("WidgetError", () => {
  it("calls onRetry when the retry action is activated", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<WidgetError description="The chart failed to load." onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("The chart failed to load.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("WidgetErrorBoundary", () => {
  function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error("boom");
    return <p>safe content</p>;
  }

  function Harness({ onError }: { onError: (error: unknown) => void }) {
    const [shouldThrow, setShouldThrow] = useState(true);
    return (
      <div>
        <button type="button" onClick={() => setShouldThrow(false)}>
          fix upstream data
        </button>
        <WidgetErrorBoundary onError={onError}>
          <Bomb shouldThrow={shouldThrow} />
        </WidgetErrorBoundary>
      </div>
    );
  }

  it("catches a render error, reports it, and recovers once retried after the cause is fixed", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Harness onError={onError} />);
    expect(screen.getByRole("alert")).toHaveTextContent("This widget couldn't load");
    expect(onError).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "fix upstream data" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByText("safe content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    consoleError.mockRestore();
  });
});
