import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async (_request: NextRequest, headers: Headers) => NextResponse.next({ request: { headers } })),
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


describe("DEV-only auth CSP enforcement", () => {
  it("forwards the exact enforced policy to Next for dynamic auth routes", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("MM_DEV_AUTH_CSP_ENFORCE", "1");
    try {
      for (const path of ["/sign-in", "/auth/confirm", "/auth/forgot", "/auth/reset"]) {
        const response = await proxy(new NextRequest("https://preview.example.test" + path));
        const policy = response.headers.get("Content-Security-Policy");
        expect(policy).toContain("'strict-dynamic'");
        expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
        expect(response.headers.has("Content-Security-Policy-Report-Only")).toBe(false);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("retains report mode for static preview routes and outside DEV", async () => {
    vi.stubEnv("MM_DEV_AUTH_CSP_ENFORCE", "1");
    try {
      vi.stubEnv("VERCEL_ENV", "preview");
      const preview = await proxy(new NextRequest("https://preview.example.test/practice"));
      expect(preview.headers.has("Content-Security-Policy")).toBe(false);
      expect(preview.headers.has("Content-Security-Policy-Report-Only")).toBe(true);

      vi.stubEnv("VERCEL_ENV", "production");
      const simulated = await proxy(new NextRequest("https://example.test/sign-in"));
      expect(simulated.headers.has("Content-Security-Policy")).toBe(false);
      expect(simulated.headers.has("Content-Security-Policy-Report-Only")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("DEV-only admin CSP enforcement", () => {
  const adminPaths = ["/admin", "/admin/review", "/admin/questions/q-1/approval"];

  it("enforces the nonce policy on every /admin route in Preview and forwards it to Next", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    try {
      for (const path of adminPaths) {
        const response = await proxy(new NextRequest("https://preview.example.test" + path));
        const policy = response.headers.get("Content-Security-Policy");
        expect(policy).toContain("script-src 'self' 'nonce-");
        expect(policy).toContain("frame-ancestors 'none'");
        expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
        expect(response.headers.has("Content-Security-Policy-Report-Only")).toBe(false);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("enforces on loopback when no Vercel target is set", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    try {
      const response = await proxy(new NextRequest("http://localhost:3000/admin/review"));
      expect(response.headers.has("Content-Security-Policy")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("stays report-only in production and on non-admin or look-alike paths", async () => {
    try {
      vi.stubEnv("VERCEL_ENV", "production");
      const prod = await proxy(new NextRequest("https://example.test/admin/review"));
      expect(prod.headers.has("Content-Security-Policy")).toBe(false);
      expect(prod.headers.has("Content-Security-Policy-Report-Only")).toBe(true);

      vi.stubEnv("VERCEL_ENV", "preview");
      for (const path of ["/", "/parent", "/administrator", "/admin-tools", "/api/admin"]) {
        const response = await proxy(new NextRequest("https://preview.example.test" + path));
        expect(response.headers.has("Content-Security-Policy"), path).toBe(false);
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("honours the MM_ADMIN_CSP_ENFORCE=0 kill switch", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("MM_ADMIN_CSP_ENFORCE", "0");
    try {
      const response = await proxy(new NextRequest("https://preview.example.test/admin/review"));
      expect(response.headers.has("Content-Security-Policy")).toBe(false);
      expect(response.headers.has("Content-Security-Policy-Report-Only")).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("loopback Supabase connect-src", () => {
  it("allows only the configured loopback Supabase origin, and only on loopback", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:56321");
    try {
      vi.stubEnv("VERCEL_ENV", "");
      const local = await proxy(new NextRequest("http://127.0.0.1:3101/admin"));
      const connect = (local.headers.get("Content-Security-Policy") ?? "").split("; ").find((d) => d.startsWith("connect-src"));
      expect(connect).toContain("http://127.0.0.1:56321");
      expect(connect).toContain("ws://127.0.0.1:56321");
      expect(connect).not.toContain("unsafe");

      vi.stubEnv("VERCEL_ENV", "preview");
      const preview = await proxy(new NextRequest("https://preview.example.test/admin"));
      expect(preview.headers.get("Content-Security-Policy")).not.toMatch(/127\.0\.0\.1|localhost/);
      vi.stubEnv("VERCEL_ENV", "production");
      const prod = await proxy(new NextRequest("https://example.test/admin"));
      expect(prod.headers.get("Content-Security-Policy-Report-Only")).not.toMatch(/127\.0\.0\.1|localhost/);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("ignores a non-loopback NEXT_PUBLIC_SUPABASE_URL even on loopback", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://evil.example");
    vi.stubEnv("VERCEL_ENV", "");
    try {
      const r = await proxy(new NextRequest("http://localhost:3000/admin"));
      expect(r.headers.get("Content-Security-Policy")).not.toContain("evil.example");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
