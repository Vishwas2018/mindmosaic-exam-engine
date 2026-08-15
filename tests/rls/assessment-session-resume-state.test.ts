/**
 * Gate A item A1: a resumed target sitting lands where the learner left it.
 *
 * ADR-005 Amendment A5 recorded the gap in as many words — "a resumed
 * target-model sitting restores every answer and lands on the first question
 * with no flags" — and 20260814100000's own header repeated it. This suite is
 * the closing evidence: sit some answers on a target session, flag a few, leave,
 * resume, and get back the same question index and the same flags.
 *
 * The other cases here are the ones that make the state trustworthy rather than
 * merely present. Every one of them is about the same question: can anything but
 * the sitter's own sanctioned write path put a value in this row?
 *
 * Harness contract as elsewhere: seed as the unrestricted role, always ROLLBACK.
 */
import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, PARENT_C, STUDENT_A, STUDENT_B } from "./fixtures";
import {
  createTargetSession,
  isolatePublishedBank,
  openTestCohort,
  seedPublishedItem,
  servedItems,
  type ServedItem,
} from "./target-sitting";

let client: Client;
let sessionId: string;
let items: ServedItem[];

async function asOwner(): Promise<void> {
  await client.query("reset role");
}

async function inSavepoint<T>(body: () => Promise<T>): Promise<T> {
  await client.query("savepoint sp");
  try {
    return await body();
  } finally {
    await client.query("rollback to savepoint sp");
    await client.query("release savepoint sp");
  }
}

