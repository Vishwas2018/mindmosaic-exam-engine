import "server-only";

import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Signed practice-session tokens (defect A-01).
 *
 * `/api/practice/session/questions` selects an answer-stripped practice set and returns a token that binds the
 * exact question ids it delivered (and, for signed-in-only content, the user it delivered them to).
 * `/api/practice/check` only scores — and only discloses an answer for — a question id carried in a valid,
 * unexpired token. That removes the "post any question id, get its answer" oracle: answers are revealed only for
 * questions the server itself served in a live practice set, after the student submits an answer.
 *
 * Key: `PRACTICE_SESSION_SECRET` when set, otherwise an HKDF derivation of `SUPABASE_SERVICE_ROLE_KEY` (a server-only
 * secret already present on every deployment), domain-separated so the token key never equals the service key.
 * With neither present a deployed build fails closed; a local run uses a per-process random key.
 */

export const PRACTICE_TOKEN_TTL_SECONDS = 4 * 60 * 60;
export const PRACTICE_TOKEN_MAX_QUESTIONS = 50;

export interface PracticeTokenClaims {
  /** Question ids delivered in this practice set. */
  readonly ids: readonly string[];
  /** Expiry, seconds since epoch. */
  readonly exp: number;
  /** Bound user id; present when the set contains signed-in-only content. */
  readonly sub?: string;
}

let ephemeralKey: Buffer | undefined;

function isDeployed(env: NodeJS.ProcessEnv): boolean {
  return env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "production";
}

/** Returns the signing key, or null when a deployed build has no secret to derive one from (fail closed). */
export function practiceTokenKey(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  const explicit = env.PRACTICE_SESSION_SECRET?.trim();
  if (explicit) return Buffer.from(explicit, "utf8");
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    return Buffer.from(
      hkdfSync("sha256", serviceKey, "mindmosaic", "practice-session-token/v1", 32),
    );
  }
  if (isDeployed(env)) return null;
  ephemeralKey ??= randomBytes(32);
  return ephemeralKey;
}

function sign(payload: string, key: Buffer): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function issuePracticeToken(
  claims: { ids: readonly string[]; sub?: string },
  options: { now?: number; key?: Buffer | null } = {},
): string | null {
  const key = options.key === undefined ? practiceTokenKey() : options.key;
  if (!key) return null;
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const body: PracticeTokenClaims = {
    ids: claims.ids.slice(0, PRACTICE_TOKEN_MAX_QUESTIONS),
    exp: now + PRACTICE_TOKEN_TTL_SECONDS,
    ...(claims.sub ? { sub: claims.sub } : {}),
  };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export type PracticeTokenVerdict =
  | { ok: true; claims: PracticeTokenClaims }
  | { ok: false; reason: "missing" | "malformed" | "bad_signature" | "expired" | "unavailable" };

export function verifyPracticeToken(
  token: unknown,
  options: { now?: number; key?: Buffer | null } = {},
): PracticeTokenVerdict {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "missing" };
  if (token.length > 8192) return { ok: false, reason: "malformed" };
  const key = options.key === undefined ? practiceTokenKey() : options.key;
  if (!key) return { ok: false, reason: "unavailable" };

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload, key), "utf8");
  const given = Buffer.from(signature, "utf8");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "bad_signature" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "malformed" };
  const record = parsed as Record<string, unknown>;
  if (
    !Array.isArray(record.ids) ||
    !record.ids.every((id) => typeof id === "string") ||
    typeof record.exp !== "number" ||
    (record.sub !== undefined && typeof record.sub !== "string")
  ) {
    return { ok: false, reason: "malformed" };
  }

  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (record.exp <= now) return { ok: false, reason: "expired" };

  return {
    ok: true,
    claims: {
      ids: record.ids as string[],
      exp: record.exp,
      ...(typeof record.sub === "string" ? { sub: record.sub } : {}),
    },
  };
}
