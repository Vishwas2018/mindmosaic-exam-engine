// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://qawbnonprodproject.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

/*
 * A small stateful model of the three things the archive lifecycle touches:
 *   - parent_children links (many guardians per child),
 *   - profiles (role),
 *   - Supabase Auth users (ban + app_metadata), including what GoTrue does with them.
 * It exists so the tests can assert on STATE (is the child still linked? still banned? still attempting?)
 * rather than on which mock was called. The real GoTrue behaviour it models (user_banned on sign-in, 403 on an
 * issued token, unban restoring sign-in) is verified against DEV Supabase in the PR's hosted evidence.
 */
const world = vi.hoisted(() => ({
  signedInAs: null as string | null,
  roles: new Map<string, string>(),
  links: new Set<string>(), // `${parent}:${child}`
  users: new Map<string, { id: string; banned: boolean; appMetadata: Record<string, unknown>; password: string }>(),
  attempts: new Map<string, number>(),
  updateCalls: [] as Array<{ id: string; attrs: Record<string, unknown> }>,
  failUpdate: false,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: world.signedInAs ? { id: world.signedInAs } : null } }) },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: async () => ({ data: { role: world.roles.get(world.signedInAs ?? "") ?? null } }) }) }) };
      }
      if (table === "parent_children") {
        return {
          select: () => ({
            eq: (_c1: string, parentId: string) => ({
              eq: (_c2: string, childId: string) => ({
                maybeSingle: async () => ({ data: world.links.has(`${parentId}:${childId}`) ? { child_id: childId } : null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ eq: (_c: string, id: string) => ({ maybeSingle: async () => ({ data: world.roles.has(id) ? { role: world.roles.get(id) } : null, error: null }) }) }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      throw new Error(`unexpected admin table ${table} (archive must never touch parent_children or attempts)`);
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          const u = world.users.get(id);
          return u ? { data: { user: { id, app_metadata: u.appMetadata } }, error: null } : { data: { user: null }, error: { message: "not found" } };
        },
        updateUserById: async (id: string, attrs: Record<string, unknown>) => {
          world.updateCalls.push({ id, attrs });
          if (world.failUpdate) return { data: null, error: { message: "boom" } };
          const u = world.users.get(id)!;
          if ("ban_duration" in attrs) u.banned = attrs.ban_duration !== "none";
          if (attrs.app_metadata) u.appMetadata = attrs.app_metadata as Record<string, unknown>;
          if (typeof attrs.password === "string") u.password = attrs.password;
          return { data: { user: { id } }, error: null };
        },
      },
    },
  }),
}));

import { DELETE, PATCH } from "@/app/api/parent/children/[childId]/route";
import { isArchivedUser, loadArchivedChildIds, setChildArchived, ARCHIVE_BAN_DURATION } from "@/features/parent-dashboard/child-access";

const PARENT_A = "parent-a";
const PARENT_B = "parent-b";
const OUTSIDER = "parent-outsider";
const CHILD = "child-1";
const URL_BASE = `http://localhost/api/parent/children/${CHILD}`;
const ctx = (id = CHILD) => ({ params: Promise.resolve({ childId: id }) });
const headers = { "content-type": "application/json", origin: "http://localhost", host: "localhost" };
const patch = (body: unknown, extra: Record<string, string> = {}) =>
  PATCH(new Request(URL_BASE, { method: "PATCH", headers: { ...headers, ...extra }, body: JSON.stringify(body) }), ctx());
const del = (extra: Record<string, string> = {}) => DELETE(new Request(URL_BASE, { method: "DELETE", headers: { ...headers, ...extra } }), ctx());

/** What GoTrue does: a banned user cannot sign in with the right code + PIN; an unbanned one can. */
const canSignIn = (childId: string, pin: string) => {
  const u = world.users.get(childId);
  return !!u && !u.banned && u.password === pin;
};

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  world.signedInAs = PARENT_A;
  world.roles = new Map([[PARENT_A, "parent"], [PARENT_B, "parent"], [OUTSIDER, "parent"], [CHILD, "student"], ["a-student", "student"]]);
  world.links = new Set([`${PARENT_A}:${CHILD}`, `${PARENT_B}:${CHILD}`]);
  world.users = new Map([[CHILD, { id: CHILD, banned: false, appMetadata: { provider: "email", providers: ["email"] }, password: "482916" }]]);
  world.attempts = new Map([[CHILD, 12]]);
  world.updateCalls = [];
  world.failUpdate = false;
});

