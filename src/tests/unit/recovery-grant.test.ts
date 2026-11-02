import { createHmac } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  csrfMatches,
  inspectRecoveryGrant,
  issueRecoveryGrant,
  recoveryGrantConfigured,
  RECOVERY_GRANT_TTL_SECONDS,
  type RecoveryBinding,
} from "@/server/auth/recovery-grant";

const SECRET = "unit-test-recovery-secret-0123456789abcdef";
const OTHER_SECRET = "a-different-recovery-secret-0123456789abc";

const BINDING: RecoveryBinding = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
};
const NOW = Date.UTC(2026, 10, 2, 1, 0, 0);

let saved: string | undefined;
beforeEach(() => {
  saved = process.env.RECOVERY_GRANT_SECRET;
  process.env.RECOVERY_GRANT_SECRET = SECRET;
});
afterEach(() => {
  if (saved === undefined) delete process.env.RECOVERY_GRANT_SECRET;
  else process.env.RECOVERY_GRANT_SECRET = saved;
});

function issued(binding = BINDING, now = NOW) {
  const grant = issueRecoveryGrant(binding, now);
  if (!grant.ok) throw new Error("expected a grant");
  return grant;
}

/** Re-signs an arbitrary payload with the real secret: what an attacker WITH the secret could do, to prove the fields are checked. */
function signed(payload: unknown, key = SECRET) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `v1.${body}.${createHmac("sha256", key).update(`v1.${body}`).digest().toString("base64url")}`;
}

