import { afterEach, describe, expect, it, vi } from "vitest";

import { submitNewPassword } from "@/features/auth/recovery-client";

/** How the browser reads the password endpoint's answers (the wording shown to the user is in the reset page). */
function answer(status: number, body: Record<string, unknown>) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("submitNewPassword result mapping", () => {
  it("an uncertain earlier attempt (503 update_uncertain) asks for a fresh link, not a retry", async () => {
    answer(503, { error: "update_uncertain" });
    expect(await submitNewPassword("Aa1!aaaaaaaa", "csrf")).toEqual({ ok: false, reason: "uncertain" });
  });

  it("a retired (lapsed) grant asks for a fresh link", async () => {
    answer(403, { error: "recovery_required", reason: "lapsed" });
    expect(await submitNewPassword("Aa1!aaaaaaaa", "csrf")).toEqual({ ok: false, reason: "uncertain" });
  });

  it("a spent or missing grant is the ordinary expired-link dead end", async () => {
    answer(403, { error: "recovery_required", reason: "spent" });
    expect(await submitNewPassword("Aa1!aaaaaaaa", "csrf")).toEqual({ ok: false, reason: "recovery_required" });
  });

  it("an unavailable claim store stays a plain retryable error", async () => {
    answer(503, { error: "recovery_unavailable" });
    expect(await submitNewPassword("Aa1!aaaaaaaa", "csrf")).toEqual({ ok: false, reason: "unavailable" });
  });

  it("success passes the sign-out signal through", async () => {
    answer(200, { ok: true, otherSessionsRevoked: true, grantSpent: true });
    expect(await submitNewPassword("Aa1!aaaaaaaa", "csrf")).toEqual({ ok: true, otherSessionsRevoked: true });
  });
});