describe("QA-003: archive pauses the child's login and keeps everything else", () => {
  it("DELETE bans the account, marks it archived, and keeps the link, the account and every attempt", async () => {
    expect(canSignIn(CHILD, "482916")).toBe(true);

    const response = await del();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, archived: true });
    const user = world.users.get(CHILD)!;
    expect(user.banned).toBe(true);
    expect(isArchivedUser({ app_metadata: user.appMetadata })).toBe(true);
    expect(world.updateCalls[0]!.attrs).toMatchObject({ ban_duration: ARCHIVE_BAN_DURATION });
    // nothing was deleted or orphaned
    expect(world.links.has(`${PARENT_A}:${CHILD}`)).toBe(true);
    expect(world.links.has(`${PARENT_B}:${CHILD}`)).toBe(true);
    expect(world.users.has(CHILD)).toBe(true);
    expect(world.attempts.get(CHILD)).toBe(12);
  });

  it("the archived child can no longer sign in with their existing code and PIN", async () => {
    await del();
    expect(canSignIn(CHILD, "482916")).toBe(false);
  });

  it("existing app_metadata (provider info) is preserved and the audit stamp records who archived and when", async () => {
    await del();
    const meta = world.users.get(CHILD)!.appMetadata;
    expect(meta).toMatchObject({ provider: "email", providers: ["email"], archived: true, archived_by: PARENT_A });
    expect(typeof meta.archived_at).toBe("string");
  });

  it("is idempotent: archiving an archived child succeeds and writes nothing", async () => {
    await del();
    const writes = world.updateCalls.length;
    const again = await del();
    expect(again.status).toBe(200);
    expect(world.updateCalls).toHaveLength(writes);
  });

  it("PATCH { archived: true } archives too", async () => {
    expect((await patch({ archived: true })).status).toBe(200);
    expect(canSignIn(CHILD, "482916")).toBe(false);
  });
});

describe("restore", () => {
  it("PATCH { archived: false } lets the child sign in again with the same code and PIN, and keeps the history", async () => {
    await del();
    expect(canSignIn(CHILD, "482916")).toBe(false);

    const response = await patch({ archived: false });

    expect(response.status).toBe(200);
    expect(canSignIn(CHILD, "482916")).toBe(true);
    expect(world.updateCalls.at(-1)!.attrs).toMatchObject({ ban_duration: "none" });
    expect(world.users.get(CHILD)!.appMetadata).toMatchObject({ archived: false, restored_by: PARENT_A });
    expect(world.attempts.get(CHILD)).toBe(12);
  });

  it("restoring an active child is a no-op", async () => {
    const response = await patch({ archived: false });
    expect(response.status).toBe(200);
    expect(world.updateCalls).toHaveLength(0);
  });

  it("archive then restore round-trips repeatedly", async () => {
    for (let i = 0; i < 3; i++) {
      await del();
      expect(canSignIn(CHILD, "482916")).toBe(false);
      await patch({ archived: false });
      expect(canSignIn(CHILD, "482916")).toBe(true);
    }
  });

  it("restore with a new PIN in one request ends with a working account on the NEW pin", async () => {
    await del();
    const response = await patch({ archived: false, pin: "135790" });
    expect(response.status).toBe(200);
    expect(canSignIn(CHILD, "135790")).toBe(true);
    expect(canSignIn(CHILD, "482916")).toBe(false);
  });
});

