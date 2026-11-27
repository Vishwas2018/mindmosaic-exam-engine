/**
 * Phase 4 hosted DEV acceptance: multi-role workspaces (PR #165) + UAT Assistant (PR #166) on the stable DEV alias.
 *
 * Safety: DEV only. Fixtures are throwaway accounts (never the owner's account); nothing is deleted. The dual fixture's
 * Admin entitlement is granted/revoked through the audited service-role RPCs and revoked afterwards. Global MFA is
 * read, never changed. No GitHub issue is created. Admin Review decisions are never submitted.
 * OWNER_EMAIL (optional) enables a READ-ONLY check of the owner's entitlement state; no sign-in as the owner.
 */
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import { devAdmin, expect, parentSignIn, RUN_ID, seededEmail, STRONG_PASSWORD, test } from "./fixtures";

const OUT = path.resolve("test-results", "hosted", RUN_ID);
const evidence: Record<string, unknown> = {};
const fixtures: { id: string; email: string; kind: string }[] = [];

async function makeUser(label: string, displayName: string) {
  const email = seededEmail(label);
  const { data, error } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: "parent" },
  });
  if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
  fixtures.push({ id: data.user.id, email, kind: label });
  return { id: data.user.id, email };
}

async function signIn(page: Page, email: string) {
  await parentSignIn(page, email, STRONG_PASSWORD);
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 45_000 });
}

const session = (page: Page) => page.evaluate(async () => (await fetch("/api/uat/session")).json());

let dual: { id: string; email: string };
let parentOnly: { id: string; email: string };

