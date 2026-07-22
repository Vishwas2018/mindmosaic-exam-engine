import { test, expect } from "../fixtures/auth.fixture";
import { createAdminClient } from "../fixtures/supabase-admin";
import { e2eEnv } from "../fixtures/env";
import { FIXTURE_EMAIL_DOMAIN } from "../fixtures/identities";
import { seed } from "../fixtures/seed";
import { cleanup } from "../fixtures/cleanup";
import { signInWithPassword } from "../fixtures/session-cookie";
import { assertLocalSupabaseEnvironment } from "../fixtures/environment-guard";

test.describe("role access", () => {
  test("parent fixture reaches the parent dashboard", async ({ contextAs }) => {
    for (const key of ["parent-no-children", "parent-one-child", "parent-multi-children"] as const) {
      const context = await contextAs(key);
      const page = await context.newPage();
      await page.goto("/parent");
      await expect(page).toHaveTitle(/Parent dashboard/);
      await expect(page).toHaveURL(/\/parent$/);
    }
  });

  test("student fixture reaches the student dashboard", async ({ contextAs }) => {
    const noAttempts = await (await contextAs("student-no-attempts")).newPage();
    await noAttempts.goto("/student");
    await expect(noAttempts).toHaveTitle(/Student home/);
    await expect(noAttempts.getByText("No sessions yet")).toBeVisible();

    const completed = await (await contextAs("student-completed-attempt")).newPage();
    await completed.goto("/student");
    await expect(completed).toHaveTitle(/Student home/);
    await expect(completed.getByText("Recent sessions")).toBeVisible();
  });

  test("teacher fixture reaches the teacher dashboard", async ({ contextAs }) => {
    for (const key of ["teacher-no-students", "teacher-with-students"] as const) {
      const context = await contextAs(key);
      const page = await context.newPage();
      await page.goto("/teacher");
      await expect(page).toHaveTitle(/Teacher dashboard/);
      await expect(page).toHaveURL(/\/teacher$/);
    }
  });

  test("admin fixture reaches the admin dashboard", async ({ contextAs }) => {
    const context = await contextAs("admin");
    const page = await context.newPage();
    await page.goto("/admin");
    await expect(page).toHaveTitle(/Admin/);
    await expect(page.getByRole("heading", { name: "Admin tools" })).toBeVisible();
  });

  test("unauthenticated visitor is redirected away from every role route", async ({
    contextAs,
  }) => {
    const context = await contextAs("unauthenticated");
    const page = await context.newPage();
    for (const path of ["/parent", "/student", "/teacher", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in\?next=/);
    }
  });

  test("a student cannot reach a parent route", async ({ contextAs }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await page.goto("/parent");
    // requireRole() sends a signed-in, wrong-role visitor to their own home,
    // not to /sign-in — see src/features/auth/require-role.ts.
    await expect(page).toHaveURL(/\/student$/);
  });

  test("parent A cannot read household B's fixture data", async () => {
    const admin = createAdminClient();
    const { data: householdB } = await admin
      .from("profiles")
      .select("id")
      .eq("display_name", "Student No Attempts")
      .single();
    expect(householdB).toBeTruthy();

    const session = await signInWithPassword(
      "parent-no-children@" + FIXTURE_EMAIL_DOMAIN,
      e2eEnv.fixturePassword,
    );

    const response = await fetch(
      `${e2eEnv.supabaseUrl}/rest/v1/profiles?id=eq.${householdB!.id}`,
      {
        headers: {
          apikey: e2eEnv.supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );
    expect(response.ok).toBe(true);
    const rows = await response.json();
    // RLS's "parent reads linked children" policy only matches a parent who
    // is actually linked — parent-no-children is linked to nobody, so
    // household B's child profile must be invisible, not merely filtered
    // client-side.
    expect(rows).toEqual([]);
  });

  test("re-running seed is idempotent", async () => {
    const first = await seed();
    const second = await seed();
    expect(second.parentIds).toEqual(first.parentIds);
    expect(second.studentIds).toEqual(first.studentIds);
    expect(second.teacherIds).toEqual(first.teacherIds);
    expect(second.adminId).toBe(first.adminId);
  });

  test("cleanup does not affect non-fixture records", async () => {
    const admin = createAdminClient();
    const decoyEmail = `not-a-fixture-${Date.now()}@example.test`;
    const { data: decoy, error } = await admin.auth.admin.createUser({
      email: decoyEmail,
      password: "irrelevant-password-1!",
      email_confirm: true,
    });
    expect(error).toBeNull();

    try {
      await cleanup();
      const { data: usersAfter } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      expect(usersAfter.users.some((u) => u.email === decoyEmail)).toBe(true);
    } finally {
      await admin.auth.admin.deleteUser(decoy!.user!.id);
    }

    // Cleanup deleted every real fixture too — reseed so later tests (and
    // later runs of this file) still have their identities.
    await seed();
  });

  test("environment guard rejects a non-local Supabase URL", async () => {
    const original = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://not-local.supabase.co";
    try {
      expect(() => assertLocalSupabaseEnvironment()).toThrow(/refusing to run/i);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = original;
    }
  });
});
