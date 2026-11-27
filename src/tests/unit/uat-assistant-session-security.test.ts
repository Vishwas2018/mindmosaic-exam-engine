import { describe, expect, it } from "vitest";

import {
  COOKIE_TTL_SECONDS,
  signTesterBadgeToken,
  verifyTesterBadgeToken,
} from "@/features/uat-assistant/server/uat-access";
import { adminMfaOutcome as checkUatAdminMfa, classifyGrantLookup as classifyUatGrantLookup } from "@/features/auth/admin-grants";
import { resolveEntitledRoles, type AdminGrantRow as UatGrantRow } from "@/features/auth/roles";
import { resolveUatAdminStanding, revalidateTesterSubject } from "@/features/uat-assistant/server/uat-entitlement";
import type { UatIssue } from "@/features/uat-assistant/types";
import { uatScreenshotSchema } from "@/features/uat-assistant/types";
import { parseImportBundle, serializeExportBundle } from "@/features/uat-assistant/utils/exporters";
import {
  sanitizeIssueRecord,
  sanitizeScreenshotField,
} from "@/features/uat-assistant/utils/screenshot-sanitize";

const ENV = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
  MM_UAT_SESSION_SECRET: "unit-test-uat-signing-secret-0123456789",
};

describe("UAT session cookie lifecycle", () => {
  const now = 1_795_000_000_000;

  it("lives for a working shift (4h), not a day", () => {
    expect(COOKIE_TTL_SECONDS).toBe(4 * 60 * 60);
    const token = signTesterBadgeToken("subject", ENV, now)!;
    expect(verifyTesterBadgeToken(token, ENV, now + 3.9 * 3600 * 1000)?.sub).toBe("subject");
    expect(verifyTesterBadgeToken(token, ENV, now + 4 * 3600 * 1000 + 2000)).toBeNull();
  });

  it("carries a unique session id per mint", () => {
    const a = verifyTesterBadgeToken(signTesterBadgeToken("subject", ENV, now)!, ENV, now);
    const b = verifyTesterBadgeToken(signTesterBadgeToken("subject", ENV, now)!, ENV, now);
    expect(a?.sid).toBeTruthy();
    expect(a?.sid).not.toBe(b?.sid);
  });

  it("is invalidated for everyone by rotating MM_UAT_SESSION_EPOCH", () => {
    const token = signTesterBadgeToken("subject", { ...ENV, MM_UAT_SESSION_EPOCH: "1" }, now)!;
    expect(verifyTesterBadgeToken(token, { ...ENV, MM_UAT_SESSION_EPOCH: "1" }, now)?.sub).toBe("subject");
    expect(verifyTesterBadgeToken(token, { ...ENV, MM_UAT_SESSION_EPOCH: "2" }, now)).toBeNull();
    expect(verifyTesterBadgeToken(token, ENV, now)).toBeNull();
  });

  it("rejects a token missing sid/epoch (legacy 12h cookies are not honoured)", () => {
    const legacyPayload = Buffer.from(
      JSON.stringify({ sub: "subject", bind: "mfglzabnayacssgertat.supabase.co", exp: Math.floor(now / 1000) + 600 }),
    ).toString("base64url");
    expect(verifyTesterBadgeToken(`${legacyPayload}.sig`, ENV, now)).toBeNull();
  });
});

