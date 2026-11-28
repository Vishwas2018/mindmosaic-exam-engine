import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, PARENT_C, seed, STUDENT_A, STUDENT_B } from "./fixtures";

/*
 * Multi-role workspaces: one login holds Parent + Admin. Everything runs in a rolled-back transaction.
 * PARENT_C is the dual-role subject. STUDENT_B is promoted by editing profiles.role (the service-role path), which the
 * sync trigger must turn into an audited grant: admin power is entitlement-only, so a profile that merely says
 * "admin" has none.
 */
let client: Client;

async function asAal(sub: string, aal: "aal1" | "aal2") {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub, role: "authenticated", aal }),
  ]);
}

async function reset() {
  await client.query("reset role");
}

async function asService<T>(fn: () => Promise<T>): Promise<T> {
  await client.query("set local role service_role");
  try {
    return await fn();
  } finally {
    await reset();
  }
}

const isAdmin = async () => (await client.query("select public.is_admin() as a")).rows[0].a as boolean;

describe("multi-role workspaces (entitlements, MFA step-up, revocation, audit)", () => {
  beforeEach(async () => {
    client = await connect();
    await client.query("begin");
    await seed(client);
    await client.query("update public.profiles set role='admin' where id=$1", [STUDENT_B]);
    await client.query("update public.profiles set role='parent' where id=$1", [PARENT_C]);
  });

  afterEach(async () => {
    await client.query("rollback");
    await client.end();
  });

  it("promotion by profile edit becomes an audited grant; a parent has no admin power", async () => {
    await asAal(STUDENT_B, "aal1");
    expect(await isAdmin()).toBe(true);
    await reset();
    const grant = await client.query(
      "select granted_by from public.user_roles where user_id=$1 and revoked_at is null",
      [STUDENT_B],
    );
    expect(grant.rows).toHaveLength(1);
    expect(grant.rows[0].granted_by).toMatch(/^trigger:profiles\.role:/);
    const audit = await client.query("select action from public.role_audit_events where user_id=$1", [STUDENT_B]);
    expect(audit.rows.map((r) => r.action)).toEqual(["grant"]);
    await asAal(PARENT_C, "aal1");
    expect(await isAdmin()).toBe(false);
  });

  it("STRICT: a profile that merely says admin, with no entitlement row, has no admin power", async () => {
    await client.query("delete from public.user_roles where user_id=$1", [STUDENT_B]);
    await asAal(STUDENT_B, "aal2");
    expect(await isAdmin()).toBe(false);
    expect((await client.query("select public.has_active_admin_role() as a")).rows[0].a).toBe(false);
  });

  it("demoting the profile away from admin revokes the entitlement; re-promotion is an audited regrant", async () => {
    await client.query("update public.profiles set role='parent' where id=$1", [STUDENT_B]);
    await asAal(STUDENT_B, "aal2");
    expect(await isAdmin()).toBe(false);
    await reset();
    await client.query("update public.profiles set role='admin' where id=$1", [STUDENT_B]);
    const actions = (
      await client.query("select action from public.role_audit_events where user_id=$1 order by id", [STUDENT_B])
    ).rows.map((r) => r.action);
    expect(actions).toEqual(["grant", "revoke", "regrant"]);
  });

  it("grant makes a parent a dual-role admin without touching the parent role or child links", async () => {
    const before = (
      await client.query("select count(*)::int c from public.parent_children where parent_id=$1", [PARENT_C])
    ).rows[0].c;
    const result = await asService(
      async () =>
        (await client.query("select public.grant_admin_role($1,'rls-test','dual role test') r", [PARENT_C])).rows[0].r,
    );
    expect(result).toBe("granted");
    expect((await client.query("select role from public.profiles where id=$1", [PARENT_C])).rows[0].role).toBe(
      "parent",
    );
    expect(
      (await client.query("select count(*)::int c from public.parent_children where parent_id=$1", [PARENT_C])).rows[0]
        .c,
    ).toBe(before);
    await asAal(PARENT_C, "aal1");
    expect(await isAdmin()).toBe(true);
    expect((await client.query("select count(*)::int c from public.user_roles")).rows[0].c).toBe(1);
  });

  it("there is no self-promotion path for authenticated callers (insert and update refused)", async () => {
    for (const sql of [
      "insert into public.user_roles(user_id, role, granted_by) values ($1,'admin','me')",
      "update public.user_roles set revoked_at = null where user_id = $1",
      "update public.profiles set role = 'admin' where id = $1",
    ]) {
      await client.query("savepoint s");
      await asAuthenticated(client, PARENT_C);
      await expect(client.query(sql, [PARENT_C])).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint s");
      await reset();
    }
    expect((await client.query("select role from public.profiles where id=$1", [PARENT_C])).rows[0].role).toBe(
      "parent",
    );
  });

  it("authenticated cannot call grant/revoke/trigger function or read/write audit and settings", async () => {
    for (const statement of [
      ["select public.grant_admin_role($1,'me','self promote try')", [PARENT_C]],
      ["select public.revoke_admin_role($1,'me','sabotage try')", [STUDENT_B]],
      ["select public.sync_admin_entitlement_from_profile()", []],
      ["select * from public.role_audit_events", []],
      [
        "insert into public.role_audit_events(user_id, role, action, actor, reason) values ($1,'admin','grant','me','forged entry')",
        [PARENT_C],
      ],
      ["select * from public.security_settings", []],
      ["update public.security_settings set bool_value = false", []],
    ] as const) {
      await client.query("savepoint s");
      await asAuthenticated(client, PARENT_C);
      await expect(client.query(statement[0], [...statement[1]])).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback to savepoint s");
      await reset();
    }
    await client.query("savepoint a");
    await asAnon(client);
    await expect(client.query("select * from public.user_roles")).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint a");
  });

  it("students can never be granted an elevated role", async () => {
    await client.query("savepoint s");
    await client.query("set local role service_role");
    await expect(
      client.query("select public.grant_admin_role($1,'rls-test','child must not')", [STUDENT_A]),
    ).rejects.toMatchObject({ code: "MM108" });
    await client.query("rollback to savepoint s");
    await reset();
    expect(
      (await client.query("select count(*)::int c from public.user_roles where user_id=$1", [STUDENT_A])).rows[0].c,
    ).toBe(0);
  });

  it("MFA switch: aal1 is refused, aal2 allowed, entitlement stays visible so step-up can happen", async () => {
    await asService(async () => {
      await client.query("select public.grant_admin_role($1,'rls-test','mfa test')", [PARENT_C]);
      await client.query("update public.security_settings set bool_value = true where key = 'require_admin_mfa'");
    });
    await asAal(PARENT_C, "aal1");
    expect(await isAdmin()).toBe(false);
    expect((await client.query("select public.has_active_admin_role() as a")).rows[0].a).toBe(true);
    await reset();
    await asAal(PARENT_C, "aal2");
    expect(await isAdmin()).toBe(true);
    await reset();
    await asAal(STUDENT_A, "aal2");
    expect(await isAdmin()).toBe(false); // aal2 alone confers nothing
  });

  it("revocation closes admin at once (even for an admin-only profile), is audited append-only, and survives regrant", async () => {
    await asService(async () => {
      await client.query("select public.grant_admin_role($1,'rls-test','revocation test')", [PARENT_C]);
      expect(
        (await client.query("select public.revoke_admin_role($1,'rls-test','offboarding') r", [PARENT_C])).rows[0].r,
      ).toBe("revoked");
    });
    await asAal(PARENT_C, "aal2");
    expect(await isAdmin()).toBe(false);
    await reset();
    // An admin-only profile (role still 'admin') loses everything on revoke: the profile column confers nothing.
    await asService(async () => {
      expect(
        (await client.query("select public.revoke_admin_role($1,'rls-test','admin only revoke') r", [STUDENT_B]))
          .rows[0].r,
      ).toBe("revoked");
    });
    await asAal(STUDENT_B, "aal2");
    expect(await isAdmin()).toBe(false);
    await reset();
    await asService(async () => {
      expect(
        (await client.query("select public.grant_admin_role($1,'rls-test','restore') r", [PARENT_C])).rows[0].r,
      ).toBe("regranted");
    });
    const actions = (
      await client.query("select action from public.role_audit_events where user_id=$1 order by id", [PARENT_C])
    ).rows.map((r) => r.action);
    expect(actions).toEqual(["grant", "revoke", "regrant"]);
    await client.query("savepoint s");
    await expect(client.query("update public.role_audit_events set reason='tampered text'")).rejects.toMatchObject({
      code: "MM107",
    });
    await client.query("rollback to savepoint s");
  });

  it("account revocation (access_revoked_at) disables admin even with an active grant", async () => {
    await asService(async () => {
      await client.query("select public.grant_admin_role($1,'rls-test','acct revoke test')", [PARENT_C]);
    });
    await client.query("update public.profiles set access_revoked_at = now() where id=$1", [PARENT_C]);
    await asAal(PARENT_C, "aal2");
    expect(await isAdmin()).toBe(false);
  });

  describe("content-factory owner approvals use the same entitlement and MFA level", () => {
    const REVISION = "91000000-0000-4000-8000-000000000003";
    /* Reaching the eligibility check (MM102 for an unknown revision) means the admin gate was passed; 42501 = refused. */
    async function gate(): Promise<string> {
      await client.query("savepoint g");
      try {
        await client.query("select public.owner_approve_content($1,'{}'::jsonb)", [REVISION]);
        return "approved";
      } catch (error) {
        return (error as { code: string }).code;
      } finally {
        await client.query("rollback to savepoint g");
      }
    }

    it("dual-role passes; a plain parent, aal1 under MFA, and a revoked grant are refused", async () => {
      await asAal(PARENT_C, "aal2");
      expect(await gate()).toBe("42501");
      await reset();
      await asService(async () => {
        await client.query("select public.grant_admin_role($1,'rls-test','content factory test')", [PARENT_C]);
      });
      await asAal(PARENT_C, "aal1");
      expect(await gate()).toBe("MM102");
      await reset();
      await asService(async () => {
        await client.query("update public.security_settings set bool_value = true where key = 'require_admin_mfa'");
      });
      await asAal(PARENT_C, "aal1");
      expect(await gate()).toBe("42501");
      await reset();
      await asAal(PARENT_C, "aal2");
      expect(await gate()).toBe("MM102");
      await reset();
      await asService(async () => {
        await client.query("select public.revoke_admin_role($1,'rls-test','offboarding')", [PARENT_C]);
      });
      await asAal(PARENT_C, "aal2");
      expect(await gate()).toBe("42501");
    });

    it("a revoked admin-only profile (role still admin) is refused", async () => {
      await asAal(STUDENT_B, "aal1");
      expect(await gate()).toBe("MM102");
      await reset();
      await asService(async () => {
        await client.query("select public.revoke_admin_role($1,'rls-test','offboarding')", [STUDENT_B]);
      });
      await asAal(STUDENT_B, "aal2");
      expect(await gate()).toBe("42501");
    });
  });

  describe("rollback", () => {
    it("keeps the audit trail, snapshots entitlements, and does not resurrect a revoked admin", async () => {
      await asService(async () => {
        await client.query("select public.grant_admin_role($1,'rls-test','dual before rollback')", [PARENT_C]);
        await client.query("select public.revoke_admin_role($1,'rls-test','revoked before rollback')", [STUDENT_B]);
      });
      const before = (await client.query("select id, action from public.role_audit_events order by id")).rows;
      const down = readFileSync(
        join(process.cwd(), "supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql"),
        "utf8",
      )
        .replace(/^begin;$/m, "")
        .replace(/^commit;$/m, "");
      await client.query(down);
      const after = (await client.query("select id, action from public.role_audit_events order by id")).rows;
      expect(after.slice(0, before.length)).toEqual(before);
      expect(after.filter((r) => r.action === "rollback").length).toBeGreaterThanOrEqual(2);
      expect((await client.query("select to_regclass('public.user_roles') as t")).rows[0].t).toBeNull();
      expect((await client.query("select role from public.profiles where id=$1", [STUDENT_B])).rows[0].role).toBe(
        "parent",
      );
      await client.query("savepoint s");
      await expect(client.query("update public.role_audit_events set reason='tampered text'")).rejects.toMatchObject({
        code: "MM107",
      });
      await client.query("rollback to savepoint s");
    });
  });
});
