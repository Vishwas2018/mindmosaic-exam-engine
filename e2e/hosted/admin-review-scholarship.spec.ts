/**
 * Hosted DEV acceptance for the Scholarship Admin Portal (/admin/review) on PR #162.
 *
 * Safety (agreed with the owner):
 * - DEV only (fixtures guard the Supabase ref). A throwaway fixture admin "Fixture Reviewer" is created and deleted.
 * - This spec writes NO decision rows to DEV (admin_draft_review_decisions is append-only, so any row would be
 *   permanent history). It asserts zero ledger rows attributable to this run (fixture ids / run email / probe rows); it never assumes a table is globally empty. Persistent
 *   Approve / Request revision / Reject tests run only on a throwaway local Supabase
 *   (e2e/auth/admin-review-decisions-isolated.spec.ts). DB-level refusals (AR-04) persist nothing.
 * - Nothing is published.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";
import {
  devAdmin,
  devSupabaseUrl,
  expect,
  parentSignIn,
  RUN_ID,
  seededEmail,
  STRONG_PASSWORD,
  test,
} from "./fixtures";

const OUT = path.resolve("test-results", "hosted", RUN_ID);
const BANK = "/admin/review?bank=vihaan-scholarship-500";
const DEFECT_ID = "vihaan-e500-m069";
const FIXTURE_NAME = "Fixture Reviewer";
const HASH = "a".repeat(64);
const evidence: Record<string, unknown> = {};
const created: string[] = [];

async function makeUser(
  label: string,
  role: "parent" | "admin",
  displayName: string,
) {
  const email = seededEmail(label);
  const { data, error } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: "parent" },
  });
  if (error || !data.user)
    throw new Error(`createUser ${label}: ${error?.message}`);
  created.push(data.user.id);
  const { error: upErr } = await devAdmin()
    .from("profiles")
    .update({ role, display_name: displayName })
    .eq("id", data.user.id);
  if (upErr) throw new Error(`profile ${label}: ${upErr.message}`);
  return { id: data.user.id, email };
}

/**
 * Non-destructive, fixture-scoped ledger checks. DEV will hold genuine human review decisions, so nothing here may assume
 * a table is globally empty. The automation's guarantee is: no row is attributable to ANY identity this run created
 * (the fixture admins/parents, by reviewer id or by the run's seeded email), and none of the probe rows AR-04 attempts
 * ever persisted. The global counts are recorded as evidence only (never asserted), so concurrent human reviews cannot
 * make this spec flaky and real history is never read for content or touched.
 */
const PROBE_QUESTION = "probe-q";

async function ledgerAttributableToRun(): Promise<{
  decisions: number;
  approves: number;
  legacyApprovals: number;
  probeRows: number;
}> {
  const db = devAdmin();
  const ids = created.length ? created : ["00000000-0000-0000-0000-000000000000"];
  const count = async (
    table: string,
    apply: (q: ReturnType<typeof base>) => unknown,
  ) => {
    const q = base(table);
    const { count: n, error } = (await apply(q)) as { count: number | null; error: { message: string } | null };
    if (error) throw new Error(`${table}: ${error.message}`);
    return n ?? 0;
  };
  function base(table: string) {
    return db.from(table).select("id", { count: "exact", head: true });
  }
  const runEmail = `mm-accept-${RUN_ID}-%`;
  const byId = await count("admin_draft_review_decisions", (q) => q.in("reviewer_id", ids));
  const byEmail = await count("admin_draft_review_decisions", (q) => q.like("reviewer_email", runEmail));
  const approves = await count("admin_draft_review_decisions", (q) =>
    q.eq("decision", "approve").in("reviewer_id", ids),
  );
  const legacyApprovals = await count("admin_draft_review_approvals", (q) => q.in("approved_by", ids));
  const probeRows = await count("admin_draft_review_decisions", (q) => q.eq("question_id", PROBE_QUESTION));
  return { decisions: byId + byEmail, approves, legacyApprovals, probeRows };
}

async function expectRunCreatedNoLedgerRows() {
  expect(await ledgerAttributableToRun()).toEqual({
    decisions: 0,
    approves: 0,
    legacyApprovals: 0,
    probeRows: 0,
  });
}

async function globalLedgerSnapshot() {
  const db = devAdmin();
  const n = async (table: string) =>
    (await db.from(table).select("id", { count: "exact", head: true })).count ?? null;
  return {
    decisions: await n("admin_draft_review_decisions"),
    legacyApprovals: await n("admin_draft_review_approvals"),
  };
}

