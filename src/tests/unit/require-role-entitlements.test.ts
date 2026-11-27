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
  throwGrants: false,
  aalThrows: false,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: state.user } }),
      signOut: async () => {
        state.signedOut = true;
      },
      mfa: {
        getAuthenticatorAssuranceLevel: async () => {
          if (state.aalThrows) throw new Error("network");
          return { data: { currentLevel: state.aal } };
        },
      },
    },
    rpc: async () => state.mfaRequired,
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === "user_roles"
            ? state.throwGrants
              ? Promise.reject(new Error("network"))
              : Promise.resolve(state.grants)
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
  state.throwGrants = false;
  state.aalThrows = false;
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

  it("is strict after migration: a profile that merely says admin with no grant row is refused", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/" });
  });

  it("keeps a legacy admin working only when the entitlement table does not exist (pre-migration)", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    for (const code of ["42P01", "PGRST205"]) {
      state.grants = { data: null, error: { code } };
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true, value: { roles: ["admin"] } });
    }
  });

  it("FAILS CLOSED on any other lookup error: no admin for a profile-admin or a granted parent", async () => {
    for (const code of ["57014", "42501", "PGRST301", undefined]) {
      state.profile = { role: "admin", access_revoked_at: null };
      state.grants = { data: null, error: { code } };
      expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/" });
      state.profile = { role: "parent", access_revoked_at: null };
      expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/parent" });
    }
  });

  it("an entitlement-lookup outage does not lock parents out of the parent workspace", async () => {
    state.grants = { data: null, error: { code: "57014" } };
    expect(await attempt("parent", "/parent")).toMatchObject({ ok: true, value: { roles: ["parent"] } });
  });

  it("a thrown lookup (network failure) also fails closed", async () => {
    state.grants = { data: null, error: null };
    state.throwGrants = true;
    expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/parent" });
  });

  it("an admin-only login is not made a parent", async () => {
    state.profile = { role: "admin", access_revoked_at: null };
    state.grants = { data: [{ role: "admin", revoked_at: null }], error: null };
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

    it("does not step up when the platform switch is off", async () => {
      state.mfaRequired = { data: false, error: null };
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
    });

    it("FAILS CLOSED when the switch cannot be read on a migrated database: admin refused, parent unaffected", async () => {
      state.mfaRequired = { data: null, error: { code: "57014" } };
      expect(await attempt("admin", "/admin")).toEqual({ ok: false, path: "/parent" });
      expect(await attempt("parent", "/parent")).toMatchObject({ ok: true });
    });

    it("an unverifiable assurance level is treated as not MFA-verified", async () => {
      state.aalThrows = true;
      expect(await attempt("admin", "/admin/review")).toEqual({
        ok: false,
        path: "/staff/mfa?next=%2Fadmin%2Freview",
      });
    });

    it("pre-migration database (no entitlement table) is never stepped up, so nobody is locked out", async () => {
      state.profile = { role: "admin", access_revoked_at: null };
      state.grants = { data: null, error: { code: "42P01" } };
      state.mfaRequired = { data: null, error: { code: "42883" } };
      expect(await attempt("admin", "/admin")).toMatchObject({ ok: true });
    });
  });
});