describe("a valid grant", () => {
  it("validates for the exact user, session and user version it was issued for, and yields a CSRF token", () => {
    const grant = issued();
    const check = inspectRecoveryGrant(grant.cookieValue, BINDING, NOW + 1_000);
    expect(check).toEqual({ ok: true, csrfToken: grant.csrfToken, expiresAt: grant.expiresAt });
    expect(grant.expiresAt).toBe(Math.floor(NOW / 1000) + RECOVERY_GRANT_TTL_SECONDS);
  });

  it("is valid until, and not at, its expiry (15 minutes)", () => {
    const grant = issued();
    const last = NOW + (RECOVERY_GRANT_TTL_SECONDS - 1) * 1000;
    expect(inspectRecoveryGrant(grant.cookieValue, BINDING, last).ok).toBe(true);
    expect(inspectRecoveryGrant(grant.cookieValue, BINDING, NOW + RECOVERY_GRANT_TTL_SECONDS * 1000)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("does not contain the secret, and every grant has its own CSRF token", () => {
    const a = issued();
    const b = issued();
    expect(a.cookieValue).not.toContain(SECRET);
    expect(Buffer.from(a.cookieValue.split(".")[1]!, "base64url").toString()).not.toContain(SECRET);
    expect(a.csrfToken).not.toBe(b.csrfToken);
  });
});

describe("a grant that must be refused", () => {
  it("refuses a missing cookie", () => {
    expect(inspectRecoveryGrant(undefined, BINDING, NOW)).toEqual({ ok: false, reason: "missing" });
    expect(inspectRecoveryGrant("", BINDING, NOW)).toEqual({ ok: false, reason: "missing" });
  });

  it("refuses malformed values", () => {
    for (const value of ["x", "v1.a", "v1.a.b.c", "v2.a.b", "v1..sig", "v1.body.", "garbage.garbage.garbage"]) {
      const check = inspectRecoveryGrant(value, BINDING, NOW);
      expect(check.ok, value).toBe(false);
    }
  });

  it("refuses a forged signature", () => {
    const [v, body] = issued().cookieValue.split(".");
    const forged = `${v}.${body}.${Buffer.from("not-the-signature").toString("base64url")}`;
    expect(inspectRecoveryGrant(forged, BINDING, NOW)).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("refuses a payload edited after signing (the signature no longer covers it)", () => {
    const [v, body, sig] = issued().cookieValue.split(".");
    const edited = JSON.parse(Buffer.from(body!, "base64url").toString()) as Record<string, unknown>;
    edited.uid = "99999999-9999-4999-8999-999999999999";
    const tampered = `${v}.${Buffer.from(JSON.stringify(edited)).toString("base64url")}.${sig}`;
    expect(inspectRecoveryGrant(tampered, { ...BINDING, userId: String(edited.uid) }, NOW)).toEqual({
      ok: false,
      reason: "bad_signature",
    });
  });

  it("refuses a grant signed with another secret", () => {
    const grant = issued();
    process.env.RECOVERY_GRANT_SECRET = OTHER_SECRET;
    expect(inspectRecoveryGrant(grant.cookieValue, BINDING, NOW)).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("refuses a grant for another user or another session (a different live session is a different binding)", () => {
    const grant = issued();
    const cases: Array<[string, RecoveryBinding]> = [
      ["other user", { ...BINDING, userId: "33333333-3333-4333-8333-333333333333" }],
      ["other session", { ...BINDING, sessionId: "44444444-4444-4444-8444-444444444444" }],
    ];
    for (const [name, binding] of cases) {
      expect(inspectRecoveryGrant(grant.cookieValue, binding, NOW), name).toEqual({ ok: false, reason: "mismatch" });
    }
  });

  it("refuses correctly-signed payloads with missing or wrongly-typed fields", () => {
    const base = { v: 1, uid: BINDING.userId, sid: BINDING.sessionId, jti: "j", iat: 1, exp: 2_000_000_000 };
    for (const broken of [
      { ...base, v: 2 },
      { ...base, uid: 1 },
      { ...base, sid: undefined },
      { ...base, jti: undefined },
      { ...base, exp: "soon" },
    ]) {
      expect(inspectRecoveryGrant(signed(broken), BINDING, NOW)).toEqual({ ok: false, reason: "malformed" });
    }
    expect(inspectRecoveryGrant(signed(base), BINDING, NOW).ok).toBe(true);
  });

  it("refuses an expired payload even when it is correctly signed", () => {
    const old = { v: 1, uid: BINDING.userId, sid: BINDING.sessionId, jti: "j", iat: 1, exp: 100 };
    expect(inspectRecoveryGrant(signed(old), BINDING, NOW)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("fail closed without a usable secret", () => {
  it.each([undefined, "", "short"])("issues and validates nothing when the secret is %j", (value) => {
    const grant = issued(); // minted while configured
    if (value === undefined) delete process.env.RECOVERY_GRANT_SECRET;
    else process.env.RECOVERY_GRANT_SECRET = value;
    expect(recoveryGrantConfigured()).toBe(false);
    expect(issueRecoveryGrant(BINDING, NOW)).toEqual({ ok: false, reason: "not_configured" });
    expect(inspectRecoveryGrant(grant.cookieValue, BINDING, NOW)).toEqual({ ok: false, reason: "not_configured" });
  });
});

describe("CSRF token comparison", () => {
  it("accepts only the grant's own token", () => {
    const grant = issued();
    expect(csrfMatches(grant.csrfToken, grant.csrfToken)).toBe(true);
    expect(csrfMatches(issued().csrfToken, grant.csrfToken)).toBe(false);
    expect(csrfMatches(null, grant.csrfToken)).toBe(false);
    expect(csrfMatches("", grant.csrfToken)).toBe(false);
    expect(csrfMatches(grant.csrfToken.slice(1), grant.csrfToken)).toBe(false);
  });
});

describe("the signing secret and the recovery token stay in their places", () => {
  const ROOT = join(__dirname, "..", "..", "..");
  const list = (dir: string): string[] =>
    readdirSync(join(ROOT, dir)).flatMap((entry) => {
      const abs = join(ROOT, dir, entry);
      return statSync(abs).isDirectory() ? list(relative(ROOT, abs)) : /\.(ts|tsx)$/.test(entry) ? [relative(ROOT, abs).split("\\").join("/")] : [];
    });
  const code = (path: string) =>
    readFileSync(join(ROOT, path), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");

  it("RECOVERY_GRANT_SECRET is read by the grant module alone", () => {
    const offenders = list("src").filter(
      (path) =>
        !path.startsWith("src/tests/") &&
        path !== "src/server/auth/recovery-grant.ts" &&
        code(path).includes("RECOVERY_GRANT_SECRET"),
    );
    expect(offenders).toEqual([]);
  });

  it("no recovery code or page logs, and none writes the token to storage or analytics", () => {
    const files = [
      ...list("src/app/api/auth/recovery"),
      "src/server/auth/recovery-grant.ts",
      "src/server/auth/recovery-session.ts",
      "src/features/auth/recovery-client.ts",
      "src/app/auth/reset/page.tsx",
    ];
    for (const path of files) {
      const source = code(path);
      expect(source, `${path} must not log`).not.toMatch(/console\.(log|info|warn|error|debug|trace)/);
      expect(source, `${path} must not persist a token`).not.toMatch(/(localStorage|sessionStorage|document\.cookie)/);
      expect(source, `${path} must not report to analytics`).not.toMatch(/(gtag|dataLayer|posthog|plausible|va\.track|track\()/);
    }
  });
});
