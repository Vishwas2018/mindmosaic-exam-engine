import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

type Result = { data: unknown; error: unknown };
const state = {
  user: { id: "u1" } as { id: string } | null,
  profile: { role: "parent", access_revoked_at: null } as Record<string, unknown> | null,
  grants: { data: [], error: null } as Result,
  mfaRequired: { data: false, error: null } as Result,
  aal: "aal1",
  signedOut: false,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      signOut: async () => {
        state.signedOut = true;
      },
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: state.aal } }) },
    },
    rpc: async () => state.mfaRequired,
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === "user_roles"
            ? Promise.resolve(state.grants)
            : { single: async () => ({ data: state.profile }) },
      }),
    }),
  })),
}));

import { requireRole } from "@/features/auth/require-role";

function redirectPath(error: unknown): string {
  const digest = (error as { digest?: string } | null)?.digest ?? "";
  return digest.split(";").slice(2, -2).join(";");
}
const attempt = (role: Parameters<typeof requireRole>[0], next: string) =>
  requireRole(role, next).then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, path: redirectPath(error) }),
  );

beforeEach(() => {
  state.user = { id: "u1" };
  state.profile = { role: "parent", access_revoked_at: null };
  state.grants = { data: [], error: null };
  state.mfaRequired = { data: false, error: null };
  state.aal = "aal1";
  state.signedOut = false;
});

describe("requireRole with multi-role entitlements", () => {
  it("lets a parent with an active admin grant into both workspaces and reports both roles", async () => {
    state.grants = { data: [{ role: "admin", revoked_at: null }], error: null };
    const parent = await attempt("parent", "/parent");
    const admin = await attempt("admin", "/admin");
    expect(parent).toMatchObject({ ok: true, value: { roles: ["parent", "admin"] } });
    expect(admin).toMatchObject({ ok: true });
  });

  it("refuses admin to a parent without a grant and sends them to the parent home", async () => {
    expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/parent" });
  });

  it("a revoked grant closes admin immediately, even if the profile still says admin, without a redirect loop", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    state.grants = { data: [{ role: "admin", revoked_at: "2026-11-26T00:00:00Z" }], error: null };
    expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/" });
  });

  it("keeps a legacy admin working when no grant row exists or the table is unavailable", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    expect(await attempt("admin", "/admin")).toMatchObject({ ok: true, value: { roles: ["admin"] } });
    state.grants = { data: null, error: { code: "42P01" } };
    expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
  });

  it("an admin-only login is not made a parent", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    expect(await attempt("parent", "/parent")).toEqual({ ok: false, path: "/admin" });
  });

  it("signs out and refuses an access-revoked account", async () => {
    state.profile = { role: "parent", access_revoked_at: "2026-11-26T00:00:00Z" };
    state.grants = { data: [{ role: "admin", revoked_at: null }], error: null };
    expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/sign-in?next=%2Fadmin" });
    expect(state.signedOut).toBe(true);
  });

  describe("MFA step-up", () => {
    beforeEach(() => {
      state.grants = { data: [{ role: "admin", revoked_at: null }], error: null };
      state.mfaRequired = { data: true, error: null };
    });

    it("sends an aal1 admin session to /staff/mfa carrying the destination", async () => {
      expect(await attempt("admin", "/admin/review")).toEqual({
        ok: false,
        path: "/staff/mfa?next=%2Fadmin%2Freview",
      });
    });

    it("admits an aal2 session, and never applies step-up to the parent workspace", async () => {
      state.aal = "aal2";
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
      state.aal = "aal1";
      expect(await attempt("parent", "/parent")).toMatchObject({ ok: true });
    });

    it("does not step up when the platform switch is off or unavailable", async () => {
      state.mfaRequired = { data: false, error: null };
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
      state.mfaRequired = { data: null, error: { code: "42883" } };
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
    });
  });
});
