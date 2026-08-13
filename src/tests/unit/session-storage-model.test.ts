import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resolveSessionStorageModel,
  targetPathWithheld,
  type StorageModelClient,
} from "@/server/assessment/storage-model";

/**
 * The application half of the §12.7 step 6 routing decision (ADR-006
 * Amendment C).
 *
 * The database half — that `create_assessment_session` refuses an
 * out-of-cohort caller no matter how the request was shaped — is proved in
 * tests/rls/session-storage-model.test.ts against a real Postgres, because it
 * is a property of the RPC and not of this process. What is proved here is the
 * property this module is responsible for: it never *decides*, it asks, and
 * every way of failing to get a clear answer resolves to legacy.
 */

const original = process.env.ASSESSMENT_TARGET_MODEL_DISABLED;

afterEach(() => {
  if (original === undefined) delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
  else process.env.ASSESSMENT_TARGET_MODEL_DISABLED = original;
});

function client(response: { data: unknown; error: unknown }): StorageModelClient {
  return { rpc: vi.fn().mockResolvedValue(response) };
}

describe("the routing answer comes from the database", () => {
  it("returns version_pinned when the database says so", async () => {
    delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
    await expect(
      resolveSessionStorageModel(client({ data: "version_pinned", error: null })),
    ).resolves.toBe("version_pinned");
  });

  it("returns legacy when the database says so", async () => {
    delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
    await expect(
      resolveSessionStorageModel(client({ data: "legacy", error: null })),
    ).resolves.toBe("legacy");
  });

  it("asks the caller-scoped predicate, not the arbitrary-uuid one", async () => {
    /* session_storage_model_for(uuid) is not granted to authenticated precisely
       so a learner cannot probe cohort membership for somebody else. Calling it
       from here would fail at runtime and, worse, would suggest the app is
       entitled to ask about other people. */
    delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
    const supabase = client({ data: "legacy", error: null });
    await resolveSessionStorageModel(supabase);
    expect(supabase.rpc).toHaveBeenCalledWith("session_storage_model_for_caller");
  });
});

describe("every unclear answer fails closed to legacy", () => {
  it.each([
    ["an error", { data: null, error: { message: "boom" } }],
    ["a null", { data: null, error: null }],
    ["undefined", { data: undefined, error: null }],
    ["an unexpected string", { data: "target", error: null }],
    ["a boolean", { data: true, error: null }],
    ["an object", { data: { model: "version_pinned" }, error: null }],
  ])("resolves to legacy for %s", async (_label, response) => {
    /* Legacy is the safe default in the strong sense: it is the model every
       existing reader, result screen and dashboard already understands, so a
       routing failure degrades to the working path rather than to a sitting
       nobody can display. */
    delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
    await expect(resolveSessionStorageModel(client(response))).resolves.toBe("legacy");
  });
});

describe("the environment switch can only withhold (Amendment C3)", () => {
  it("forces legacy even when the database says version_pinned", async () => {
    process.env.ASSESSMENT_TARGET_MODEL_DISABLED = "1";
    await expect(
      resolveSessionStorageModel(client({ data: "version_pinned", error: null })),
    ).resolves.toBe("legacy");
  });

  it("does not consult the database at all when withholding", async () => {
    /* Not merely equivalent to a legacy answer — an operator pulling this lever
       in an incident should not depend on the database being reachable. */
    process.env.ASSESSMENT_TARGET_MODEL_DISABLED = "1";
    const supabase = client({ data: "version_pinned", error: null });
    await resolveSessionStorageModel(supabase);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("cannot GRANT the target path", async () => {
    /* The asymmetry that makes it subordinate rather than a second source of
       truth. There is no value of this variable that turns the target model on;
       only the database can do that. */
    for (const value of ["0", "version_pinned", "all", "enabled", "true", ""]) {
      process.env.ASSESSMENT_TARGET_MODEL_DISABLED = value;
      await expect(
        resolveSessionStorageModel(client({ data: "legacy", error: null })),
      ).resolves.toBe("legacy");
    }
  });

  it.each([undefined, "", "0", "true", "yes", "TRUE"])(
    "is not tripped by %s",
    (value) => {
      /* Opt-in by exact string: a misconfiguration must leave the switch alone
         rather than silently withhold, or an incident lever becomes an
         accidental outage. */
      if (value === undefined) delete process.env.ASSESSMENT_TARGET_MODEL_DISABLED;
      else process.env.ASSESSMENT_TARGET_MODEL_DISABLED = value;
      expect(targetPathWithheld()).toBe(false);
    },
  );

  it("is tripped by exactly \"1\"", () => {
    process.env.ASSESSMENT_TARGET_MODEL_DISABLED = "1";
    expect(targetPathWithheld()).toBe(true);
  });
});

describe("no second flag survives", () => {
  it("exports no way for application code to decide by itself", async () => {
    /* Amendment C removed the co-equal env gate. The module's exported surface
       is the assertion: something that asks, and something that withholds. If a
       `sessionStorageModel()` that answered from process.env ever came back,
       this fails. */
    const module = await import("@/server/assessment/storage-model");
    expect(Object.keys(module).sort()).toEqual([
      "resolveSessionStorageModel",
      "targetPathWithheld",
    ]);
  });
});
