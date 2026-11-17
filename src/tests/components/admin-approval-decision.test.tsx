import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const approve = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/review/actions", () => ({ approveDraft: approve }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

import { ApprovalDecision } from "@/features/admin/components/ApprovalDecision";

const HASH = "a".repeat(64);

function setup(existing?: { approvedBy: string; approvedAt: string }) {
  return render(
    <ApprovalDecision questionId="q-1" contentHash={HASH} reviewerName="Maya Chen" revisionLabel="revision abc1234" existing={existing} />,
  );
}

describe("Human approval decision", () => {
  beforeEach(() => approve.mockReset());

  it("records only an explicit approval, bound to the exact hash, after every check", async () => {
    approve.mockResolvedValue({ approvedAt: "2026-11-16T00:00:00.000Z", approvedBy: "reviewer-1" });
    const user = userEvent.setup();
    setup();

    const button = screen.getByRole("button", { name: "Approve revision abc1234" });
    expect(button).toBeDisabled();
    for (const box of screen.getAllByRole("checkbox")) await user.click(box);
    expect(button).toBeEnabled();
    await user.click(button);

    await waitFor(() => expect(approve).toHaveBeenCalledTimes(1));
    expect(approve).toHaveBeenCalledWith({
      questionId: "q-1",
      contentHash: HASH,
      checks: { correctness: true, originality: true, ageAppropriateness: true },
    });
    expect(await screen.findByText("Approval recorded")).toBeInTheDocument();
    expect(screen.getByText(/does not publish/i)).toBeInTheDocument();
  });

  it("offers no way to record request-changes or reject, and says why", () => {
    setup();
    expect(screen.getByRole("radio", { name: /Request changes/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Reject/ })).toBeDisabled();
    expect(screen.getAllByText(/nowhere to record this decision/i)).toHaveLength(2);
  });

  it("shows the server's refusal and never claims success", async () => {
    approve.mockResolvedValue({ error: "This draft revision has changed or is unavailable. Reload and review it again." });
    const user = userEvent.setup();
    setup();
    for (const box of screen.getAllByRole("checkbox")) await user.click(box);
    await user.click(screen.getByRole("button", { name: /^Approve/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("changed or is unavailable");
    expect(screen.queryByText("Approval recorded")).not.toBeInTheDocument();
  });

  it("shows an existing approval instead of the form", () => {
    setup({ approvedBy: "Ada", approvedAt: "2026-11-10T00:00:00.000Z" });
    expect(screen.getByText("Approval recorded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Approve/ })).not.toBeInTheDocument();
  });
});
