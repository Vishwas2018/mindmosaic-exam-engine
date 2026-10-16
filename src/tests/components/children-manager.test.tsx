import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChildrenManager, type ChildListItem } from "@/features/parent-dashboard/components/ChildrenManager";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const CHILDREN: ChildListItem[] = [
  { id: "child-1", displayName: "Arjun", yearLevel: 5, sessionCount: 4 },
  { id: "child-2", displayName: "Priya", yearLevel: 3, sessionCount: 0 },
];

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("ChildrenManager", () => {
  it("lists every child with their grade and session count", () => {
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);
    const arjunCard = screen.getByText("Arjun").closest("div.rounded-3xl") as HTMLElement;
    expect(within(arjunCard).getByText("Grade 5")).toBeInTheDocument();
    expect(within(arjunCard).getByText("4 sessions")).toBeInTheDocument();

    const priyaCard = screen.getByText("Priya").closest("div.rounded-3xl") as HTMLElement;
    expect(within(priyaCard).getByText("0 sessions")).toBeInTheDocument();
  });

  it("renames a child through PATCH /api/parent/children/[id]", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Arjun R");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/parent/children/child-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ displayName: "Arjun R", yearLevel: 5 });
    expect(await screen.findByText("Arjun R")).toBeInTheDocument();
  });

  it("rejects a PIN that isn't exactly 6 digits without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    await user.type(screen.getByLabelText(/reset pin/i), "123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/pin must be exactly 6 digits/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("archives a child after confirming, and removes them from the list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: "Archive" })[0]);
    await user.click(screen.getByRole("button", { name: "Yes, archive" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/parent/children/child-1", { method: "DELETE" });
    expect(await screen.findByText("Priya")).toBeInTheDocument();
    expect(screen.queryByText("Arjun")).not.toBeInTheDocument();
  });

  it("shows a friendly error instead of crashing when the rename request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, message: "Could not update this child." }), { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not update this child/i);
  });

  it("deletes a child's data only after confirmation, through POST .../erase", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /delete my child/i })[0]);
    /* Opening the dialog must not delete anything. */
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Yes, delete everything" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/parent/children/child-1/erase");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ confirm: true });
    expect(await screen.findByText("Deletion scheduled")).toBeInTheDocument();
  });

  it("does nothing if the parent cancels the deletion dialog", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /delete my child/i })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Deletion scheduled")).not.toBeInTheDocument();
  });

  it("shows a scheduled child as locked, with no edit or delete actions", () => {
    render(
      <ChildrenManager
        availableYearLevels={[3, 5]}
        initialChildren={[{ ...CHILDREN[0], erasureScheduled: true }]}
      />,
    );

    expect(screen.getByText("Deletion scheduled")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete my child/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  it("keeps the error visible when scheduling deletion fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, message: "Could not schedule deletion." }), { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);

    await user.click(screen.getAllByRole("button", { name: /delete my child/i })[0]);
    await user.click(screen.getByRole("button", { name: "Yes, delete everything" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not schedule deletion/i);
    expect(screen.queryByText("Deletion scheduled")).not.toBeInTheDocument();
  });
});