describe("UAT admin standing follows the multi-role entitlement model (PR #165)", () => {
  const active: UatGrantRow = { role: "admin", revoked_at: null };
  const revoked: UatGrantRow = { role: "admin", revoked_at: "2026-11-01T00:00:00Z" };

  it("an active admin grant is an administrator and the MFA switch applies", () => {
    expect(resolveUatAdminStanding("parent", [active], false)).toEqual({ kind: "admin", mfaApplies: true });
    expect(resolveUatAdminStanding("admin", [active], false)).toEqual({ kind: "admin", mfaApplies: true });
  });

  it("profile.role = admin WITHOUT a grant is not an administrator once the migration exists (no legacy promotion)", () => {
    expect(resolveUatAdminStanding("admin", [], false)).toEqual({ kind: "not_admin" });
  });

  it("a revoked grant removes admin even when the profile still says admin", () => {
    expect(resolveUatAdminStanding("admin", [revoked], false)).toEqual({ kind: "not_admin" });
  });

  it("access-revoked accounts are never administrators", () => {
    expect(resolveUatAdminStanding("admin", [active], true)).toEqual({ kind: "not_admin" });
  });

  it("pre-migration (table missing) keeps the legacy profile rule, with no MFA switch to honour", () => {
    expect(resolveUatAdminStanding("admin", "missing", false)).toEqual({ kind: "admin", mfaApplies: false });
    expect(resolveUatAdminStanding("parent", "missing", false)).toEqual({ kind: "not_admin" });
  });

  it("an unexpected lookup failure is 'unknown' (callers fail closed), never legacy admin", () => {
    expect(resolveUatAdminStanding("admin", "error", false)).toEqual({ kind: "unknown" });
    expect(resolveUatAdminStanding("parent", "error", false)).toEqual({ kind: "unknown" });
  });

  it("only 42P01 / PGRST205 mean 'migration not applied'", () => {
    expect(classifyUatGrantLookup(null, { code: "42P01" })).toBe("missing");
    expect(classifyUatGrantLookup(null, { code: "PGRST205" })).toBe("missing");
    for (const code of ["57014", "42501", "PGRST301", undefined]) {
      expect(classifyUatGrantLookup(null, { code })).toBe("error");
    }
    expect(classifyUatGrantLookup([active], null)).toEqual([active]);
  });
});

describe("UAT never bypasses Admin MFA", () => {
  function fakeSupabase(opts: {
    required?: unknown;
    rpcError?: boolean;
    rpcThrows?: boolean;
    aal?: string;
    aalThrows?: boolean;
  }) {
    return {
      rpc: async () => {
        if (opts.rpcThrows) throw new Error("boom");
        return opts.rpcError ? { data: null, error: { code: "XX000" } } : { data: opts.required, error: null };
      },
      auth: {
        mfa: {
          getAuthenticatorAssuranceLevel: async () => {
            if (opts.aalThrows) throw new Error("boom");
            return { data: { currentLevel: opts.aal } };
          },
        },
      },
    } as never;
  }

  it("is satisfied when the switch is off", async () => {
    expect(await checkUatAdminMfa(fakeSupabase({ required: false, aal: "aal1" }))).toBe("ok");
  });

  it("requires aal2 when the switch is on", async () => {
    expect(await checkUatAdminMfa(fakeSupabase({ required: true, aal: "aal1" }))).toBe("step_up");
    expect(await checkUatAdminMfa(fakeSupabase({ required: true, aal: "aal2" }))).toBe("ok");
  });

  it("fails closed when the switch cannot be read or aal cannot be proven", async () => {
    expect(await checkUatAdminMfa(fakeSupabase({ rpcError: true }))).toBe("deny");
    expect(await checkUatAdminMfa(fakeSupabase({ rpcThrows: true }))).toBe("deny");
    expect(await checkUatAdminMfa(fakeSupabase({ required: true, aalThrows: true }))).toBe("step_up");
  });
});

