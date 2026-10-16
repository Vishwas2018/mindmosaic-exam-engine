import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  })),
}));

import { POST } from "@/app/api/parent/children/[childId]/erase/route";
import { resetRateLimits } from "@/lib/security/rate-limit";

const CHILD = "11111111-2222-4333-8444-555555555555";

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost/api/parent/children/${CHILD}/erase`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      host: "localhost",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const context = (childId = CHILD) => ({ params: Promise.resolve({ childId }) });

describe("POST /api/parent/children/[childId]/erase", () => {
  beforeEach(() => {
    resetRateLimits();
    mockGetUser.mockReset();
    mockRpc.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: "parent-1" } } });
    mockRpc.mockResolvedValue({
      data: { requestId: "r-1", executeAfter: "2026-11-15T00:00:00Z", alreadyRequested: false },
      error: null,
    });
  });

  it("schedules erasure through parent_request_child_erasure with the caller's own session", async () => {
    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      executeAfter: "2026-11-15T00:00:00Z",
      alreadyRequested: false,
    });
    expect(mockRpc).toHaveBeenCalledWith("parent_request_child_erasure", { p_child: CHILD });
  });

  it("refuses without the explicit confirm flag, and never reaches the database", async () => {
    for (const body of [{}, { confirm: false }, { confirm: "yes" }, { confirm: true, extra: 1 }]) {
      const response = await POST(request(body), context());
      expect(response.status).toBe(400);
    }
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a cross-site origin", async () => {
    const response = await POST(request({ confirm: true }, { origin: "https://evil.example" }), context());

    expect(response.status).toBe(403);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects a non-uuid child id before calling the database", async () => {
    const response = await POST(request({ confirm: true }), context("not-a-uuid"));

    expect(response.status).toBe(404);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("requires a signed-in caller", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("answers 404 when the database says the child is not linked to this parent (MM251)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "MM251", message: "child not found" } });

    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(404);
  });

  it("answers 403 when the caller is not a parent (MM250)", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "MM250", message: "requires a parent caller" } });

    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(403);
  });

  it("is idempotent: a repeat request is reported as already requested", async () => {
    mockRpc.mockResolvedValue({
      data: { requestId: "r-1", executeAfter: "2026-11-15T00:00:00Z", alreadyRequested: true },
      error: null,
    });

    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(200);
    expect((await response.json()).alreadyRequested).toBe(true);
  });

  it("does not leak database error text on an unexpected failure", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "secret internals" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request({ confirm: true }), context());

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret internals");
    spy.mockRestore();
  });

  it("rate-limits repeated erase attempts per parent", async () => {
    let last = 200;
    for (let i = 0; i < 6; i += 1) {
      last = (await POST(request({ confirm: true }), context())).status;
    }
    expect(last).toBe(429);
  });
});