async function adminSignIn(page: Page, email: string) {
  await parentSignIn(page, email, STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
}

test.describe("Admin Review 162: hosted DEV acceptance", () => {
  test.afterAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, "admin-review-evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    for (const id of created)
      await devAdmin()
        .auth.admin.deleteUser(id)
        .catch(() => undefined);
  });

  test("AR-01 non-admin roles and guests are denied; no draft content leaks", async ({
    page,
    browser,
  }) => {
    test.skip(test.info().project.name !== "desktop-1440", "desktop only");
    const parent = await makeUser("arp", "parent", "Pat Parent");
    // Guest
    await page.goto("/admin/review");
    await expect(page).not.toHaveURL(/\/admin\/review$/);
    await expect(page.getByText("vihaan-e500-m001")).toHaveCount(0);
    // Parent
    const ctx = await browser.newContext();
    const { protectContext } = await import("./fixtures");
    await protectContext(ctx);
    const p = await ctx.newPage();
    await parentSignIn(p, parent.email, STRONG_PASSWORD);
    await p.goto("/admin/review?bank=vihaan-scholarship-500");
    await expect(p).not.toHaveURL(/\/admin\/review/);
    await expect(p.getByText(DEFECT_ID)).toHaveCount(0);
    await ctx.close();
    evidence["AR-01"] = "guest and parent denied";
  });

  test("AR-02 pools, blind-first solving, writing rubric, locked reviewer identity, approval gate (no approve submitted)", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "desktop-1440", "desktop only");
    test.setTimeout(240_000);
    evidence["AR-02-global-ledger-before"] = await globalLedgerSnapshot();
    const admin = await makeUser("ara", "admin", FIXTURE_NAME);
    await adminSignIn(page, admin.email);
    await page.goto(BANK);
    await expect(
      page.getByRole("status").filter({ hasText: /drafts match your filters/ }),
    ).toHaveText("500 drafts match your filters", { timeout: 60_000 });

    // Practice / mock separation
    for (const [pool, n] of [
      ["practice", 400],
      ["mock", 100],
      ["mock-a", 50],
      ["mock-b", 50],
    ] as const) {
      await page.getByLabel("Pool", { exact: true }).selectOption(pool);
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: /drafts match your filters/ }),
      ).toHaveText(`${n} drafts match your filters`);
    }
    await page.getByLabel("Pool", { exact: true }).selectOption("");

    // Writing prompts use the rubric
    await page.getByLabel("Section", { exact: true }).selectOption("writing");
    await expect(
      page.getByRole("status").filter({ hasText: /drafts match your filters/ }),
    ).toHaveText("40 drafts match your filters");
    await expect(
      page.getByText("Written Expression — Human Rubric Only"),
    ).toBeVisible();

    // Blind-first: answer key hidden until the reviewer solves
    await page.getByLabel("Section", { exact: true }).selectOption("numeracy");
    await expect(page.getByText("Blind solve mode")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Declared answer" }),
    ).toHaveCount(0);
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Submit preview answer" }).click();
    await expect(
      page.getByRole("heading", { name: "Declared answer" }),
    ).toBeVisible();

    // Reviewer identity is read-only and equals the server profile name
    const nameInput = page.getByLabel(/Verified human reviewer identity/i);
    await expect(nameInput).toHaveAttribute("readonly", "");
    await expect(nameInput).toHaveValue(FIXTURE_NAME);

    // Approve gate: button is gated until every checklist box is ticked. We do NOT submit.
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    const submit = page.getByRole("button", {
      name: "Record my explicit approval",
    });
    await expect(submit).toBeDisabled();
    const boxes = page.getByRole("checkbox");
    const n = await boxes.count();
    for (let i = 0; i < n; i += 1) await boxes.nth(i).check();
    await expect(submit).toBeEnabled();
    for (let i = 0; i < n; i += 1) await boxes.nth(i).uncheck();
    await expect(submit).toBeDisabled();

    // Known defect cannot be approved
    await page.getByLabel("Section", { exact: true }).selectOption("");
    await page
      .getByRole("combobox", { name: "Question", exact: true })
      .selectOption(DEFECT_ID);
    await expect(
      page.getByText(/Approval blocked — Known Defect A-06/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Approve", exact: true }),
    ).toBeDisabled();

    await expectRunCreatedNoLedgerRows();
    evidence["AR-02"] = {
      pools: "400/100/50/50",
      writing: 40,
      runAttributableLedgerRows: 0,
      reviewer: FIXTURE_NAME,
    };
  });

  test("AR-03 Request revision and Reject controls validate input; NOTHING is submitted on DEV (persistent writes run only in the isolated stack)", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "desktop-1440", "desktop only");
    test.setTimeout(240_000);
    const admin = await makeUser("arw", "admin", FIXTURE_NAME);
    await adminSignIn(page, admin.email);
    await page.goto(BANK);
    await expect(
      page.getByRole("status").filter({ hasText: /drafts match your filters/ }),
    ).toHaveText("500 drafts match your filters", { timeout: 60_000 });
    await page
      .getByRole("combobox", { name: "Question", exact: true })
      .selectOption(DEFECT_ID);

    for (const [toggle, submitName] of [
      ["Request revision", "Record revision request"],
      ["Reject", "Record rejection"],
    ] as const) {
      await page.getByRole("button", { name: toggle, exact: true }).click();
      const submit = page.getByRole("button", { name: submitName });
      await expect(submit).toBeDisabled(); // no rationale
      await page.getByLabel(/Required rationale/i).fill("short");
      await expect(submit).toBeDisabled(); // below the 10-character floor
      await page
        .getByLabel(/Required rationale/i)
        .fill("A sufficiently long rationale, never submitted on DEV.");
      await expect(submit).toBeEnabled();
      await page.getByLabel(/Required rationale/i).fill("");
    }
    // Nothing is attributable to this run's identities (see ledgerAttributableToRun); real history is untouched.
    await expectRunCreatedNoLedgerRows();
    evidence["AR-03"] = {
      submitted: 0,
      note: "persistent write paths covered by e2e/auth/admin-review-decisions-isolated.spec.ts on a throwaway local stack",
    };
  });

  test("AR-04 database refuses impersonation, non-admin writes, tampering and anon access", async () => {
    test.skip(test.info().project.name !== "desktop-1440", "desktop only");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    expect(anonKey.length).toBeGreaterThan(20);
    const url = devSupabaseUrl();
    const admin = await makeUser("arq", "admin", FIXTURE_NAME);
    const parent = await makeUser("arq2", "parent", "Pat Parent");
    const mk = async (email: string) => {
      const c = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await c.auth.signInWithPassword({
        email,
        password: STRONG_PASSWORD,
      });
      if (error) throw new Error(`sign-in ${email}: ${error.message}`);
      return c;
    };
    const row = (
      reviewer_id: string,
      reviewer_name: string,
      reviewer_email: string,
      decision = "revise",
    ) => ({
      bank_id: "vihaan-scholarship-500",
      batch_id: "probe",
      question_id: "probe-q",
      item_kind: "question",
      pool: "practice",
      source_revision: "probe",
      content_hash: HASH,
      published_content_hash: HASH,
      decision,
      checks: {},
      notes: "probe note long enough",
      reviewer_id,
      reviewer_name,
      reviewer_email,
      question_snapshot: {},
      evidence_fingerprint: HASH,
    });
    const t = "admin_draft_review_decisions";

    const adminC = await mk(admin.email);
    const parentC = await mk(parent.email);
    const anonC = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Impersonation: admin under another name / another admin's id / another email
    const r1 = await adminC
      .from(t)
      .insert(row(admin.id, "Someone Else", admin.email));
    expect(r1.error?.code).toBe("42501");
    const r2 = await adminC
      .from(t)
      .insert(row(parent.id, FIXTURE_NAME, admin.email));
    expect(r2.error?.code).toBe("42501");
    const r3 = await adminC
      .from(t)
      .insert(row(admin.id, FIXTURE_NAME, "other@example.com"));
    expect(r3.error?.code).toBe("42501");
    // Non-admin cannot write or read; anon cannot read
    const r4 = await parentC
      .from(t)
      .insert(row(parent.id, "Pat Parent", parent.email));
    expect(r4.error?.code).toBe("42501");
    const r5 = await parentC.from(t).select("id");
    expect(r5.error ? true : (r5.data ?? []).length === 0).toBe(true);
    const r6 = await anonC.from(t).select("id");
    expect(r6.error?.code === "42501" || (r6.data ?? []).length === 0).toBe(
      true,
    );
    // Tampering: an admin's UPDATE/DELETE must be refused. These are filtered to THIS fixture's reviewer id, so they can
    // never match (let alone modify) a genuine human decision. The append-only trigger (MM106), including for the service
    // role on real rows, is proven on the throwaway stack by e2e/auth/admin-review-decisions-isolated.spec.ts.
    const u = await adminC
      .from(t)
      .update({ notes: "tampered tampered" })
      .eq("reviewer_id", admin.id)
      .select();
    expect(u.error !== null || (u.data ?? []).length === 0).toBe(true);
    const d = await adminC.from(t).delete().eq("reviewer_id", admin.id).select();
    expect(d.error !== null || (d.data ?? []).length === 0).toBe(true);
    await expectRunCreatedNoLedgerRows();
    evidence["AR-04"] = {
      impersonation: "42501 x3",
      nonAdminWrite: "42501",
      anon: "denied",
      tamper: "refused",
      runAttributableLedgerRows: 0,
    };
  });

  test("AR-06 smoke: both Scholarship banks load for an admin, CSP is enforced, nothing is approved or published", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "desktop-1440", "desktop only");
    test.setTimeout(240_000);
    const admin = await makeUser("ar6", "admin", FIXTURE_NAME);
    await adminSignIn(page, admin.email);
    const countStatus = (n: number) =>
      expect(
        page
          .getByRole("status")
          .filter({ hasText: /drafts match your filters/ }),
      ).toHaveText(`${n} drafts match your filters`, { timeout: 60_000 });

    // Bank 1: Y6 Core (default)
    const res = await page.goto("/admin/review");
    await countStatus(160);
    const headers = res?.headers() ?? {};
    // First run (kept under merge-evidence/*FIRST-RUN-AR06-failed*) asserted an enforced policy while src/proxy.ts
    // still sent /admin as Report-Only, so it failed correctly. Admin CSP enforcement now ships in the same stack:
    // on Preview /admin/* must carry an ENFORCED nonce policy and no report-only twin, and /sign-in stays enforced.
    expect(headers["content-security-policy"] ?? "").toMatch(
      /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
    );
    expect(headers["content-security-policy-report-only"]).toBeUndefined();
    const signIn = await page.request.get("/sign-in", {
      headers: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
      },
      maxRedirects: 0,
    });
    // /sign-in enforcement is a separate, env-gated switch (MM_DEV_AUTH_CSP_ENFORCE=1), not part of the admin change.
    // Require a policy either way and record which mode this Preview served; admin assertions above stay strict.
    const signInEnforced = signIn.headers()["content-security-policy"] ?? "";
    const signInReport =
      signIn.headers()["content-security-policy-report-only"] ?? "";
    expect(signInEnforced + signInReport).toContain("default-src");
    evidence["AR-06-signin-csp-mode"] = signInEnforced
      ? "enforced"
      : "report-only";
    // Bank 2: Codex 500
    await page.goto(BANK);
    await countStatus(500);
    // Pool separation still holds
    await page.getByLabel("Pool", { exact: true }).selectOption("practice");
    await countStatus(400);
    await page.getByLabel("Pool", { exact: true }).selectOption("mock");
    await countStatus(100);
    // Decision panel exposes the review workflow but writes nothing on view
    await page.getByLabel("Pool", { exact: true }).selectOption("");
    await expect(
      page.getByLabel(/Verified human reviewer identity/i),
    ).toHaveValue(FIXTURE_NAME);
    await expect(
      page.getByText(/Publication status: unpublished draft/i).first(),
    ).toBeVisible();

    // Viewing created nothing: no ledger row is attributable to this run. Global totals are evidence only.
    await expectRunCreatedNoLedgerRows();
    const ledgerAfter = await globalLedgerSnapshot();
    evidence["AR-06"] = {
      csp: "present",
      y6core: 160,
      codex500: 500,
      practice: 400,
      mock: 100,
      runAttributableLedgerRows: 0,
      globalLedgerAfter: ledgerAfter,
    };
  });

  test("AR-05 @responsive review workspace has no horizontal overflow and decision controls are reachable", async ({
    page,
  }) => {
    const admin = await makeUser(
      `arr${test.info().project.name.slice(-3)}`,
      "admin",
      FIXTURE_NAME,
    );
    await adminSignIn(page, admin.email);
    await page.goto(BANK);
    await expect(
      page.getByRole("heading", { name: "Draft review" }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole("status").filter({ hasText: /drafts match your filters/ }),
    ).toHaveText("500 drafts match your filters");
    const fits = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
    expect(await fits()).toBe(true);
    await page
      .getByRole("combobox", { name: "Question", exact: true })
      .selectOption(DEFECT_ID);
    await page
      .getByRole("button", { name: "Request revision", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Request revision", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel(/Verified human reviewer identity/i),
    ).toHaveValue(FIXTURE_NAME);
    expect(await fits()).toBe(true);
    const box = await page
      .getByRole("button", { name: "Reject", exact: true })
      .boundingBox();
    expect(box && box.height >= 36).toBe(true);
    await page.getByRole("button", { name: "Batch progress & export" }).click();
    await expect(
      page.getByText(/Batch progress & publication readiness/i),
    ).toBeVisible();
    expect(await fits()).toBe(true);
    evidence[`AR-05-${test.info().project.name}`] = "no overflow";
  });
});
