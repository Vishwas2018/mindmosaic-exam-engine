import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import { test, expect } from "../fixtures/auth.fixture";
import { e2eEnv } from "../fixtures/env";
import { ALL_IDENTITIES } from "../fixtures/identities";
import { buildAuthCookies, signInWithPassword } from "../fixtures/session-cookie";

async function startAuthUatServer(portOffset: number): Promise<{ origin: string; stop: () => void }> {
  const basePort = Number(process.env.PW_AUTH_PORT) || 3101;
  const port = basePort + portOffset;
  const origin = `http://127.0.0.1:${port}`;
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: e2eEnv.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: e2eEnv.supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: e2eEnv.supabaseServiceRoleKey,
    MM_UAT_ASSISTANT_ENABLED: "1",
    BILLING_ENFORCEMENT_ENABLED: "",
  };

  const server: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port), "--keepAliveTimeout", "120000"],
    { env, stdio: "ignore" },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`${origin}/sign-in`);
      if (res.status > 0) {
        return { origin, stop: () => server.kill() };
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  server.kill();
  throw new Error(`Timed out waiting for auth UAT server on ${origin}`);
}

test.describe("UAT Assistant — role restriction, cross-portal tester session & enforced Admin CSP", () => {
  test("blocks guests and ordinary students/parents, enables for Admin with zero CSP violations, and persists across Parent/Student portals", async ({
    browser,
  }, testInfo) => {
    testInfo.setTimeout(180_000);
    const srv = await startAuthUatServer(55);

    try {
      // 1. Ordinary student without prior admin UAT session NEVER sees the UAT launcher
      const studentIdentity = ALL_IDENTITIES.find((i) => i.kind === "student")!;
      const studentCtx = await browser.newContext();
      const studentSession = await signInWithPassword(studentIdentity.email, e2eEnv.fixturePin);
      await studentCtx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, studentSession));
      const studentPage = await studentCtx.newPage();
      await studentPage.goto(`${srv.origin}/student`);
      await expect(studentPage.getByTestId("uat-floating-launcher")).toHaveCount(0);
      const deniedDashboard = await studentPage.goto(`${srv.origin}/dev/uat`);
      expect(deniedDashboard?.url()).toContain("/sign-in");
      await studentCtx.close();

      // 2. Admin visits /admin under enforced CSP -> launcher renders with ZERO CSP violations!
      const adminIdentity = ALL_IDENTITIES.find((i) => i.key === "admin")!;
      const testerCtx = await browser.newContext();
      const adminSession = await signInWithPassword(adminIdentity.email, e2eEnv.fixturePassword);
      await testerCtx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, adminSession));

      const page = await testerCtx.newPage();
      const cspViolations: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (e) => {
          if (
            e.violatedDirective.startsWith("script-src") &&
            e.blockedURI === "eval" &&
            /\/_next\/static\//.test(e.sourceFile ?? "")
          ) {
            return;
          }
          (window as unknown as { __v?: string[] }).__v ??= [];
          (window as unknown as { __v: string[] }).__v.push(
            `${e.violatedDirective} blocked ${e.blockedURI}`,
          );
        });
      });

      const adminRes = await page.goto(`${srv.origin}/admin`);
      expect(adminRes?.headers()["content-security-policy"]).toContain("'strict-dynamic'");
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // Open Report modal on /admin to ensure dynamic chunk + dialog works under enforced Admin CSP
      await page.getByTestId("uat-launcher-report-btn").click();
      await expect(page.getByTestId("uat-report-dialog")).toBeVisible();
      await page.keyboard.press("Escape");

      const recordedViolations = await page.evaluate(
        () => (window as unknown as { __v?: string[] }).__v ?? [],
      );
      cspViolations.push(...recordedViolations);
      expect(cspViolations).toEqual([]);

      // 3. Same tester switches cookies to Parent and Student portals — signed mm_uat_tester cookie keeps UAT active!
      const parentIdentity = ALL_IDENTITIES.find((i) => i.kind === "parent")!;
      const parentSession = await signInWithPassword(parentIdentity.email, e2eEnv.fixturePassword);
      await testerCtx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, parentSession));
      await page.goto(`${srv.origin}/parent`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      await testerCtx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, studentSession));
      await page.goto(`${srv.origin}/student`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      await testerCtx.close();
    } finally {
      srv.stop();
    }
  });
});

