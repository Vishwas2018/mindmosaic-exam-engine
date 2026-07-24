import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { checkOrigin } from "@/features/auth/require-origin";

function request(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/whatever", {
    method: "POST",
    headers,
  });
}

describe("checkOrigin (MM-SEC-03 canonical Origin enforcement)", () => {
  it("passes and returns the origin when it matches the request's own Host header", () => {
    const result = checkOrigin(
      request({ origin: "http://localhost", host: "localhost" }),
    );

    expect(result).toEqual({ ok: true, origin: "http://localhost" });
  });

  it("passes when the origin's host includes a port that matches Host", () => {
    const result = checkOrigin(
      request({ origin: "http://localhost:3000", host: "localhost:3000" }),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a mismatched origin (cross-site caller)", async () => {
    const result = checkOrigin(
      request({ origin: "https://evil.example", host: "localhost" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      expect(await result.response.json()).toEqual({ error: "origin_mismatch" });
    }
  });

  it("rejects a missing Origin header", async () => {
    const result = checkOrigin(request({ host: "localhost" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      expect(await result.response.json()).toEqual({ error: "origin_required" });
    }
  });

  it("rejects a missing Host header", async () => {
    const result = checkOrigin(request({ origin: "http://localhost" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(await result.response.json()).toEqual({ error: "origin_required" });
    }
  });

  it("rejects an unparsable Origin header", async () => {
    const result = checkOrigin(
      request({ origin: "not-a-url", host: "localhost" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(await result.response.json()).toEqual({ error: "origin_invalid" });
    }
  });
});
