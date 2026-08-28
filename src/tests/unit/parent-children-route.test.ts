import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Route-level negative-path coverage for POST /api/parent/children. The
 * auth/role logic itself already has dedicated unit coverage against
 * provisionChild directly (src/tests/unit/provision-child.test.ts); this
 * file instead proves the Route Handler wrapper (src/app/api/parent/children/route.ts)
 * turns each of those outcomes into the right HTTP status, plus its own
 * malformed-body / cross-site-Origin checks that provisionChild never sees.
 */
const mockProvisionChild = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/provision-child", () => ({
  provisionChild: mockProvisionChild,
}));

import { POST } from "@/app/api/parent/children/route";

function childRequest(
  body: unknown = { displayName: "Ada" },
  headers: Record<string, string> = {
    "content-type": "application/json",
    origin: "http://localhost",
    host: "localhost",
  },
): Request {
  return new Request("http://localhost/api/parent/children", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/parent/children — negative paths", () => {
  afterEach(() => {
    mockProvisionChild.mockReset();
  });

  it("rejects a cross-site Origin — MM-SEC-03 (before provisionChild ever runs)", async () => {
    const response = await POST(
      childRequest(
        { displayName: "Ada" },
        { "content-type": "application/json", origin: "https://evil.example", host: "localhost" },
      ),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_mismatch" });
    expect(mockProvisionChild).not.toHaveBeenCalled();
  });

  it("rejects a malformed body with 400 (before provisionChild ever runs)", async () => {
    const response = await POST(childRequest({ yearLevel: 7 }));

    expect(response.status).toBe(400);
    expect((await response.json()).ok).toBe(false);
    expect(mockProvisionChild).not.toHaveBeenCalled();
  });

  it("propagates provisionChild's unauthenticated rejection as a 4xx", async () => {
    mockProvisionChild.mockResolvedValue({ ok: false, message: "Sign in as a parent to add a child." });

    const response = await POST(childRequest());

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  it("propagates provisionChild's non-parent (student/teacher) rejection as a 4xx", async () => {
    mockProvisionChild.mockResolvedValue({ ok: false, message: "Only a parent account can add a child." });

    const response = await POST(childRequest());

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
  });

  /*
   * A name the parent already has isn't malformed input, it conflicts with
   * something they already own — and it's answered by confirming and
   * retrying, not by fixing the request. 409, not 400.
   */
  it("returns 409 for a duplicate name, and passes the confirmation through on retry", async () => {
    mockProvisionChild.mockResolvedValue({
      ok: false,
      duplicate: true,
      message: "You already have a child called Child A. Add another one anyway?",
    });

    const response = await POST(childRequest({ displayName: "Child A" }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ ok: false, duplicate: true });

    mockProvisionChild.mockResolvedValue({ ok: true, loginCode: "K7XJ-2P9R", pin: "123456" });
    const retry = await POST(childRequest({ displayName: "Child A", allowDuplicate: true }));

    expect(retry.status).toBe(200);
    expect(mockProvisionChild).toHaveBeenLastCalledWith(
      expect.objectContaining({ allowDuplicate: true }),
    );
  });

  it("returns 200 with credentials on success", async () => {
    mockProvisionChild.mockResolvedValue({ ok: true, loginCode: "K7XJ-2P9R", pin: "123456" });

    const response = await POST(childRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, loginCode: "K7XJ-2P9R", pin: "123456" });
  });

  it("forwards an optional curriculum preference as a complete pair", async () => {
    mockProvisionChild.mockResolvedValue({ ok: true, loginCode: "K7XJ-2P9R", pin: "123456" });

    const response = await POST(
      childRequest({
        displayName: "Ada",
        yearLevel: 7,
        curriculumPreference: { jurisdictionCode: "VIC", schoolSector: "government" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockProvisionChild).toHaveBeenCalledWith({
      displayName: "Ada",
      yearLevel: 7,
      curriculumPreference: { jurisdictionCode: "VIC", schoolSector: "government" },
    });
  });

  it("rejects incomplete or unknown curriculum preferences before provisioning", async () => {
    for (const curriculumPreference of [
      { jurisdictionCode: "VIC" },
      { jurisdictionCode: "XX", schoolSector: "government" },
      { jurisdictionCode: "VIC", schoolSector: "home" },
    ]) {
      const response = await POST(childRequest({ displayName: "Ada", curriculumPreference }));
      expect(response.status).toBe(400);
    }
    expect(mockProvisionChild).not.toHaveBeenCalled();
  });
});