test.describe("UAT Assistant — secure tester-session lifecycle (End session, revocation)", () => {
  async function setAccessRevoked(userId: string, revokedAt: string | null): Promise<void> {
    const res = await fetch(`${e2eEnv.supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: {
        apikey: e2eEnv.supabaseServiceRoleKey,
        authorization: `Bearer ${e2eEnv.supabaseServiceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=minimal",
      },
      body: JSON.stringify({ access_revoked_at: revokedAt }),
    });
    expect(res.status).toBeLessThan(300);
  }

  test("revoking the administrator ends the tester cookie immediately, even on a Student account", async ({
    browser,
  }, testInfo) => {
    testInfo.setTimeout(180_000);
    const srv = await startAuthUatServer(56);
    const adminIdentity = ALL_IDENTITIES.find((i) => i.key === "admin")!;
    const studentIdentity = ALL_IDENTITIES.find((i) => i.kind === "student")!;
    const adminSession = await signInWithPassword(adminIdentity.email, e2eEnv.fixturePassword);
    const studentSession = await signInWithPassword(studentIdentity.email, e2eEnv.fixturePin);
    const adminId = (adminSession.user as { id: string }).id;
    const ctx = await browser.newContext();

    try {
      await ctx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, adminSession));
      const page = await ctx.newPage();
      await page.goto(`${srv.origin}/admin`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // Switch to the Student account: the signed cookie keeps UAT on (re-validated server side).
      await ctx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, studentSession));
      await page.goto(`${srv.origin}/student`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // Revoke the administrator: the very next request refuses UAT and discards the credential.
      await setAccessRevoked(adminId, new Date().toISOString());
      await page.goto(`${srv.origin}/student`);
      await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
      const state = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
      expect(state).toEqual({ enabled: false });
      const names = (await ctx.cookies(srv.origin)).map((c) => c.name);
      expect(names).not.toContain("mm_uat_tester");

      const improve = await page.evaluate(async () => {
        const res = await fetch("/api/uat/improve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ originalNotes: "x" }),
        });
        return res.status;
      });
      expect(improve).toBe(403);
    } finally {
      await setAccessRevoked(adminId, null).catch(() => {});
      await ctx.close();
      srv.stop();
    }
  });

  test("End UAT session switches the assistant off for a signed-in admin until explicitly restarted", async ({
    browser,
  }, testInfo) => {
    testInfo.setTimeout(150_000);
    const srv = await startAuthUatServer(57);
    const adminIdentity = ALL_IDENTITIES.find((i) => i.key === "admin")!;
    const adminSession = await signInWithPassword(adminIdentity.email, e2eEnv.fixturePassword);
    const ctx = await browser.newContext();

    try {
      await ctx.addCookies(buildAuthCookies(srv.origin, e2eEnv.supabaseUrl, adminSession));
      const page = await ctx.newPage();
      await page.goto(`${srv.origin}/admin`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      await page.getByTestId("uat-launcher-end-btn").click();
      await page.getByTestId("uat-end-confirm-btn").click();
      await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);

      // Still signed in as an admin, yet the assistant stays off.
      await page.goto(`${srv.origin}/admin`);
      await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
      const off = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
      expect(off).toEqual({ enabled: false, ended: true });

      // Explicit restart re-validates the entitlement and mints a fresh session.
      await page.goto(`${srv.origin}/dev/uat`);
      await page.getByTestId("uat-start-session").click();
      await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
      await page.goto(`${srv.origin}/admin`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();
    } finally {
      await ctx.close();
      srv.stop();
    }
  });
});