describe("UAT cookie revocation re-validates the minting subject", () => {
  function fakeService(opts: {
    profile?: { role: string; access_revoked_at: string | null } | null;
    profileError?: boolean;
    grants?: UatGrantRow[];
    grantsError?: { code: string };
    email?: string;
  }) {
    return {
      from: (table: string) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () =>
                  opts.profileError ? { data: null, error: { code: "XX000" } } : { data: opts.profile ?? null, error: null },
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: async () =>
              opts.grantsError ? { data: null, error: opts.grantsError } : { data: opts.grants ?? [], error: null },
          }),
        };
      },
      auth: { admin: { getUserById: async () => ({ data: { user: { email: opts.email } }, error: null }) } },
    } as never;
  }

  const none = { ids: new Set<string>(), emails: new Set<string>() };
  const active: UatGrantRow = { role: "admin", revoked_at: null };

  it("accepts a still-active administrator", async () => {
    const res = await revalidateTesterSubject(
      fakeService({ profile: { role: "parent", access_revoked_at: null }, grants: [active] }),
      "u1",
      none,
    );
    expect(res).toEqual({ ok: true });
  });

  it("refuses once the administrator is revoked (grant revoked, profile still 'admin')", async () => {
    const res = await revalidateTesterSubject(
      fakeService({
        profile: { role: "admin", access_revoked_at: null },
        grants: [{ role: "admin", revoked_at: "2026-11-26T00:00:00Z" }],
      }),
      "u1",
      none,
    );
    expect(res).toEqual({ ok: false, reason: "entitlement_revoked" });
  });

  it("refuses an access-revoked account and a vanished profile", async () => {
    expect(
      await revalidateTesterSubject(
        fakeService({ profile: { role: "admin", access_revoked_at: "2026-11-26T00:00:00Z" }, grants: [active] }),
        "u1",
        none,
      ),
    ).toEqual({ ok: false, reason: "access_revoked" });
    expect(await revalidateTesterSubject(fakeService({ profile: null }), "u1", none)).toEqual({
      ok: false,
      reason: "access_revoked",
    });
  });

  it("fails closed on unexpected database errors", async () => {
    expect(await revalidateTesterSubject(fakeService({ profileError: true }), "u1", none)).toEqual({
      ok: false,
      reason: "lookup_failed",
    });
    expect(
      await revalidateTesterSubject(
        fakeService({ profile: { role: "admin", access_revoked_at: null }, grantsError: { code: "57014" } }),
        "u1",
        none,
      ),
    ).toEqual({ ok: false, reason: "lookup_failed" });
  });

  it("keeps pre-migration compatibility (table missing => legacy profile rule)", async () => {
    const res = await revalidateTesterSubject(
      fakeService({ profile: { role: "admin", access_revoked_at: null }, grantsError: { code: "42P01" } }),
      "u1",
      none,
    );
    expect(res).toEqual({ ok: true });
  });

  it("an allowlisted non-admin tester stays valid by id or email; a removed one does not", async () => {
    const service = fakeService({ profile: { role: "parent", access_revoked_at: null }, email: "t@example.test" });
    expect(await revalidateTesterSubject(service, "u2", { ids: new Set(["u2"]), emails: new Set() })).toEqual({ ok: true });
    expect(await revalidateTesterSubject(service, "u2", { ids: new Set(), emails: new Set(["t@example.test"]) })).toEqual({
      ok: true,
    });
    expect(await revalidateTesterSubject(service, "u2", none)).toEqual({ ok: false, reason: "entitlement_revoked" });
  });
});

