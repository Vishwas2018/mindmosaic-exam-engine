/**
 * ISOLATED persistent decision tests for the Scholarship Admin Portal.
 *
 * Runs ONLY against the throwaway local Supabase stack (playwright.auth.config.ts calls
 * assertLocalSupabaseEnvironment before anything starts). Because admin_draft_review_decisions is append-only,
 * every Approve / Request revision / Reject written here lands in a disposable database and can never touch the
 * real DEV approval history. The hosted DEV suite deliberately writes none of these.
 */
import { test, expect } from "../fixtures/auth.fixture";
import { createAdminClient } from "../fixtures/supabase-admin";

// These tests append permanent rows to the disposable database; a retry after a partial success would find the
// item already approved. Keep retries off for this file only (assertions are unchanged).
test.describe.configure({ retries: 0 });

const BANK = "/admin/review?bank=vihaan-scholarship-500";
const DEFECT_ID = "vihaan-e500-m069";
const REVIEWER = "Avery Patel";

async function tick(page: import("@playwright/test").Page) {
  const boxes = page.getByRole("checkbox");
  const n = await boxes.count();
  for (let i = 0; i < n; i += 1) await boxes.nth(i).check();
}

test("isolated: Approve, Request revision and Reject persist with locked reviewer identity and append-only history", async ({
  contextAs,
}) => {
  test.setTimeout(240_000);
  const db = createAdminClient();
  const page = await (await contextAs("admin")).newPage();
  const fits = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );

  // The e2e-auth database is shared with admin-draft-review.spec.ts, which also records decisions. Everything below
  // asserts on the rows THIS test adds, identified by id.
  const { data: beforeRows, error: beforeErr } = await db
    .from("admin_draft_review_decisions")
    .select("id");
  expect(beforeErr).toBeNull();
  const beforeIds = new Set((beforeRows ?? []).map((r) => r.id));

  await page.goto(BANK);
  await expect(page.getByRole("status")).toHaveText(
    "500 drafts match your filters",
    { timeout: 60_000 },
  );

  // --- Approve a normal numeracy item after blind-first solving ---
  await page.getByLabel("Section", { exact: true }).selectOption("numeracy");
  await expect(page.getByText("Blind solve mode")).toBeVisible();
  const questionBox = page.getByRole("combobox", {
    name: "Question",
    exact: true,
  });
  const lastOption = await questionBox
    .locator("option")
    .evaluateAll((os) => (os.at(-1) as HTMLOptionElement).value);
  await questionBox.selectOption(lastOption);
  await expect(
    page.getByRole("heading", { name: "Declared answer" }),
  ).toHaveCount(0);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Submit preview answer" }).click();
  await expect(
    page.getByRole("heading", { name: "Declared answer" }),
  ).toBeVisible();
  const approvedId = await page
    .getByRole("combobox", { name: "Question", exact: true })
    .inputValue();
  const nameInput = page.getByLabel(/Verified human reviewer identity/i);
  await expect(nameInput).toHaveAttribute("readonly", "");
  await expect(nameInput).toHaveValue(REVIEWER);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await tick(page);
  await page
    .getByRole("button", { name: "Record my explicit approval" })
    .click();
  await expect(
    page.getByText(/Your human approval was recorded for this revision/i),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/remains unpublished/i)).toBeVisible();

  // --- Request revision on the known-defective item ---
  await page.getByLabel("Section", { exact: true }).selectOption("");
  await page
    .getByRole("combobox", { name: "Question", exact: true })
    .selectOption(DEFECT_ID);
  await expect(
    page.getByText(/Approval blocked — Known Defect A-06/i),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Request revision", exact: true })
    .click();
  await page
    .getByLabel(/Required rationale/i)
    .fill("Isolated E2E: squares 64 and 81 do not sum to 13.");
  await page.getByRole("button", { name: "Record revision request" }).click();
  await expect(
    page.getByText(/Revision request recorded for this content hash/i),
  ).toBeVisible({ timeout: 30_000 });

  // --- Reject (same revision, append-only second row) on a reloaded page ---
  await page.reload();
  await page
    .getByRole("combobox", { name: "Question", exact: true })
    .selectOption(DEFECT_ID);
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page
    .getByLabel(/Required rationale/i)
    .fill("Isolated E2E: reject the defective revision, no correct option.");
  await page.getByRole("button", { name: "Record rejection" }).click();
  await expect(
    page.getByText(/Rejection recorded for this content hash/i),
  ).toBeVisible({ timeout: 30_000 });

  // --- Database truth: rows added by this test ---
  const { data: afterRows, error } = await db
    .from("admin_draft_review_decisions")
    .select(
      "id, question_id, decision, reviewer_name, reviewer_email, evidence_fingerprint, blind_solved, decided_at",
    )
    .order("decided_at");
  expect(error).toBeNull();
  const data = (afterRows ?? []).filter((r) => !beforeIds.has(r.id));
  const byDecision = (d: string) => data.filter((r) => r.decision === d);
  expect(byDecision("approve")).toHaveLength(1);
  expect(byDecision("approve")[0].question_id).toBe(approvedId);
  expect(byDecision("approve")[0].blind_solved).toBe(true);
  expect(byDecision("revise")).toHaveLength(1);
  expect(byDecision("reject")).toHaveLength(1);
  for (const r of data) {
    expect(r.reviewer_name).toBe(REVIEWER);
    expect(r.evidence_fingerprint).toMatch(/^[a-f0-9]{64}$/);
  }

  // The defective revision has no approval, ever, in the whole table
  expect(
    (afterRows ?? []).filter(
      (r) => r.question_id === DEFECT_ID && r.decision === "approve",
    ),
  ).toHaveLength(0);

  // Append-only: even the service role cannot update or delete (MM106)
  const first = data[0];
  const upd = await db
    .from("admin_draft_review_decisions")
    .update({ notes: "tampered tampered" })
    .eq("id", first.id);
  expect(upd.error?.code).toBe("MM106");
  const del = await db
    .from("admin_draft_review_decisions")
    .delete()
    .eq("id", first.id);
  expect(del.error?.code).toBe("MM106");

  // Audit history survives reload and a second approval of the same revision is refused
  await page.reload();
  await page
    .getByRole("combobox", { name: "Question", exact: true })
    .selectOption(approvedId);
  await expect(page.getByText(REVIEWER).first()).toBeVisible();
  await expect(
    page.getByText(/Human approved|already recorded an approval/i).first(),
  ).toBeVisible();

  // --- Mobile (390px): same write path, no overflow ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BANK);
  await expect(page.getByRole("status")).toHaveText(
    "500 drafts match your filters",
    { timeout: 60_000 },
  );
  expect(await fits()).toBe(true);
  await page.getByLabel("Section", { exact: true }).selectOption({ index: 2 });
  await page
    .getByRole("button", { name: "Request revision", exact: true })
    .scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Request revision", exact: true })
    .click();
  await page
    .getByLabel(/Required rationale/i)
    .fill("Isolated mobile E2E: wording needs a second look.");
  await page.getByRole("button", { name: "Record revision request" }).click();
  await expect(
    page.getByText(/Revision request recorded for this content hash/i),
  ).toBeVisible({ timeout: 30_000 });
  expect(await fits()).toBe(true);
});
