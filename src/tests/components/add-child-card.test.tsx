import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AddChildCard } from "@/features/parent-dashboard/components/AddChildCard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

function bodyOf(call: unknown[]): Record<string, unknown> {
  return JSON.parse((call[1] as RequestInit).body as string);
}

describe("AddChildCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function typeName(user: ReturnType<typeof userEvent.setup>, name: string) {
    render(<AddChildCard />);
    await user.type(screen.getByLabelText(/child's name/i), name);
  }

  it("creates the child and shows the credentials once", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ok: true, loginCode: "K7XJ-2P9R", pin: "123456" }),
    );

    await typeName(user, "Child B");
    await user.click(screen.getByRole("button", { name: /create login/i }));

    expect(await screen.findByText("K7XJ-2P9R")).toBeInTheDocument();
    expect(bodyOf(fetchMock.mock.calls[0])).toMatchObject({ displayName: "Child B" });
  });

  /*
   * The bug this guards: the parent dashboard ended up with two children
   * both called "Child A", both Grade 3, because nothing on either side
   * noticed the second submission. The server answers 409 with duplicate:
   * true, and the form turns that into a question rather than an error —
   * two children in one family really can share a first name.
   */
  it("asks for confirmation instead of erroring when the name is already used", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        ok: false,
        duplicate: true,
        message: "You already have a child called Child A. Add another one anyway?",
      }),
    );

    await typeName(user, "Child A");
    await user.click(screen.getByRole("button", { name: /create login/i }));

    expect(await screen.findByText(/already have a child called Child A/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add anyway/i })).toBeInTheDocument();
    // Nothing was created, and the typed name is still there to confirm.
    expect(screen.queryByText(/account created/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/child's name/i)).toHaveValue("Child A");
  });

  it("retries with allowDuplicate once the parent confirms", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(409, { ok: false, duplicate: true, message: "You already have a child called Child A." }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, loginCode: "K7XJ-2P9R", pin: "123456" }));

    await typeName(user, "Child A");
    await user.click(screen.getByRole("button", { name: /create login/i }));
    await user.click(await screen.findByRole("button", { name: /add anyway/i }));

    expect(await screen.findByText("K7XJ-2P9R")).toBeInTheDocument();
    expect(bodyOf(fetchMock.mock.calls[0]).allowDuplicate).toBeUndefined();
    expect(bodyOf(fetchMock.mock.calls[1]).allowDuplicate).toBe(true);
  });

  it("cancelling the prompt creates nothing and leaves the form intact", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse(409, { ok: false, duplicate: true, message: "You already have a child called Child A." }),
    );

    await typeName(user, "Child A");
    await user.click(screen.getByRole("button", { name: /create login/i }));
    await user.click(await screen.findByRole("button", { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /add anyway/i })).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/child's name/i)).toHaveValue("Child A");
  });

  /*
   * `submitting` state only takes effect on the next render, so two clicks
   * dispatched before React re-renders would both read the stale
   * `canSubmit` and both POST — and each POST creates a separate child
   * account. A ref flips synchronously inside the first handler.
   */
  it("fires one request even when the submit button is double-clicked", async () => {
    const user = userEvent.setup();
    let release: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
    );

    await typeName(user, "Child B");
    const submit = screen.getByRole("button", { name: /create login/i });
    await user.dblClick(submit);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    release(jsonResponse(200, { ok: true, loginCode: "K7XJ-2P9R", pin: "123456" }));
    expect(await screen.findByText("K7XJ-2P9R")).toBeInTheDocument();
  });

  it("shows a real error unchanged when something actually breaks", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      jsonResponse(400, { ok: false, message: "PIN must be exactly 6 digits." }),
    );

    await typeName(user, "Child B");
    await user.click(screen.getByRole("button", { name: /create login/i }));

    expect(await screen.findByText("PIN must be exactly 6 digits.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add anyway/i })).not.toBeInTheDocument();
  });
});
