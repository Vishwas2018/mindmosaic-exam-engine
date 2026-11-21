/**
 * G2 — guest practice guard on the hosted DEV Preview (docs/GUEST_ABUSE_PROTECTION.md).
 *
 * The guard must be shared (Upstash Redis) on a hosted deployment and FAILS CLOSED without it. The suite first probes
 * which state the Preview is in and asserts the matching contract:
 *   - no Redis:   start and submit are refused with 503 guard_unavailable (never served unprotected);
 *   - Redis live: a ticket is accepted once; the same answers are idempotent; different answers are refused with 409
 *                 even after the browser drops its spent-cookie (replay across cookie loss); parallel conflicting
 *                 submits yield exactly one winner; another browser cannot use the ticket.
 * Caveat: "Redis live" is inferred from behaviour; confirm the UPSTASH/KV vars exist and MM_GUEST_GUARD is unset on the
 * Preview (vercel env ls) so an in-memory guard cannot satisfy it. Requests go through page.request with the bypass header and a same-origin Origin; no secrets are logged.
 */
import { api, expect, protectContext, test } from "./fixtures";

const START = {
  selection: {
    config: {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 3,
      timing: "untimed",
    },
  },
};

test.describe("G2: guest guard", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "API contract runs once",
    );
  });

  test("G2a: guard state is explicit — either shared and working, or failing closed", async ({
    page,
    context,
  }, testInfo) => {
    await protectContext(context);
    const http = api(page);
    const started = await http.post("/api/exam/guest-session", START);
    const status = started.status();
    testInfo.annotations.push({
      type: "guard",
      description: status === 201 ? "redis-live" : `refused-${status}`,
    });

    if (status !== 201) {
      expect(status, "no shared guard: refused, not served").toBe(503);
      expect(await started.json()).toEqual({ error: "guard_unavailable" });
      expect(
        started.headers()["retry-after"],
        "client told when to retry",
      ).toBeTruthy();
      return;
    }

    const body = await started.json();
    expect(body.ticket).toBeTruthy();
    const ids: string[] = body.questions.map((q: { id: string }) => q.id);
    expect(ids.length).toBeGreaterThan(0);

    // Answer key never leaves the server before submit.
    expect(JSON.stringify(body.questions)).not.toMatch(
      /correctAnswer|correct_answer|"explanation"/,
    );

    const first = await http.put("/api/exam/guest-session", {
      ticket: body.ticket,
      responses: { [ids[0]]: "a" },
    });
    expect(first.status()).toBe(200);
    const again = await http.put("/api/exam/guest-session", {
      ticket: body.ticket,
      responses: { [ids[0]]: "a" },
    });
    expect(again.status(), "same answers are idempotent").toBe(200);

    const changed = await http.put("/api/exam/guest-session", {
      ticket: body.ticket,
      responses: { [ids[0]]: "b" },
    });
    expect(changed.status(), "changed answers after reveal refused").toBe(409);

    // Replay across cookie loss: drop the spent-cookie, keep the browser identity.
    await context.clearCookies({ name: "mm-guest-spent" });
    const replay = await http.put("/api/exam/guest-session", {
      ticket: body.ticket,
      responses: { [ids[0]]: "c" },
    });
    expect(
      replay.status(),
      "shared record survives losing the spent cookie",
    ).toBe(409);
  });

  test("G2b: parallel conflicting submits have exactly one winner; another browser cannot use the ticket", async ({
    page,
    context,
    browser,
  }) => {
    await protectContext(context);
    const http = api(page);
    const started = await http.post("/api/exam/guest-session", START);
    test.skip(
      started.status() !== 201,
      "needs the shared guard (Redis) to be live",
    );
    const body = await started.json();
    const id: string = body.questions[0].id;

    const answers = ["a", "b", "c", "d", "e", "f"];
    // Build every racer first (identity cookie shared, spent-cookie not), then fire only the PUTs together.
    const racers = await Promise.all(
      answers.map(async () => {
        const ctx = await browser.newContext();
        await protectContext(ctx);
        await ctx.addCookies(await context.cookies());
        return { ctx, http: api(await ctx.newPage()) };
      }),
    );
    let results: number[] = [];
    try {
      results = await Promise.all(
        racers.map(async ({ http: h }, i) =>
          (
            await h.put("/api/exam/guest-session", {
              ticket: body.ticket,
              responses: { [id]: answers[i] },
            })
          ).status(),
        ),
      );
    } finally {
      await Promise.all(racers.map(({ ctx }) => ctx.close()));
    }
    const winners = answers.filter((_, i) => results[i] === 200);
    expect(
      winners.length,
      `exactly one answer set accepted in ${JSON.stringify(results)}`,
    ).toBe(1);
    expect(results.every((s: number) => s === 200 || s === 409)).toBe(true);

    const stranger = await browser.newContext();
    try {
      await protectContext(stranger);
      const refused = await api(await stranger.newPage()).put(
        "/api/exam/guest-session",
        { ticket: body.ticket, responses: { [id]: "a" } },
      );
      expect(refused.status(), "ticket is bound to the issuing browser").toBe(
        404,
      );
    } finally {
      await stranger.close();
    }
  });
});
