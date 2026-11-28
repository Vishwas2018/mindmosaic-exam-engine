import { createClient } from "@supabase/supabase-js";

import { totpCode } from "../helpers/totp";
import { test, expect } from "../fixtures/auth.fixture";
import { e2eEnv } from "../fixtures/env";
import { ALL_IDENTITIES } from "../fixtures/identities";
import { createAdminClient } from "../fixtures/supabase-admin";

/**
 * One login, two workspaces (Parent + Admin): switcher, direct-URL access, escalation attempts, MFA step-up and
 * revocation. Everything runs against the throwaway local Supabase stack (the auth config refuses anything else), so
 * the platform MFA switch and grants are toggled here and always restored in `finally`.
 */
test.describe.configure({ mode: "serial" });

const DUAL = ALL_IDENTITIES.find((identity) => identity.key === "parent-admin-dual")!;
const anon = () =>
  createClient(e2eEnv.supabaseUrl, e2eEnv.supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function signedInClient(email: string) {
  const client = anon();
  const { error } = await client.auth.signInWithPassword({ email, password: e2eEnv.fixturePassword });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return client;
}

async function dualUserId(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("display_name", DUAL.displayName).single();
  return data!.id as string;
}

test.describe("multi-role workspaces", () => {
  test("a dual-role login sees the switcher and moves between Parent and Admin on one session", async ({ contextAs }) => {
    test.setTimeout(120_000);
    const page = await (await contextAs("parent-admin-dual")).newPage();

    await page.goto("/parent");
    const switcher = page.getByRole("navigation", { name: "Workspace switcher" });
    await expect(switcher).toBeVisible();
    await expect(switcher.getByRole("link", { name: "Parent" })).toHaveAttribute("aria-current", "page");

    await switcher.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    const adminSwitcher = page.getByRole("navigation", { name: "Workspace switcher" });
    await expect(adminSwitcher.getByRole("link", { name: "Admin" })).toHaveAttribute("aria-current", "page");

    await adminSwitcher.getByRole("link", { name: "Parent" }).click();
    // A parent with no children is sent to onboarding (/parent/setup): same parent journey as before the extra role.
    await expect(page).toHaveURL(/\/parent(\/setup)?$/);
    // Parent workspace is unchanged by the extra role: no billing wall, same dashboard.
    await expect(page).not.toHaveURL(/billing|pricing|sign-in/);
  });

  test("single-role logins see no switcher, and the legacy admin still works", async ({ contextAs }) => {
    const parent = await (await contextAs("parent-one-child")).newPage();
    await parent.goto("/parent");
    await expect(parent.getByRole("navigation", { name: "Workspace switcher" })).toHaveCount(0);

    const admin = await (await contextAs("admin")).newPage();
    await admin.goto("/admin");
    await expect(admin.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await expect(admin.getByRole("navigation", { name: "Workspace switcher" })).toHaveCount(0);
  });

  test("direct URL access: non-entitled roles never reach /admin, and an admin-only login is not made a parent", async ({
    contextAs,
  }) => {
    for (const key of ["parent-one-child", "student-no-attempts", "teacher-no-students"] as const) {
      const page = await (await contextAs(key)).newPage();
      for (const path of ["/admin", "/admin/review", "/admin/questions"]) {
        await page.goto(path);
        await expect(page, `${key} ${path}`).not.toHaveURL(/\/admin/);
      }
      await page.close();
    }
    const guest = await (await contextAs("unauthenticated")).newPage();
    await guest.goto("/admin/review");
    await expect(guest).toHaveURL(/sign-in/);

    const adminOnly = await (await contextAs("admin")).newPage();
    await adminOnly.goto("/parent");
    await expect(adminOnly).toHaveURL(/\/admin/);
  });

  test("staff sign-in: dedicated entry, no sign-up or role self-selection, generic failure, routes to Admin", async ({
    contextAs,
    browser,
  }) => {
    test.setTimeout(120_000);
    const guest = await (await contextAs("unauthenticated")).newPage();
    await guest.goto("/staff/sign-in");
    await expect(guest.getByTestId("staff-sign-in-form")).toBeVisible();
    await expect(guest.getByRole("link", { name: /sign up|create account|request admin/i })).toHaveCount(0);
    await expect(guest.getByRole("combobox")).toHaveCount(0);

    await guest.getByLabel("Work email").fill(DUAL.email);
    await guest.getByLabel("Password").fill("definitely-wrong-password");
    await guest.getByRole("button", { name: "Sign in" }).click();
    await expect(guest.locator("#staff-error")).toContainText("did not match a staff sign-in");
    await expect(guest).toHaveURL(/\/staff\/sign-in/);

    // An off-site next is ignored.
    await guest.goto("/staff/sign-in?next=https://evil.example");
    await guest.getByLabel("Work email").fill(DUAL.email);
    await guest.getByLabel("Password").fill(e2eEnv.fixturePassword);
    await guest.getByRole("button", { name: "Sign in" }).click();
    await expect(guest).toHaveURL(/\/admin$/, { timeout: 30_000 });
    await expect(guest.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();

    // A login without the entitlement signs in but lands in its own workspace, never in /admin.
    const context = await browser.newContext();
    const parentPage = await context.newPage();
    await parentPage.goto("/staff/sign-in");
    await parentPage.getByLabel("Work email").fill("parent-one-child@e2e.mindmosaic.local");
    await parentPage.getByLabel("Password").fill(e2eEnv.fixturePassword);
    await parentPage.getByRole("button", { name: "Sign in" }).click();
    await expect(parentPage).toHaveURL(/\/parent/, { timeout: 30_000 });
    await context.close();
  });

  test("privilege escalation: a signed-in parent cannot grant, edit or read elevated-role data", async () => {
    const parentEmail = "parent-one-child@e2e.mindmosaic.local";
    const client = await signedInClient(parentEmail);
    const { data: me } = await client.auth.getUser();
    const id = me.user!.id;

    const insert = await client.from("user_roles").insert({ user_id: id, role: "admin", granted_by: "self" });
    expect(insert.error?.code).toBe("42501");
    const upsert = await client.from("user_roles").update({ revoked_at: null }).eq("user_id", id);
    expect(upsert.error !== null || (upsert.data ?? []).length === 0).toBe(true);
    const grant = await client.rpc("grant_admin_role", { p_user: id, p_actor: "self", p_reason: "self promotion attempt" });
    expect(grant.error).not.toBeNull();
    const revokeOther = await client.rpc("revoke_admin_role", { p_user: await dualUserId(), p_actor: "self", p_reason: "sabotage attempt" });
    expect(revokeOther.error).not.toBeNull();
    const profile = await client.from("profiles").update({ role: "admin" }).eq("id", id);
    expect(profile.error !== null || (profile.count ?? 0) === 0).toBe(true);
    const settings = await client.from("security_settings").update({ bool_value: false });
    expect(settings.error).not.toBeNull();
    const audit = await client.from("role_audit_events").select("id");
    expect(audit.error !== null || (audit.data ?? []).length === 0).toBe(true);
    const own = await client.from("user_roles").select("role");
    expect(own.data ?? []).toEqual([]);

    const admin = createAdminClient();
    const { data: after } = await admin.from("profiles").select("role").eq("id", id).single();
    expect(after?.role).toBe("parent");
    const { data: rows } = await admin.from("user_roles").select("user_id").eq("user_id", id);
    expect(rows ?? []).toEqual([]);
    await client.auth.signOut();

    // Elevated roles can never attach to a child profile, even via the service-role function.
    const { data: student } = await admin.from("profiles").select("id").eq("role", "student").limit(1).single();
    const refused = await admin.rpc("grant_admin_role", { p_user: student!.id, p_actor: "e2e", p_reason: "child must not" });
    expect(refused.error?.code).toBe("MM108");
  });

  test("MFA step-up: when required, an aal1 admin session is sent to /staff/mfa and only a verified code unlocks Admin", async ({
    contextAs,
  }) => {
    test.setTimeout(180_000);
    const admin = createAdminClient();
    const userId = await dualUserId();
    try {
      const on = await admin.from("security_settings").update({ bool_value: true }).eq("key", "require_admin_mfa");
      expect(on.error).toBeNull();

      const context = await contextAs("parent-admin-dual");
      const page = await context.newPage();
      // Parent workspace is NOT subject to step-up.
      await page.goto("/parent");
      await expect(page).toHaveURL(/\/parent(\/setup)?$/);

      await page.goto("/admin/review");
      await expect(page).toHaveURL(/\/staff\/mfa\?next=%2Fadmin%2Freview/);
      await expect(page.getByTestId("staff-mfa-form")).toBeVisible();

      // Enrol the authenticator (first factor), wrong code first, then the right one.
      const secret = (await page.getByTestId("mfa-secret").textContent())!.trim();
      await page.getByLabel("6-digit code").fill("000000");
      await page.getByRole("button", { name: "Verify" }).click();
      await expect(page.locator("#staff-mfa-error")).toContainText("not accepted");
      await expect(page).toHaveURL(/\/staff\/mfa/);

      await page.getByLabel("6-digit code").fill(totpCode(secret));
      await page.getByRole("button", { name: "Verify" }).click();
      await expect(page).toHaveURL(/\/admin\/review/, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: "Draft review" })).toBeVisible();

      // The step-up held for the session: another admin page loads without a second prompt.
      await page.goto("/admin/questions");
      await expect(page).toHaveURL(/\/admin\/questions/);

      // A fresh aal1 session is refused by the DATABASE too, not just by the page gate.
      const aal1 = await signedInClient(DUAL.email);
      const refused = await aal1.from("admin_draft_review_approvals").insert({
        question_id: "mfa-probe-q",
        content_hash: "a".repeat(64),
        approved_by: userId,
        checks: { correctness: true, originality: true, ageAppropriateness: true },
      });
      expect(refused.error?.code).toBe("42501");
      const readable = await aal1.from("admin_draft_review_decisions").select("id");
      expect(readable.data ?? []).toEqual([]);
      const entitled = await aal1.rpc("has_active_admin_role");
      expect(entitled.data).toBe(true); // still offered the workspace, so step-up can happen
      const privileged = await aal1.rpc("is_admin");
      expect(privileged.data).toBe(false);
      await aal1.auth.signOut();
    } finally {
      await admin.from("security_settings").update({ bool_value: false }).eq("key", "require_admin_mfa");
      const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId });
      for (const factor of factors?.factors ?? []) {
        await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
      }
    }
  });

  test("revocation: removing the entitlement closes Admin immediately and leaves Parent, billing and children intact", async ({
    contextAs,
  }) => {
    test.setTimeout(120_000);
    const admin = createAdminClient();
    const userId = await dualUserId();
    try {
      const context = await contextAs("parent-admin-dual");
      const page = await context.newPage();
      await page.goto("/admin");
      await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();

      const revoked = await admin.rpc("revoke_admin_role", { p_user: userId, p_actor: "e2e", p_reason: "revocation e2e" });
      expect(revoked.error).toBeNull();
      expect(revoked.data).toBe("revoked");

      // Same cookies, no re-login: the very next request is refused.
      await page.goto("/admin/review");
      await expect(page).toHaveURL(/\/parent/);
      await page.goto("/parent");
      await expect(page.getByRole("navigation", { name: "Workspace switcher" })).toHaveCount(0);

      const sameSession = await signedInClient(DUAL.email);
      const privileged = await sameSession.rpc("is_admin");
      expect(privileged.data).toBe(false);
      await sameSession.auth.signOut();

      // Parent data untouched and the audit trail recorded both events.
      const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).single();
      expect(profile?.role).toBe("parent");
      const { data: events } = await admin
        .from("role_audit_events")
        .select("action")
        .eq("user_id", userId)
        .order("id", { ascending: true });
      expect((events ?? []).map((event) => event.action)).toEqual(expect.arrayContaining(["grant", "revoke"]));
      const mutate = await admin.from("role_audit_events").update({ reason: "tampered" }).eq("user_id", userId);
      expect(mutate.error?.code).toBe("MM107");
    } finally {
      await admin.rpc("grant_admin_role", { p_user: userId, p_actor: "e2e", p_reason: "restore dual-role fixture" });
    }
    const restored = await (await contextAs("parent-admin-dual")).newPage();
    await restored.goto("/admin");
    await expect(restored.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  });
});
