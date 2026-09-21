import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

describe("Task 2 — static security headers and CSP", () => {
  it("nextConfig emits the required static security headers", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.headers).toBeDefined();

    if (nextConfig.headers) {
      const headerRules = await nextConfig.headers();
      const catchAllRule = headerRules.find((rule) => rule.source === "/:path*");
      expect(catchAllRule).toBeDefined();

      const headers = catchAllRule?.headers ?? [];
      const headerMap = new Map(headers.map((h) => [h.key, h.value]));

      expect(headerMap.get("Strict-Transport-Security")).toContain("max-age=63072000");
      expect(headerMap.get("Strict-Transport-Security")).toContain("includeSubDomains");
      expect(headerMap.get("Strict-Transport-Security")).not.toContain("preload");
      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headerMap.get("Permissions-Policy")).toBeDefined();
      expect(headerMap.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    }
  });

  it("buildContentSecurityPolicy generates correct nonce-based CSP directives", () => {
    const nonce = "test-nonce-12345";
    const csp = buildContentSecurityPolicy(nonce);

    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("font-src 'self' https://fonts.gstatic.com data:");
    expect(csp).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://m.stripe.network");
    expect(csp).toContain("frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com");
    expect(csp).toContain("img-src 'self' data: blob: https://*.supabase.co");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });
});
