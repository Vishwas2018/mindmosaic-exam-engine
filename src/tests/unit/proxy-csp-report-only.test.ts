import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async () => NextResponse.next()),
}));

import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { proxy } from "@/proxy";

/*
 * The CSP is nonce-based, and statically prerendered routes (the landing page, /exam, /practice/*, /results …) are
 * served without a nonce. Enforcing the header blocked every script on those pages and they never hydrated; it took
 * the public E2E suite from green to ~70 failures. These tests keep the header report-only until that is solved.
 */
describe("proxy CSP", () => {
  it("sends the policy report-only and does not enforce it", async () => {
    const response = await proxy(new NextRequest("https://mindmosaic.test/"));

    expect(response.headers.get("Content-Security-Policy-Report-Only")).toContain("script-src 'self' 'nonce-");
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("uses a fresh nonce for each request", async () => {
    const first = await proxy(new NextRequest("https://mindmosaic.test/"));
    const second = await proxy(new NextRequest("https://mindmosaic.test/"));

    expect(first.headers.get("Content-Security-Policy-Report-Only")).not.toBe(
      second.headers.get("Content-Security-Policy-Report-Only"),
    );
  });

  it("does not allow-list loopback hosts in the policy shipped to browsers", () => {
    const csp = buildContentSecurityPolicy("n");

    expect(csp).not.toMatch(/localhost|127\.0\.0\.1/);
  });
});
