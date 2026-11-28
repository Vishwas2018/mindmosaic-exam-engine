import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveWorkspaceContext } from "@/features/uat-assistant/utils/redaction";
import { formatIssueMarkdown } from "@/features/uat-assistant/utils/exporters";
import { uatEnvironmentContextSchema, type UatIssue } from "@/features/uat-assistant/types";

/**
 * Role vs workspace: a dual-role login has ONE primary role (parent), entitlements for two workspaces, and is in exactly
 * one workspace at a time. Reports must say which, and nothing the browser reports may ever grant access.
 */

describe("resolveWorkspaceContext: primary role, entitlement and the workspace the route belongs to", () => {
  const dual = ["parent", "admin"];

  it.each([
    ["/admin", "admin"],
    ["/admin/review", "admin"],
    ["/parent", "parent"],
    ["/parent/children", "parent"],
    ["/billing", "parent"],
    ["/student/learn", "student"],
    ["/exam", "student"],
    ["/teacher/marking", "teacher"],
  ] as const)("%s is the %s workspace", (path, workspace) => {
    const solo = workspace === "student" || workspace === "teacher";
    const ctx = resolveWorkspaceContext(path, solo ? workspace : "parent", solo ? [workspace] : dual);
    expect(ctx.activeWorkspace).toBe(workspace);
    expect(ctx.workspaceEntitled).toBe(true);
    expect(ctx.activeRole).toBe(workspace);
  });

  it("a dual-role login in Admin is recorded as admin while its primary role stays parent", () => {
    const ctx = resolveWorkspaceContext("/admin/review", "parent", dual);
    expect(ctx.portal).toBe("admin");
    expect(ctx.activeWorkspace).toBe("admin");
    expect(ctx.activeRole).toBe("admin");
  });

  it("the same login in Parent is recorded as parent", () => {
    expect(resolveWorkspaceContext("/parent", "parent", dual).activeRole).toBe("parent");
  });

  it("public and dev pages have no workspace and report the primary role", () => {
    for (const path of ["/pricing", "/", "/dev/uat"]) {
      const ctx = resolveWorkspaceContext(path, "parent", dual);
      expect(ctx.activeWorkspace).toBeNull();
      expect(ctx.activeRole).toBe("parent");
      expect(ctx.workspaceEntitled).toBe(true);
    }
  });

  it("a route outside the account's entitlements is flagged, and never relabelled as that workspace's role", () => {
    const ctx = resolveWorkspaceContext("/admin", "parent", ["parent"]);
    expect(ctx.activeWorkspace).toBe("admin");
    expect(ctx.workspaceEntitled).toBe(false);
    expect(ctx.activeRole).toBe("parent");
  });
});

describe("report context is carried through the schema and the markdown export", () => {
  const base = {
    browser: "Chrome",
    viewport: { width: 800, height: 600, devicePixelRatio: 1 },
    timestamp: "2026-11-27T02:00:00.000Z",
    route: "/admin/review",
    pageUrl: "http://localhost/admin/review",
    portal: "admin",
    testSessionId: "UAT-S",
    testSessionLabel: "S",
    activeRole: "admin",
  } as const;

  it("older records without the new fields still parse", () => {
    expect(uatEnvironmentContextSchema.safeParse(base).success).toBe(true);
  });

  it("new fields parse and appear in the export", () => {
    const env = uatEnvironmentContextSchema.parse({
      ...base,
      primaryRole: "parent",
      entitledRoles: ["parent", "admin"],
      activeWorkspace: "admin",
      workspaceEntitled: true,
    });
    const md = formatIssueMarkdown({
      id: "UAT-1",
      status: "open",
      title: "t",
      originalNotes: "n",
      description: "d",
      stepsToReproduce: ["s"],
      actualResult: "a",
      expectedResult: "e",
      severity: "low",
      category: "other",
      inputMethod: "text",
      element: null,
      environment: env,
      aiDraft: null,
      screenshot: null,
      githubIssue: null,
      createdAt: "2026-11-27T02:00:00.000Z",
      updatedAt: "2026-11-27T02:00:00.000Z",
    } as unknown as UatIssue);
    expect(md).toContain("account `parent`");
    expect(md).toContain("entitled [parent, admin]");
    expect(md).toContain("workspace `admin`");
    expect(md).not.toContain("NOT entitled");
  });
});

