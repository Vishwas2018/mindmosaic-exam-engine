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
  it("lists every child with their year, and Manage / Progress (artboard 11)", () => {
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={CHILDREN} />);
    const arjun = screen.getByRole("link", { name: /Arjun\s*Year 5/ });
    expect(arjun).toHaveAttribute("href", "/parent/children/child-1");
    expect(screen.getByRole("link", { name: "Manage Arjun" })).toHaveAttribute("href", "/parent/children/child-1");
    expect(screen.getByRole("link", { name: "Progress for Arjun" })).toHaveAttribute(
      "href",
      "/parent/children/child-1/progress",
    );
    expect(screen.getByRole("link", { name: /Priya\s*Year 3/ })).toBeInTheDocument();
    expect(screen.queryByText(/Grade/)).not.toBeInTheDocument();
    /* Rename, PIN reset and pausing live on the child's own page now (artboard 12). */
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add a child" })).toHaveAttribute("href", "/parent/setup");
  });

  it("renames a child through PATCH /api/parent/children/[id]", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={[{ ...CHILDREN[0]!, archived: true }]} />);

    await user.click(screen.getByRole("button", { name: /^edit arjun$/i }));
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
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={[{ ...CHILDREN[0]!, archived: true }]} />);

    await user.click(screen.getByRole("button", { name: /^edit arjun$/i }));
    await user.type(screen.getByLabelText(/reset pin/i), "123");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/pin must be exactly 6 digits/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists children that arrive already archived in their own section, with results kept and a Restore action", () => {
    render(
      <ChildrenManager
        availableYearLevels={[3, 5]}
        initialChildren={[{ ...CHILDREN[0]!, archived: true }, CHILDREN[1]!]}
      />,
    );
    const archived = screen.getByRole("region", { name: "Archived children" });
    expect(within(archived).getByText("Arjun")).toBeInTheDocument();
    expect(within(archived).getByText(/Year 5 · archived/)).toBeInTheDocument();
    expect(within(archived).getByRole("button", { name: /restore arjun/i })).toBeInTheDocument();
  });

  it("says so when every child is archived", () => {
    render(
      <ChildrenManager
        availableYearLevels={[3, 5]}
        initialChildren={CHILDREN.map((child) => ({ ...child, archived: true }))}
      />,
    );
    expect(screen.getByText(/no active children/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /restore/i })).toHaveLength(2);
  });

  it("restores an archived child through PATCH { archived: false } and returns them to the active list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(
      <ChildrenManager
        availableYearLevels={[3, 5]}
        initialChildren={[{ ...CHILDREN[0]!, archived: true }, CHILDREN[1]!]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /restore arjun/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/parent/children/child-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ archived: false });
    expect(await screen.findByRole("link", { name: "Manage Arjun" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Archived children" })).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps a child archived and shows an error when the restore request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, message: "Could not restore this child. Please try again." }), { status: 500 })),
    );

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={[{ ...CHILDREN[0]!, archived: true }]} />);

    await user.click(screen.getByRole("button", { name: /restore arjun/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not restore this child/i);
    expect(screen.getByRole("region", { name: "Archived children" })).toBeInTheDocument();
  });

  it("lets a parent edit (for example reset the PIN of) an archived child", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={[{ ...CHILDREN[0]!, archived: true }]} />);

    await user.click(screen.getByRole("button", { name: /^edit arjun$/i }));
    await user.type(screen.getByLabelText(/reset pin/i), "482916");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ pin: "482916" });
  });

  it("shows a friendly error instead of crashing when the rename request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false, message: "Could not update this child." }), { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    render(<ChildrenManager availableYearLevels={[3, 5]} initialChildren={[{ ...CHILDREN[0]!, archived: true }]} />);

    await user.click(screen.getByRole("button", { name: /^edit arjun$/i }));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not update this child/i);
  });
});
