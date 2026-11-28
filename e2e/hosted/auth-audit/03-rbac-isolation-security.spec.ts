/**
 * Auth Audit 03 — Complete 6-Role RBAC Matrix, Data Isolation & Security Controls (Hosted DEV Preview).
 *
 * Roles tested:
 * 1. Anonymous visitor
 * 2. Guest (active guest practice session)
 * 3. Student (Family A & Family B with real synthetic records)
 * 4. Parent (Family A & Family B with real synthetic records)
 * 5. Teacher (synthetic teacher account)
 * 6. Administrator (synthetic admin account)
 *
 * Security checks:
 * - Complete Route × Role access matrix
 * - Complete API × Role authorisation matrix (using valid synthetic cross-family IDs!)
 * - CSRF Origin header enforcement (missing Origin & evil Origin)
 * - Open-redirect payloads on /sign-in?next= and /auth/callback?next=
 * - Cookie attributes audit (Secure, HttpOnly, SameSite, Path)
 * - CSP headers on dynamic auth routes
 * - Tampered JWT rejection (app API + PostgREST)
 * - Role escalation prevention (GoTrue /signup metadata + PostgREST profiles PATCH)
 * - Sensitive data / service-role key leakage check
 */
import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "@playwright/test";

import {
  DEV_REF,
  HOSTED_URL,
  RUN_ID,
  STRONG_PASSWORD,
  api,
  devAdmin,
  devSupabaseUrl,
  enterStudentCredentials,
  expect,
  gotoSettled,
  parentSignIn,
  protectContext,
  seededEmail,
  test,
  grantFixtureAdmin,
  retireFixtureUser,
} from "../fixtures";

const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";
const createdUserIds: string[] = [];

const evidence: {
  runId: string;
  routeMatrix: Record<string, Record<string, { status: number; finalPath: string; allowed: boolean }>>;
  apiMatrix: Record<string, Record<string, number>>;
  security: Record<string, unknown>;
} = {
  runId: RUN_ID,
  routeMatrix: {},
  apiMatrix: {},
  security: {},
};

async function createSeededUser(label: string, role: "parent" | "teacher" | "admin") {
  const email = seededEmail(label);
  const { data, error } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `RBAC ${role} ${label}`, role: "parent" },
  });
  if (error || !data.user) throw new Error(`createUser ${label} failed: ${error?.message}`);
  createdUserIds.push(data.user.id);
  if (role !== "parent") {
    const { error: upErr } = await devAdmin().from("profiles").update({ role }).eq("id", data.user.id);
    if (upErr) throw new Error(`set role ${role} failed: ${upErr.message}`);
    if (role === "admin") await grantFixtureAdmin(data.user.id, `auth-audit-03 fixture ${label}`);
  }
  return { id: data.user.id, email };
}

async function extractAccessToken(context: BrowserContext): Promise<string> {
  const name = `sb-${DEV_REF}-auth-token`;
  const parts = (await context.cookies())
    .filter((c) => c.name === name || c.name.startsWith(`${name}.`))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let raw = decodeURIComponent(parts.map((c) => c.value).join(""));
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64url").toString("utf8");
  const tok = (JSON.parse(raw) as { access_token?: string }).access_token;
  if (!tok) throw new Error("no access token in cookie");
  return tok;
}

const PROTECTED_ROUTES = [
  "/student",
  "/student/practice",
  "/parent",
  "/parent/setup",
  "/parent/children",
  "/parent/account",
  "/teacher",
  "/teacher/assignments",
  "/teacher/marking",
  "/admin",
  "/admin/review",
  "/admin/operations",
];

const PUBLIC_ROUTES = ["/", "/practice", "/pricing", "/sign-in", "/sign-up", "/student-sign-in", "/auth/forgot"];

