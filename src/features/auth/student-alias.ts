/**
 * Pure helpers for the parent-provisioned student login model (see D1: no
 * schema change to `profiles`/RLS). A student never has a real email — they
 * sign in with a short login code plus a PIN. The code doubles as the local
 * part of a non-guessable internal alias email
 * (`childcode+<code>@students.mindmosaic.internal`), so the alias email can
 * always be *reconstructed* deterministically from the code alone. That is
 * what lets sign-in work with zero new persisted lookup table: no code→email
 * mapping is stored anywhere, the code *is* the mapping.
 *
 * Framework-free and safe to import from both server (provisioning) and
 * client (student sign-in form) code — it never touches the service-role key.
 */

// Crockford-style alphabet minus visually ambiguous characters (0/O, 1/I/L)
// so a child can read a code off a card without misreading it.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;
const ALIAS_LOCAL_PREFIX = "childcode+";
const ALIAS_DOMAIN = "students.mindmosaic.internal";

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/** Generates a fresh, high-entropy (40-bit) login code, unformatted (e.g. "K7XJ2P9R"). */
export function generateLoginCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (const byte of bytes) {
    code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return code;
}

/** Formats a raw code for display/handoff to a parent, e.g. "K7XJ-2P9R". */
export function formatLoginCode(code: string): string {
  const normalized = normalizeLoginCode(code);
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
}

/** Strips formatting/whitespace and upper-cases so entry is forgiving of hyphens/case/spaces. */
export function normalizeLoginCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Generates a random 6-digit PIN (meets Supabase's `minimum_password_length = 6`). */
export function generatePin(): string {
  const bytes = randomBytes(6);
  let pin = "";
  for (const byte of bytes) {
    pin += (byte % 10).toString();
  }
  return pin;
}

/** A PIN doubles as the account password, so it must be exactly 6 digits to satisfy Supabase's `minimum_password_length = 6`. */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/** Deterministically reconstructs the internal alias email from a login code. */
export function buildAliasEmail(rawCode: string): string {
  const normalized = normalizeLoginCode(rawCode);
  return `${ALIAS_LOCAL_PREFIX}${normalized.toLowerCase()}@${ALIAS_DOMAIN}`;
}
