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
  // The hero campaign photographs are served as AVIF where supported, WebP otherwise.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  /*
   * Three owner-approved route moves (public-pages Step 4): the old page
   * either moved to a new path (methodology, contact) or was replaced by
   * a nav label pointing straight at an existing route (plans). All three
   * are `permanent` so search engines and bookmarks transfer.
   */
  async redirects() {
    return [
      { source: "/methodology", destination: "/how-it-works", permanent: true },
      { source: "/plans", destination: "/pricing", permanent: true },
      { source: "/contact", destination: "/help#contact", permanent: true },
      { source: "/prototype/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