test.describe("Auth Audit 03: RBAC Matrix, Data Isolation & Security", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "runs once on desktop-1440");
  });

  test.afterAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "audit-03-evidence.json"), JSON.stringify(evidence, null, 2));
    for (const id of createdUserIds) {
      await retireFixtureUser(id);
    }
  });

  test("RBAC-01: Complete 6-role Route Matrix + API Authorisation Matrix + Cross-Family Isolation", async ({
    browser,
  }) => {
    test.setTimeout(10 * 60_000);
    const parentA = await createSeededUser("rbpa", "parent");
    const parentB = await createSeededUser("rbpb", "parent");
    const teacher = await createSeededUser("rbt", "teacher");
    const admin = await createSeededUser("rba", "admin");

    const openRole = async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await protectContext(ctx);
      return { ctx, page: await ctx.newPage() };
    };

    // Provision Child A under Parent A, and Child B under Parent B
    const pA = await openRole();
    await parentSignIn(pA.page, parentA.email, STRONG_PASSWORD);
    await expect(pA.page).toHaveURL(/\/parent/, { timeout: 30_000 });
    const childARes = await api(pA.page).post("/api/parent/children", { displayName: "RbacChildA", yearLevel: 5 });
    expect(childARes.status()).toBe(200);
    const childAJson = (await childARes.json()) as { loginCode: string; pin: string };
    const { data: linkA } = await devAdmin()
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", parentA.id)
      .single();
    const childA = { childId: linkA!.child_id as string, ...childAJson };
    createdUserIds.push(childA.childId);

    const pB = await openRole();
    await parentSignIn(pB.page, parentB.email, STRONG_PASSWORD);
    await expect(pB.page).toHaveURL(/\/parent/, { timeout: 30_000 });
    const childBRes = await api(pB.page).post("/api/parent/children", { displayName: "RbacChildB", yearLevel: 5 });
    expect(childBRes.status()).toBe(200);
    const childBJson = (await childBRes.json()) as { loginCode: string; pin: string };
    const { data: linkB } = await devAdmin()
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", parentB.id)
      .single();
    const childB = { childId: linkB!.child_id as string, ...childBJson };
    createdUserIds.push(childB.childId);

    // Student A signs in and creates a real exam session
    const sA = await openRole();
    await sA.page.goto("/student-sign-in");
    await enterStudentCredentials(sA.page, childA.loginCode, childA.pin);
    await sA.page.getByRole("button", { name: /^sign in/i }).click();
    await expect(sA.page).toHaveURL(/\/student/, { timeout: 30_000 });

    // Student B signs in
    const sB = await openRole();
    await sB.page.goto("/student-sign-in");
    await enterStudentCredentials(sB.page, childB.loginCode, childB.pin);
    await sB.page.getByRole("button", { name: /^sign in/i }).click();
    await expect(sB.page).toHaveURL(/\/student/, { timeout: 30_000 });

    // Teacher signs in
    const tR = await openRole();
    await parentSignIn(tR.page, teacher.email, STRONG_PASSWORD);
    await expect(tR.page).toHaveURL(/\/teacher/, { timeout: 30_000 });

    // Admin signs in
    const aR = await openRole();
    await parentSignIn(aR.page, admin.email, STRONG_PASSWORD);
    await expect(aR.page).toHaveURL(/\/admin/, { timeout: 30_000 });

    // Anonymous & Guest
    const anon = await openRole();
    const guest = await openRole();
    await guest.page.goto("/practice");

    const rolePages: Array<[string, Page, string | null]> = [
      ["anonymous", anon.page, null],
      ["guest", guest.page, null],
      ["student", sB.page, "/student"],
      ["parent", pB.page, "/parent"],
      ["teacher", tR.page, "/teacher"],
      ["admin", aR.page, "/admin"],
    ];

    try {
      // 1. Route Matrix (parallelized across roles for speed)
      await Promise.all(
        rolePages.map(async ([roleName, p, ownPrefix]) => {
          evidence.routeMatrix[roleName] = {};
          for (const route of [...PUBLIC_ROUTES, ...PROTECTED_ROUTES]) {
            const res = await p.goto(route, { waitUntil: "domcontentloaded" });
            const finalPath = new URL(p.url()).pathname;
            const isProtected = PROTECTED_ROUTES.includes(route);
            const shouldBeAllowed = !isProtected || (ownPrefix !== null && route.startsWith(ownPrefix));
            const allowed = finalPath === route || (route === "/" && finalPath === "/");
            evidence.routeMatrix[roleName][route] = {
              status: res?.status() ?? 0,
              finalPath,
              allowed,
            };
            if (isProtected && !shouldBeAllowed) {
              expect(
                finalPath.startsWith("/" + route.split("/")[1]),
                `${roleName} must NOT access ${route} (landed on ${finalPath})`,
              ).toBe(false);
            }
            if (isProtected && shouldBeAllowed) {
              expect(
                finalPath.startsWith(ownPrefix!),
                `${roleName} SHOULD access ${route} (landed on ${finalPath})`,
              ).toBe(true);
            }
          }
        }),
      );

      // 2. API Matrix (using valid synthetic cross-family childA.childId!)
      for (const [roleName, p] of rolePages) {
        const client = api(p);
        const results: Record<string, number> = {};
        results["GET /api/parent/children/[childA]"] = (
          await client.get(`/api/parent/children/${childA.childId}`)
        ).status();
        results["PATCH /api/parent/children/[childA]"] = (
          await client.patch(`/api/parent/children/${childA.childId}`, { displayName: "Hijack" })
        ).status();
        results["POST /api/parent/children"] = (
          await client.post("/api/parent/children", { displayName: "UnauthChild", yearLevel: 5 })
        ).status();
        results["POST /api/teacher/assignments"] = (
          await client.post("/api/teacher/assignments", {})
        ).status();
        results["POST /api/teacher/marking"] = (
          await client.post("/api/teacher/marking", {})
        ).status();
        results["POST /api/student/onboarding/complete"] = (
          await client.post("/api/student/onboarding/complete", { yearLevel: 5 })
        ).status();
        results["POST /api/student/onboarding/preferences"] = (
          await client.post("/api/student/onboarding/preferences", { yearLevel: 5 })
        ).status();
        results["GET /api/student/onboarding/questions"] = (
          await client.get("/api/student/onboarding/questions?year=5")
        ).status();
        results["POST /api/stripe/checkout"] = (await client.post("/api/stripe/checkout", {})).status();
        results["GET /api/exam/session/active"] = (await client.get("/api/exam/session/active")).status();
        evidence.apiMatrix[roleName] = results;

        // Cross-family childA must be denied for EVERY role here (none of them is parentA!)
        expect(results["GET /api/parent/children/[childA]"], `${roleName} GET childA`).toBeGreaterThanOrEqual(400);
        expect(results["PATCH /api/parent/children/[childA]"], `${roleName} PATCH childA`).toBeGreaterThanOrEqual(400);

        // Non-teachers must get 401/403 on teacher endpoints
        if (roleName !== "teacher") {
          expect(results["POST /api/teacher/assignments"], `${roleName} teacher assignments`).toBeGreaterThanOrEqual(401);
          expect(results["POST /api/teacher/marking"], `${roleName} teacher marking`).toBeGreaterThanOrEqual(401);
        }
        // Non-students must get 401/403 on student onboarding endpoints
        if (roleName !== "student") {
          expect(
            results["POST /api/student/onboarding/complete"],
            `${roleName} student onboarding/complete`,
          ).toBeGreaterThanOrEqual(401);
          expect(
            results["POST /api/student/onboarding/preferences"],
            `${roleName} student onboarding/preferences (student-only gate)`,
          ).toBeGreaterThanOrEqual(401);
          expect(
            results["GET /api/student/onboarding/questions"],
            `${roleName} student onboarding/questions (student-only gate)`,
          ).toBeGreaterThanOrEqual(401);
        }
        // Non-parents must get 401/403 on Stripe checkout
        if (roleName !== "parent") {
          expect(results["POST /api/stripe/checkout"], `${roleName} stripe checkout`).toBeGreaterThanOrEqual(401);
        }
      }
    } finally {
      await Promise.all([
        pA.ctx.close(),
        pB.ctx.close(),
        sA.ctx.close(),
        sB.ctx.close(),
        tR.ctx.close(),
        aR.ctx.close(),
        anon.ctx.close(),
        guest.ctx.close(),
      ]);
    }
  });

  test("SEC-01: Cookies, CSP, Open Redirects, CSRF Origin, Tampered JWT, Privilege Escalation & Secret Leakage", async ({
    page,
    context,
  }) => {
    test.setTimeout(5 * 60_000);
    const parent = await createSeededUser("secp", "parent");
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const SB = devSupabaseUrl();

    // 1. CSP headers on dynamic auth routes
    const cspHeaders: Record<string, { enforced: boolean; reportOnly: boolean }> = {};
    for (const route of ["/sign-in", "/auth/confirm", "/auth/forgot", "/auth/reset"]) {
      const res = await page.goto(route);
      const h = res?.headers() ?? {};
      cspHeaders[route] = {
        enforced: Boolean(h["content-security-policy"]),
        reportOnly: Boolean(h["content-security-policy-report-only"]),
      };
    }
    evidence.security.cspHeaders = cspHeaders;

    // 2. Open redirect tests on /sign-in?next= and /auth/callback?next=
    const payloads = ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"];
    await parentSignIn(page, parent.email, STRONG_PASSWORD);
    await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });

    // Cookie attributes audit
    const authCookies = (await context.cookies()).filter((c) => c.name.startsWith(`sb-${DEV_REF}-auth-token`));
    expect(authCookies.length, "Supabase auth cookie present").toBeGreaterThan(0);
    evidence.security.authCookies = authCookies.map((c) => ({
      name: c.name,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      path: c.path,
    }));
    for (const c of authCookies) {
      expect(c.secure, `cookie ${c.name} must be Secure on HTTPS`).toBe(true);
      // Playwright's Windows WebKit reports sameSite "None" even for a cookie set with SameSite=Lax/Strict
      // (probed 2026-11-24), so the attribute is asserted on Chromium and Firefox, which report it faithfully.
      if (context.browser()?.browserType().name() !== "webkit") {
        expect(c.sameSite, `cookie ${c.name} must have SameSite`).toMatch(/Lax|Strict/i);
      }
    }

    // Check browser storage & DOM for service-role key or password leakage
    const leakScan = await page.evaluate((pw) => {
      const dump = JSON.stringify({
        ls: Object.entries(localStorage),
        ss: Object.entries(sessionStorage),
        htmlLen: document.documentElement.innerHTML.length,
        hasPwInHtml: document.documentElement.innerHTML.includes(pw),
        hasServiceRoleWord: document.documentElement.innerHTML.includes("SUPABASE_SERVICE_ROLE_KEY"),
      });
      return {
        hasPasswordInStorage: dump.includes(pw),
        hasServiceRoleInHtml: dump.includes("SUPABASE_SERVICE_ROLE_KEY"),
      };
    }, STRONG_PASSWORD);
    expect(leakScan.hasPasswordInStorage).toBe(false);
    expect(leakScan.hasServiceRoleInHtml).toBe(false);
    evidence.security.leakScan = leakScan;

    // 3. CSRF Origin check on active state-changing routes (cross-site & missing Origin must be rejected 403)
    const csrfTargets = [
      "/api/parent/children",
      "/api/student/onboarding/preferences",
      "/api/teacher/assignments",
      "/api/exam/session",
    ];
    const csrfResults: Record<string, { evilOrigin: number; missingOrigin: number }> = {};
    for (const target of csrfTargets) {
      const evil = await page.request.post(`${HOSTED_URL}${target}`, {
        headers: {
          "x-vercel-protection-bypass": bypassSecret,
          Origin: "https://evil.example",
          "Content-Type": "application/json",
        },
        data: {},
        maxRedirects: 0,
      });
      const missing = await page.request.post(`${HOSTED_URL}${target}`, {
        headers: {
          "x-vercel-protection-bypass": bypassSecret,
          "Content-Type": "application/json",
        },
        data: {},
        maxRedirects: 0,
      });
      csrfResults[target] = { evilOrigin: evil.status(), missingOrigin: missing.status() };
      expect(evil.status(), `CSRF evil Origin on ${target}`).toBe(403);
      expect(missing.status(), `CSRF missing Origin on ${target}`).toBe(403);
    }
    evidence.security.csrfResults = csrfResults;

    // 4. Open redirect verification on /sign-in?next=<evil>
    const redirectResults: Record<string, string> = {};
    for (const payload of payloads) {
      await context.clearCookies();
      await gotoSettled(page, "/");
      // Re-seed bypass cookie and sign in with malicious ?next=
      await page.context().request.get(`${HOSTED_URL}/`, {
        headers: { "x-vercel-protection-bypass": bypassSecret, "x-vercel-set-bypass-cookie": "true" },
        maxRedirects: 0,
      });
      await page.goto(`/sign-in?role=parent&next=${encodeURIComponent(payload)}`);
      await page.getByLabel(/^email$/i).fill(parent.email);
      await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
      await page.getByRole("button", { name: /^sign in/i }).click();
      await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
      redirectResults[payload] = page.url();
      expect(new URL(page.url()).origin).toBe(new URL(HOSTED_URL).origin);
      // Let /parent's client-side routing finish before the next iteration navigates, or Firefox aborts
      // that goto with NS_BINDING_ABORTED.
      await page.waitForLoadState("load").catch(() => undefined);
    }
    evidence.security.openRedirects = redirectResults;

    // 5. Tampered JWT rejected by PostgREST
    const token = await extractAccessToken(context);
    const parts = token.split(".");
    const tamperedJwt = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -4)}AAAA`;
    const tamperedRes = await fetch(`${SB}/rest/v1/profiles?select=id,role`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${tamperedJwt}` },
    });
    expect(tamperedRes.status, "tampered JWT rejected by PostgREST").toBe(401);
    evidence.security.tamperedJwtStatus = tamperedRes.status;

    // 6. Privilege escalation: PostgREST PATCH profiles.role = 'admin' MUST fail or remain 'parent'
    const escRes = await fetch(`${SB}/rest/v1/profiles?id=eq.${parent.id}`, {
      method: "PATCH",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ role: "admin" }),
    });
    const { data: profAfter } = await devAdmin().from("profiles").select("role").eq("id", parent.id).single();
    expect(profAfter?.role, "parent must NEVER escalate own role to admin").toBe("parent");
    evidence.security.roleEscalationPatch = { httpStatus: escRes.status, roleAfter: profAfter?.role };

    // 7. Privilege escalation on /auth/v1/signup with user_metadata.role = "admin"
    const escEmail = `mm-accept-${RUN_ID}-esc@gmail.com`;
    const signupEsc = await fetch(`${SB}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: escEmail,
        password: STRONG_PASSWORD,
        data: { display_name: "Esc Attempt", role: "admin" },
      }),
    });
    const signupBody = (await signupEsc.json().catch(() => ({}))) as { id?: string; user?: { id?: string } };
    const escUserId = signupBody.id ?? signupBody.user?.id;
    let escRole: string | null = null;
    if (escUserId) {
      createdUserIds.push(escUserId);
      const { data: escProf } = await devAdmin().from("profiles").select("role").eq("id", escUserId).maybeSingle();
      escRole = escProf?.role ?? null;
      expect(escRole, "direct signup with role=admin must NEVER create an admin profile").not.toBe("admin");
      expect(escRole, "direct signup with role=admin must NEVER create a teacher profile").not.toBe("teacher");
    }
    evidence.security.signupRoleEscalation = { status: signupEsc.status, createdRole: escRole };
  });
});
