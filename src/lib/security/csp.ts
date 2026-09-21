/**
 * Builds the report-only Content-Security-Policy value for a single request.
 * `nonce` must be a fresh, per-request random value — see src/proxy.ts.
 *
 * Allowlist rationale:
 * - fonts.googleapis.com/gstatic.com: next/font self-hosts at build time, but
 *   these are kept as a safety net for any future runtime Google Fonts use.
 * - *.supabase.co (https + wss): API calls and the realtime session channel.
 * - Stripe origins: hosted Checkout, Elements iframes, and 3DS challenge
 *   frames (m.stripe.network).
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://m.stripe.network`,
    `frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com`,
    `img-src 'self' data: blob: https://*.supabase.co`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ];

  return directives.join("; ");
}
