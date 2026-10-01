import type { NextConfig } from "next";

// CSP is handled per-request in src/proxy.ts (needs a per-request nonce);
// everything else that's static lives here.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), usb=(), payment=(self)",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  /*
   * Public/Plans.dc.html's URL: the nav label is "Plans", but the real
   * page — real pricing, real billing source of truth — has always
   * lived at /pricing (src/features/landing/content.ts's routes map).
   */
  async redirects() {
    return [
      { source: "/plans", destination: "/pricing", permanent: true },
      { source: "/methodology", destination: "/how-it-works", permanent: true },
    ];
  },
};

export default nextConfig;