/** The sitter's own autosave, exactly as the client would send it. */
async function commit(
  studentId: string,
  responses: Record<string, unknown>,
  sequence: number,
  index: number | null,
  flags: readonly string[] | null,
): Promise<Record<string, unknown>> {
  await asAuthenticated(client, studentId);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.commit_assessment_responses($1::uuid, $2::jsonb, $3::bigint, $4::integer, $5::uuid[]) as body`,
    [sessionId, JSON.stringify(responses), sequence, index, flags],
  );
  return result.rows[0]!.body;
}

/** The resume read, exactly as the dispatcher would issue it. */
async function resume(studentId: string): Promise<Record<string, unknown>> {
  await asAuthenticated(client, studentId);
  const result = await client.query<{ body: Record<string, unknown> }>(
    `select public.get_assessment_session($1::uuid) as body`,
    [sessionId],
  );
  return result.rows[0]!.body;
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await isolatePublishedBank(client);
  await seedPublishedItem(client, "r1");
  await seedPublishedItem(client, "r2");
  await seedPublishedItem(client, "r3");
  await openTestCohort(client, STUDENT_A);
  sessionId = await createTargetSession(client, STUDENT_A, "resume-a", {
    yearLevel: 5,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 3,
    timing: "untimed",
  });
  items = await servedItems(client, sessionId);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("A1 — resume restores the position and the flags, not just the answers", () => {
  it("gives back the same question index and the same flags after leaving", async () => {
    /* The sitting: answer the first two, walk forward to the third, flag the
       first and the third. This is the state a child who stopped for dinner is
       actually in — mid-paper, with two questions marked to come back to. */
    const applied = await commit(
      STUDENT_A,
      { [items[0]!.sessionItemId]: "b", [items[1]!.sessionItemId]: "a" },
      1,
      2,
      [items[0]!.sessionItemId, items[2]!.sessionItemId],
    );
    expect(applied.uiStateApplied).toBe(true);

    /* "Leave" is a new read with nothing carried over in the caller — which is
       exactly what a browser refresh is. */
    const resumed = await resume(STUDENT_A);

    expect(resumed.currentQuestionIndex).toBe(2);
    expect(resumed.flaggedSessionItemIds).toEqual([
      items[0]!.sessionItemId,
      items[2]!.sessionItemId,
    ]);
    /* And the answers are still there — the half 20260814100000 already closed,
       re-asserted because a regression in it would look like a resume that
       worked. */
    expect(Object.keys(resumed.responses as Record<string, unknown>)).toHaveLength(2);
  });

  it("reports an untouched sitting as question one with no flags, honestly", async () => {
    /* The same numbers this function used to return for EVERY sitting. The
       difference the fix makes is not the values, it is that they are now a fact
       about a sitting nobody has moved through rather than a default standing in
       for state that was never recorded. */
    const fresh = await resume(STUDENT_A);
    expect(fresh.currentQuestionIndex).toBe(0);
    expect(fresh.flaggedSessionItemIds).toEqual([]);
  });

  it("moves the cursor forward and clears a flag the learner unflagged", async () => {
    await commit(STUDENT_A, {}, 1, 0, [items[0]!.sessionItemId]);
    await commit(STUDENT_A, {}, 2, 1, []);

    const resumed = await resume(STUDENT_A);
    expect(resumed.currentQuestionIndex).toBe(1);
    /* An empty array is a real value, not "unchanged": a learner who unflags
       their last flag must not resume with it still set. That distinction is
       why the parameters default to null rather than to an empty array. */
    expect(resumed.flaggedSessionItemIds).toEqual([]);
  });

  it("leaves the half a request did not send alone", async () => {
    await commit(STUDENT_A, {}, 1, 2, [items[1]!.sessionItemId]);
    /* A cursor-only autosave must not clear the flags, and a flag-only one must
       not reset the cursor. The client sends both together today; the function's
       contract should not depend on it continuing to. */
    await commit(STUDENT_A, {}, 2, 1, null);

    const resumed = await resume(STUDENT_A);
    expect(resumed.currentQuestionIndex).toBe(1);
    expect(resumed.flaggedSessionItemIds).toEqual([items[1]!.sessionItemId]);
  });

  it("discards a stale autosave's cursor the way it discards its answers", async () => {
    await commit(STUDENT_A, {}, 5, 2, [items[2]!.sessionItemId]);
    const stale = await commit(STUDENT_A, {}, 3, 0, []);

    expect(stale.uiStateApplied).toBe(false);
    const resumed = await resume(STUDENT_A);
    /* The failure this prevents: a debounced autosave that left the browser
       before the learner moved on arrives after one that left later, and the
       resume point silently rewinds to where they were a minute ago. */
    expect(resumed.currentQuestionIndex).toBe(2);
    expect(resumed.flaggedSessionItemIds).toEqual([items[2]!.sessionItemId]);
  });
});

describe("A1 — the state is server-validated, not accepted", () => {
  it("refuses a flag naming an item this session never served", async () => {
    const other = await client.query<{ id: string }>(
      `select gen_random_uuid() as id`,
    );
    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, null, $2::uuid[])`,
          [sessionId, [other.rows[0]!.id]],
        ),
      ).rejects.toMatchObject({ code: "MM215" }),
    );
  });

  it("refuses a flag naming another sitting's served item", async () => {
    /* The one that matters: a well-formed id for a real ledger row, belonging to
       somebody else's paper. Nothing about its shape is wrong — only its
       session, which is why the check is a join against THIS session's ledger
       rather than a format test. */
    await openTestCohort(client, STUDENT_B);
    const otherSession = await createTargetSession(client, STUDENT_B, "resume-b");
    const otherItems = await servedItems(client, otherSession);

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, null, $2::uuid[])`,
          [sessionId, [otherItems[0]!.sessionItemId]],
        ),
      ).rejects.toMatchObject({ code: "MM215" }),
    );
  });

  it("refuses a cursor past the end of the served paper", async () => {
    await asAuthenticated(client, STUDENT_A);
    for (const index of [3, 99]) {
      await inSavepoint(() =>
        expect(
          client.query(
            `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, $2::integer, null)`,
            [sessionId, index],
          ),
        ).rejects.toMatchObject({ code: "MM216" }),
      );
    }
  });

  it("refuses to record state against a sitting that is not the caller's", async () => {
    await asAuthenticated(client, STUDENT_B);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, 1, null)`,
          [sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM003" }),
    );
  });

  it("refuses to move the cursor of a terminal sitting, for every role", async () => {
    await asOwner();
    await client.query(
      `update public.assessment_sessions
          set status = 'submitted', submitted_at = now(), version = version + 1
        where id = $1`,
      [sessionId],
    );

    await asAuthenticated(client, STUDENT_A);
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, 1, null)`,
          [sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM214" }),
    );

    /* And the table refuses the owner too — the same posture session_responses
       takes, so a privileged job cannot edit a submitted sitting's state either. */
    await asOwner();
    await inSavepoint(() =>
      expect(
        client.query(
          `insert into public.session_ui_state (session_id, current_question_index)
           values ($1, 1)`,
          [sessionId],
        ),
      ).rejects.toMatchObject({ code: "MM202" }),
    );
  });
});

describe("A1 — the state table is reachable only through the definer pair", () => {
  beforeEach(async () => {
    await commit(STUDENT_A, {}, 1, 1, [items[0]!.sessionItemId]);
  });

  it("gives the sitter no direct privilege on their own resume state", async () => {
    for (const actor of [STUDENT_A, STUDENT_B, PARENT_C]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(client.query(`select * from public.session_ui_state`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
  });

  it("refuses anon entirely", async () => {
    await asAnon(client);
    await inSavepoint(() =>
      expect(client.query(`select * from public.session_ui_state`)).rejects.toMatchObject({
        code: "42501",
      }),
    );
    await inSavepoint(() =>
      expect(
        client.query(
          `select public.commit_assessment_responses($1::uuid, '{}'::jsonb, 1, 1, null)`,
          [sessionId],
        ),
      ).rejects.toMatchObject({ code: "42501" }),
    );
  });

  it("holds no TRUNCATE for a learner role", async () => {
    for (const actor of [STUDENT_A, PARENT_C]) {
      await asAuthenticated(client, actor);
      await inSavepoint(() =>
        expect(client.query(`truncate public.session_ui_state`)).rejects.toMatchObject({
          code: "42501",
        }),
      );
    }
  });

  it("does not let a parent or teacher read their child's working position", async () => {
    /* get_assessment_session is the sitter's reader and stays so: a parent may
       see that a session exists through the row's own policies, and has never
       been able to see the paper or the working. The resume state joins the
       working on that side of the line. */
    await asAuthenticated(client, PARENT_C);
    await inSavepoint(() =>
      expect(
        client.query(`select public.get_assessment_session($1::uuid)`, [sessionId]),
      ).rejects.toMatchObject({ code: "MM003" }),
    );
  });

  it("is erased with the child, leaving nothing behind", async () => {
    /* §25.11: a new child-data field needs an erasure test. The row hangs off
       the session by ON DELETE CASCADE, so this asserts the cascade actually
       fires through erase_student rather than assuming the constraint. */
    await asOwner();
    await client.query(`select public.erase_student($1, 'a1-erasure')`, [STUDENT_A]);

    const left = await client.query<{ n: string }>(
      `select count(*)::text as n from public.session_ui_state where session_id = $1`,
      [sessionId],
    );
    expect(left.rows[0]!.n).toBe("0");
  });
});