describe("the server never takes the workspace from the request", () => {
  const state: {
    user: { id: string; email: string } | null;
    profile: { role: string; access_revoked_at: string | null } | null;
    grants: { role: string; revoked_at: string | null }[];
  } = { user: null, profile: null, grants: [] };

  beforeEach(() => {
    vi.resetModules();
    state.user = null;
    state.profile = null;
    state.grants = [];
    vi.doMock("next/headers", () => ({
      cookies: async () => ({ get: () => undefined }),
      headers: async () => new Headers(),
    }));
    vi.doMock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: state.user } }) },
        rpc: async () => ({ data: false, error: null }),
        from: (table: string) => ({
          select: () => ({
            eq: () =>
              table === "profiles"
                ? { single: async () => ({ data: state.profile, error: null }) }
                : Promise.resolve({ data: state.grants, error: null }),
          }),
        }),
      }),
    }));
  });

  const ENV = {
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
    MM_UAT_SESSION_SECRET: "unit-test-uat-signing-secret-0123456789",
  };
  const forged = () =>
    new Request("http://localhost/api/uat/session?workspace=admin&activeRole=admin&role=admin", {
      headers: { "x-mm-workspace": "admin", "x-mm-active-role": "admin", "x-mm-requested-path": "/admin" },
    });

  it("a dual-role login reports primary parent and both entitlements, whatever the request claims", async () => {
    state.user = { id: "11111111-1111-1111-1111-111111111111", email: "dual@example.com" };
    state.profile = { role: "parent", access_revoked_at: null };
    state.grants = [{ role: "admin", revoked_at: null }];
    const { verifyUatTesterAccess } = await import("@/features/uat-assistant/server/uat-access");
    const decision = await verifyUatTesterAccess(forged(), ENV);
    expect(decision.enabled).toBe(true);
    if (!decision.enabled) return;
    expect(decision.primaryRole).toBe("parent");
    expect(decision.entitledRoles).toEqual(["parent", "admin"]);
    expect(decision.authorizedVia).toBe("admin_role");
  });

  it("a parent-only login stays refused when the request claims an Admin workspace", async () => {
    state.user = { id: "22222222-2222-2222-2222-222222222222", email: "p@example.com" };
    state.profile = { role: "parent", access_revoked_at: null };
    const { verifyUatTesterAccess } = await import("@/features/uat-assistant/server/uat-access");
    expect((await verifyUatTesterAccess(forged(), ENV)).enabled).toBe(false);
  });

  it("a revoked Admin grant is refused even though the profile still says admin and the request claims Admin", async () => {
    state.user = { id: "33333333-3333-3333-3333-333333333333", email: "r@example.com" };
    state.profile = { role: "admin", access_revoked_at: null };
    state.grants = [{ role: "admin", revoked_at: "2026-11-27T00:00:00Z" }];
    const { verifyUatTesterAccess } = await import("@/features/uat-assistant/server/uat-access");
    expect((await verifyUatTesterAccess(forged(), ENV)).enabled).toBe(false);
  });

  it("an access-revoked account is refused", async () => {
    state.user = { id: "44444444-4444-4444-4444-444444444444", email: "x@example.com" };
    state.profile = { role: "parent", access_revoked_at: "2026-11-27T00:00:00Z" };
    state.grants = [{ role: "admin", revoked_at: null }];
    const { verifyUatTesterAccess } = await import("@/features/uat-assistant/server/uat-access");
    expect((await verifyUatTesterAccess(forged(), ENV)).enabled).toBe(false);
  });
});