test.describe.serial("Phase 4 hosted: multi-role + UAT Assistant", () => {
  test.beforeAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    dual = await makeUser("p4-dual", "P4 Dual Role");
    parentOnly = await makeUser("p4-parent", "P4 Parent Only");
    const grant = await devAdmin().rpc("grant_admin_role", {
      p_user: dual.id,
      p_actor: "e2e:hosted-phase4",
      p_reason: "Phase 4 hosted acceptance dual-role fixture",
    });
    if (grant.error) throw new Error(`grant fixture admin: ${grant.error.message}`);
    evidence["fixture-grant"] = grant.data;
  });

  test.afterAll(async () => {
    const revoke = await devAdmin().rpc("revoke_admin_role", {
      p_user: dual.id,
      p_actor: "e2e:hosted-phase4",
      p_reason: "Phase 4 hosted acceptance complete",
    });
    evidence["fixture-revoke"] = revoke.error ? `ERROR ${revoke.error.message}` : revoke.data;
    evidence.fixtures = fixtures;
    fs.writeFileSync(path.join(OUT, "phase4-evidence.json"), JSON.stringify(evidence, null, 2));
  });

  test("P4-0 read-only: global MFA off, owner entitlement state, admin counts", async () => {
    const s = await devAdmin().from("security_settings").select("key,bool_value").eq("key", "require_admin_mfa").single();
    evidence["P4-0-require_admin_mfa"] = s.data?.bool_value;
    expect(s.data?.bool_value).toBe(false);

    const active = await devAdmin().from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "admin").is("revoked_at", null);
    evidence["P4-0-active-admin-entitlements-incl-fixture"] = active.count;

    const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
    if (ownerEmail) {
      const list = await devAdmin().auth.admin.listUsers({ page: 1, perPage: 1000 });
      const owner = list.data.users.find((u) => u.email?.toLowerCase() === ownerEmail);
      expect(owner, "owner account exists on DEV").toBeTruthy();
      const prof = await devAdmin().from("profiles").select("role,display_name,access_revoked_at").eq("id", owner!.id).single();
      const roles = await devAdmin().from("user_roles").select("role,revoked_at").eq("user_id", owner!.id);
      const factors = owner!.factors?.map((f) => ({ type: f.factor_type, status: f.status })) ?? [];
      evidence["P4-0-owner"] = { profileRole: prof.data?.role, displayName: prof.data?.display_name, revoked: prof.data?.access_revoked_at, roles: roles.data, mfaFactors: factors };
      expect(prof.data?.role).toBe("parent");
      expect(roles.data?.some((r) => r.role === "admin" && r.revoked_at === null)).toBe(true);
    }
  });

  test("P4-1 dual-role: switcher both ways on one session, Admin Review reachable, parent area unchanged", async ({ page }) => {
    await signIn(page, dual.email);
    await page.goto("/parent");
    const switcher = page.getByRole("navigation", { name: "Workspace switcher" });
    await expect(switcher).toBeVisible({ timeout: 30_000 });
    await expect(switcher.getByRole("link", { name: "Parent" })).toHaveAttribute("aria-current", "page");

    await switcher.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    const adminSwitcher = page.getByRole("navigation", { name: "Workspace switcher" });
    await expect(adminSwitcher.getByRole("link", { name: "Admin" })).toHaveAttribute("aria-current", "page");

    await page.goto("/admin/review");
    await expect(page).toHaveURL(/\/admin\/review/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    evidence["P4-1-admin-review-h1"] = await page.getByRole("heading", { level: 1 }).first().innerText();

    await adminSwitcher.getByRole("link", { name: "Parent" }).click();
    await expect(page).toHaveURL(/\/parent(\/setup)?$/);
    await expect(page).not.toHaveURL(/billing|pricing|sign-in/);
    evidence["P4-1"] = "switch parent->admin->review->parent on one session OK";
  });

  test("P4-2 parent-only: no switcher, /admin and /admin/review denied, no UAT assistant", async ({ page }) => {
    await signIn(page, parentOnly.email);
    await page.goto("/parent");
    await expect(page.getByRole("navigation", { name: "Workspace switcher" })).toHaveCount(0);
    for (const p of ["/admin", "/admin/review", "/admin/questions"]) {
      await page.goto(p);
      await expect(page, p).not.toHaveURL(/\/admin/);
    }
    await page.goto("/parent");
    await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
    const s = await session(page);
    evidence["P4-2-session"] = { enabled: s.enabled };
    expect(s.enabled).toBe(false);
  });

  test("P4-3 cross-portal UAT Assistant: launcher in Parent, Admin, Admin Review and public pages; no secrets", async ({ page }) => {
    await signIn(page, dual.email);
    const seen: Record<string, unknown> = {};
    for (const p of ["/parent", "/admin", "/admin/review", "/pricing"]) {
      await page.goto(p);
      await expect(page.getByTestId("uat-floating-launcher"), p).toBeVisible({ timeout: 30_000 });
      const s = await session(page);
      expect(s.enabled).toBe(true);
      expect(JSON.stringify(s)).not.toMatch(/sk[-_]|nvapi-|ghp_|Bearer|eyJ[A-Za-z0-9_-]{20,}/);
      seen[p] = { activeRole: s.activeRole, authorizedVia: s.authorizedVia, aiConfigured: s.aiConfigured };
    }
    evidence["P4-3-portals"] = seen;
    expect((seen["/admin"] as { authorizedVia: string }).authorizedVia).toBe("admin_role");
  });

  test("P4-4 LIVE NVIDIA rewrite from the Parent portal (no mocks)", async ({ page }) => {
    await signIn(page, dual.email);
    await page.goto("/parent");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });
    const s = await session(page);
    expect(s.aiConfigured).toBe(true);
    await page.getByTestId("uat-launcher-report-btn").click();
    const notes = "in the parent area the add child button looks cramped next to the heading on a phone, contact qa.person@example.org if unclear";
    await page.getByLabel(/Your observation notes/i).fill(notes);
    const resp = page.waitForResponse((r) => r.url().includes("/api/uat/improve") && r.request().method() === "POST");
    const t0 = Date.now();
    await page.getByTestId("uat-improve-ai-btn").click();
    const r = await resp;
    const json = await r.json();
    const elapsedMs = Date.now() - t0;
    const body = r.request().postData() ?? "";
    expect(body).not.toMatch(/nvapi-|NVIDIA_API_KEY|api[_-]?key|authorization|bearer|correctAnswer|answerKey/i);
    evidence["P4-4-nvidia"] = {
      status: r.status(), ok: json.ok, code: json.code, mode: json.draft?.mode, providerId: json.draft?.providerId,
      modelId: json.draft?.modelId, elapsedMs, titleLength: String(json.draft?.title ?? "").length,
    };
    expect(r.status()).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.draft.mode).toBe("ai");
    expect(json.draft.providerId).toBe("nvidia");
    expect(JSON.stringify(json.draft)).not.toContain("qa.person@example.org");
    expect(elapsedMs).toBeLessThan(30_000);
    await expect(page.getByLabel(/Your observation notes/i)).toHaveValue(notes);
  });

  test("P4-5 revocation: after Admin entitlement is revoked the same login loses Admin and UAT but keeps Parent", async ({ page }) => {
    // Uses a second throwaway dual fixture so the shared dual fixture stays intact for its afterAll revoke.
    const tmp = await makeUser("p4-revoke", "P4 Revoke Check");
    await devAdmin().rpc("grant_admin_role", { p_user: tmp.id, p_actor: "e2e:hosted-phase4", p_reason: "P4-5 fixture" });
    await signIn(page, tmp.email);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible({ timeout: 30_000 });
    const rv = await devAdmin().rpc("revoke_admin_role", { p_user: tmp.id, p_actor: "e2e:hosted-phase4", p_reason: "P4-5 revoke" });
    expect(rv.error).toBeNull();
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
    await page.goto("/parent");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByRole("navigation", { name: "Workspace switcher" })).toHaveCount(0);
    const s = await session(page);
    expect(s.enabled).toBe(false);
    evidence["P4-5"] = "revoked: /admin denied, switcher gone, UAT off, parent intact";
  });
});
