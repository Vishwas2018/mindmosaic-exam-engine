/**
 * Full-page browser redirect, factored out of call sites so tests can mock
 * this module instead of fighting jsdom's non-navigable `window.location`.
 */
export function redirectTo(url: string): void {
  window.location.href = url;
}