describe("screenshot redaction leaves no recoverable pixels in retained data", () => {
  const RAW = "data:image/png;base64,UkFXLVNFTlNJVElWRS1QSVhFTFM=";
  const MASKED = "data:image/png;base64,TUFTS0VELUlNQUdF";

  function legacyScreenshot(overrides: Record<string, unknown> = {}) {
    return {
      rawDataUrl: RAW,
      annotatedDataUrl: MASKED,
      width: 100,
      height: 60,
      capturedAt: "2026-11-26T02:00:00.000Z",
      source: "upload",
      annotations: [{ id: "r1", kind: "redact", color: "#18151f", points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }] }],
      ...overrides,
    };
  }

  function makeIssue(screenshot: unknown): UatIssue {
    return {
      id: "UAT-1",
      status: "open",
      title: "Redaction check",
      originalNotes: "n",
      description: "d",
      stepsToReproduce: ["s"],
      actualResult: "a",
      expectedResult: "e",
      severity: "low",
      category: "other",
      inputMethod: "text",
      element: null,
      environment: {
        browser: "Chrome",
        viewport: { width: 800, height: 600, devicePixelRatio: 1 },
        timestamp: "2026-11-26T02:00:00.000Z",
        route: "/",
        pageUrl: "http://localhost:3000/",
        portal: "public",
        testSessionId: "UAT-S",
        testSessionLabel: "S",
        activeRole: "guest",
      },
      aiDraft: null,
      screenshot,
      githubIssue: null,
      createdAt: "2026-11-26T02:00:00.000Z",
      updatedAt: "2026-11-26T02:00:00.000Z",
    } as unknown as UatIssue;
  }

  it("the schema has no field for an unredacted source frame and strips a legacy one", () => {
    const parsed = uatScreenshotSchema.parse(legacyScreenshot());
    expect(Object.keys(parsed)).not.toContain("rawDataUrl");
    expect(JSON.stringify(parsed)).not.toContain(RAW);
  });

  it("sanitizer drops rawDataUrl and keeps the already-masked image", () => {
    const result = sanitizeScreenshotField(legacyScreenshot());
    expect(result.changed).toBe(true);
    expect(JSON.stringify(result.value)).not.toContain(RAW);
    expect((result.value as { annotatedDataUrl: string }).annotatedDataUrl).toBe(MASKED);
    expect((result.value as { redactionCount: number }).redactionCount).toBe(1);
  });

  it("discards the whole screenshot when a redaction was requested but never rendered into the image", () => {
    const result = sanitizeScreenshotField(legacyScreenshot({ annotatedDataUrl: RAW }));
    expect(result.value).toBeNull();
  });

  it("is idempotent and leaves modern records untouched", () => {
    const once = sanitizeIssueRecord(makeIssue(legacyScreenshot()));
    const twice = sanitizeIssueRecord(once.value);
    expect(twice.changed).toBe(false);
  });

  it("JSON export never contains the legacy raw frame", () => {
    const json = serializeExportBundle([makeIssue(legacyScreenshot())]);
    expect(json).not.toContain("rawDataUrl");
    expect(json).not.toContain(RAW);
    expect(json).toContain(MASKED);
  });

  it("JSON import drops a legacy raw frame instead of re-importing it", () => {
    const bundle = JSON.stringify({
      schemaVersion: 1,
      product: "MindMosaic UAT Assistant",
      exportedAt: "2026-11-26T03:00:00.000Z",
      issueCount: 1,
      issues: [makeIssue(legacyScreenshot())],
    });
    const parsed = parseImportBundle(bundle);
    expect(parsed.ok ? "ok" : parsed.message).toBe("ok");
    if (parsed.ok) {
      const text = JSON.stringify(parsed.bundle);
      expect(text).not.toContain("rawDataUrl");
      expect(text).not.toContain(RAW);
    }
  });
});

describe("UAT admin standing agrees with the shared role gate (PR #165)", () => {
  const active: UatGrantRow = { role: "admin", revoked_at: null };
  const revoked: UatGrantRow = { role: "admin", revoked_at: "2026-11-01T00:00:00Z" };
  const lookups = [[active], [revoked], [], "missing", "error"] as const;
  const primaries = ["parent", "admin", "teacher", "student", null] as const;

  it("is admin exactly when resolveEntitledRoles says admin, for every primary role and lookup outcome", () => {
    for (const primary of primaries) {
      for (const grants of lookups) {
        const shared = resolveEntitledRoles(primary, grants).includes("admin");
        const standing = resolveUatAdminStanding(primary, grants, false);
        if (grants === "error") expect(standing.kind).toBe("unknown");
        else expect(standing.kind === "admin").toBe(shared);
      }
    }
  });
});
