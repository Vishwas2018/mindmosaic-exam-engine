/**
 * Which social sign-in providers this deployment actually has configured.
 *
 * A social button for a provider that is not enabled in the Supabase project
 * is a dead affordance: it redirects the person into an error. Whether a
 * provider is enabled lives in the hosted project (Authentication > Sign In /
 * Providers), not in this repo, so the app cannot discover it at runtime
 * without a network call on every render. It is declared here instead, via
 * `NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS` (comma-separated, e.g. `google,apple`),
 * and defaults to NONE.
 *
 * Set it only after the provider is enabled in the project. `npm run
 * verify:signup-open` prints the live `external` provider map from
 * `/auth/v1/settings` for the same reason.
 */
export type SupportedOAuthProvider = "google" | "apple";

const SUPPORTED: readonly SupportedOAuthProvider[] = ["google", "apple"];

export function parseOAuthProviders(raw: string | undefined): SupportedOAuthProvider[] {
  if (!raw) return [];
  const wanted = new Set(
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
  return SUPPORTED.filter((provider) => wanted.has(provider));
}

/** Providers to render buttons for. Empty means: render no social controls at all. */
export function configuredOAuthProviders(): SupportedOAuthProvider[] {
  return parseOAuthProviders(process.env.NEXT_PUBLIC_AUTH_OAUTH_PROVIDERS);
}