describe("PIN management while archived", () => {
  it("a parent can reset an archived child's PIN, and doing so does NOT reactivate the account", async () => {
    await del();
    const response = await patch({ pin: "246810" });
    expect(response.status).toBe(200);
    expect(world.users.get(CHILD)!.password).toBe("246810");
    expect(world.users.get(CHILD)!.banned).toBe(true);
    expect(canSignIn(CHILD, "246810")).toBe(false);
    await patch({ archived: false });
    expect(canSignIn(CHILD, "246810")).toBe(true);
  });

  it("still rejects an invalid PIN", async () => {
    await del();
    expect((await patch({ pin: "12" })).status).toBe(400);
  });
});

describe("multiple guardians", () => {
  it("either linked guardian can archive and either can restore; both keep the child linked throughout", async () => {
    world.signedInAs = PARENT_A;
    await del();
    expect(world.links.has(`${PARENT_B}:${CHILD}`)).toBe(true);

    world.signedInAs = PARENT_B;
    expect((await patch({ archived: false })).status).toBe(200);
    expect(canSignIn(CHILD, "482916")).toBe(true);
    expect(world.links.has(`${PARENT_A}:${CHILD}`)).toBe(true);
    expect(world.links.has(`${PARENT_B}:${CHILD}`)).toBe(true);
  });
});

describe("unauthorised access", () => {
  it("a parent who is not linked to the child cannot archive or restore them (404, no writes)", async () => {
    world.signedInAs = OUTSIDER;
    expect((await del()).status).toBe(404);
    expect((await patch({ archived: false })).status).toBe(404);
    expect(world.updateCalls).toHaveLength(0);
    expect(world.users.get(CHILD)!.banned).toBe(false);
  });

  it("a guest gets 401 and a student gets 403, with no writes", async () => {
    world.signedInAs = null;
    expect((await del()).status).toBe(401);
    world.signedInAs = "a-student";
    expect((await del()).status).toBe(403);
    expect((await patch({ archived: true })).status).toBe(403);
    expect(world.updateCalls).toHaveLength(0);
  });

  it("a cross-origin request is refused before anything is read or written", async () => {
    const response = await del({ origin: "https://evil.example" });
    expect(response.status).toBe(403);
    expect(world.updateCalls).toHaveLength(0);
  });

  it("refuses to ban a non-student account even if a link to it somehow exists", async () => {
    world.roles.set(CHILD, "parent");
    const response = await del();
    expect(response.status).toBe(400);
    expect(world.updateCalls).toHaveLength(0);
  });

  it("returns 404 when the auth user cannot be found", async () => {
    world.users.delete(CHILD);
    expect((await del()).status).toBe(404);
  });

  it("does not claim success when the auth update fails", async () => {
    world.failUpdate = true;
    const response = await del();
    expect(response.status).toBe(500);
    expect((await response.json()).ok).toBe(false);
    expect(world.users.get(CHILD)!.banned).toBe(false);
  });

  it("rejects a non-boolean archived value", async () => {
    expect((await patch({ archived: "yes" })).status).toBe(400);
    expect(world.updateCalls).toHaveLength(0);
  });
});

describe("setChildArchived and loadArchivedChildIds", () => {
  it("never reads or writes anything but profiles (role check) and auth", async () => {
    const result = await setChildArchived(
      {
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: "student" }, error: null }) }) }) }),
        auth: {
          admin: {
            getUserById: async () => ({ data: { user: { id: CHILD, app_metadata: {} } }, error: null }),
            updateUserById: async () => ({ data: {}, error: null }),
          },
        },
      } as never,
      CHILD,
      true,
      PARENT_A,
      () => new Date("2026-10-30T00:00:00.000Z"),
    );
    expect(result).toEqual({ ok: true, alreadyInState: false });
  });

  it("lists archived children for display, and degrades to 'none archived' rather than failing the page", async () => {
    world.users.set("child-2", { id: "child-2", banned: true, appMetadata: { archived: true }, password: "x" });
    world.users.set(CHILD, { id: CHILD, banned: false, appMetadata: { archived: false }, password: "x" });
    expect([...(await loadArchivedChildIds([CHILD, "child-2", "missing"]))]).toEqual(["child-2"]);
    expect((await loadArchivedChildIds([])).size).toBe(0);
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect((await loadArchivedChildIds(["child-2"])).size).toBe(0);
  });
});
