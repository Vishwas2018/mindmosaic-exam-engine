import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clients = vi.hoisted(() => ({ constructed: 0 }));
vi.mock("pg", () => ({
  Client: class {
    constructor() {
      clients.constructed += 1;
    }
    on() {}
    async connect() {}
  },
}));

import {
  assertSingleLocalTarget,
  DbTargetError,
  defaultContentAnswerWriterUrl,
  defaultScoringUrl,
  restoreEnv,
  snapshotEnv,
} from "../../../tests/rls/support/db-target";
import { connect, connectAsContentAnswerWriterRole, connectAsScoringRole, scoringDbUrl } from "../../../tests/rls/db";
import { scopeEnvToFile } from "../../../tests/rls/support/scoped-env";

const ISOLATED = "postgresql://postgres:postgres@127.0.0.1:58322/postgres";
const names = ["RLS_TEST_DB_URL", "SUPABASE_DB_URL", "DATABASE_URL", "SCORING_DB_URL", "CONTENT_ANSWER_WRITER_DB_URL", "RLS_EXPECTED_DB_PORT"] as const;
const saved = snapshotEnv(names);

beforeEach(() => {
  for (const name of names) delete process.env[name];
  clients.constructed = 0;
});
afterEach(() => restoreEnv(saved));

describe("database-target guard", () => {
  it("accepts the documented default and an explicit isolated database", () => {
    expect(assertSingleLocalTarget({}).port).toBe(56322);
    expect(assertSingleLocalTarget({ RLS_TEST_DB_URL: ISOLATED }).port).toBe(58322);
  });

  it("derives the two role URLs from the primary, so an unset override can never fall back to another database", () => {
    const env = { RLS_TEST_DB_URL: ISOLATED };
    expect(new URL(defaultScoringUrl(env)).port).toBe("58322");
    expect(new URL(defaultContentAnswerWriterUrl(env)).port).toBe("58322");
    expect(new URL(defaultScoringUrl({})).port).toBe("56322");
  });

  it("refuses a variable that points at a different port than the primary: the exact split that sent scoring to another stack", () => {
    const env = { RLS_TEST_DB_URL: ISOLATED, SCORING_DB_URL: "postgresql://mindmosaic_scoring:x@127.0.0.1:56322/postgres" };
    expect(() => assertSingleLocalTarget(env)).toThrow(DbTargetError);
    expect(() => assertSingleLocalTarget(env)).toThrow(/SCORING_DB_URL targets 127\.0\.0\.1:56322 but RLS_TEST_DB_URL targets 127\.0\.0\.1:58322/);
    for (const variable of ["SUPABASE_DB_URL", "DATABASE_URL", "CONTENT_ANSWER_WRITER_DB_URL"]) {
      expect(() => assertSingleLocalTarget({ RLS_TEST_DB_URL: ISOLATED, [variable]: "postgresql://u:p@127.0.0.1:54322/postgres" })).toThrow(variable);
    }
  });

  it("refuses any non-local host, in any variable, including a hosted database", () => {
    expect(() => assertSingleLocalTarget({ RLS_TEST_DB_URL: "postgresql://postgres:secret@db.example.supabase.co:5432/postgres" })).toThrow(/not a local address/);
    expect(() => assertSingleLocalTarget({ RLS_TEST_DB_URL: ISOLATED, DATABASE_URL: "postgresql://u:p@10.0.0.5:58322/postgres" })).toThrow(/not a local address/);
    expect(() => assertSingleLocalTarget({ RLS_TEST_DB_URL: "not a url" })).toThrow(/not a valid URL/);
  });

  it("honours an explicit port pin", () => {
    expect(() => assertSingleLocalTarget({ RLS_TEST_DB_URL: ISOLATED, RLS_EXPECTED_DB_PORT: "56322" })).toThrow(/RLS_EXPECTED_DB_PORT is 56322/);
    expect(assertSingleLocalTarget({ RLS_TEST_DB_URL: ISOLATED, RLS_EXPECTED_DB_PORT: "58322" }).port).toBe(58322);
  });

  it("never prints a credential", () => {
    try {
      assertSingleLocalTarget({ RLS_TEST_DB_URL: "postgresql://postgres:hunter2@db.example.com:5432/postgres" });
      expect.unreachable();
    } catch (error) {
      expect(String((error as Error).message)).not.toContain("hunter2");
    }
  });

  it("stops every connection helper before a client is even constructed", async () => {
    process.env.RLS_TEST_DB_URL = ISOLATED;
    process.env.SCORING_DB_URL = "postgresql://mindmosaic_scoring:x@127.0.0.1:56322/postgres";
    await expect(connect()).rejects.toThrow(DbTargetError);
    await expect(connectAsScoringRole()).rejects.toThrow(DbTargetError);
    await expect(connectAsContentAnswerWriterRole()).rejects.toThrow(DbTargetError);
    expect(() => scoringDbUrl()).toThrow(DbTargetError);
    expect(clients.constructed).toBe(0);
  });

  it("lets a consistent configuration connect", async () => {
    process.env.RLS_TEST_DB_URL = ISOLATED;
    await connect();
    expect(clients.constructed).toBe(1);
  });
});

describe("environment restoration", () => {
  it("restoreEnv puts back what was set and removes what was not", () => {
    process.env.SCORING_DB_URL = "a";
    const snap = snapshotEnv(["SCORING_DB_URL", "DATABASE_URL"]);
    process.env.SCORING_DB_URL = "b";
    process.env.DATABASE_URL = "c";
    restoreEnv(snap);
    expect(process.env.SCORING_DB_URL).toBe("a");
    expect(process.env.DATABASE_URL).toBeUndefined();
  });
});

describe("a scoped variable is put back even when a test inside the file fails", () => {
  describe("the file that fails", () => {
    scopeEnvToFile("RLS_GUARD_PROBE_UNSET", () => "temporary");
    it.fails("fails while the variable is set", () => {
      expect(process.env.RLS_GUARD_PROBE_UNSET).toBe("temporary");
      throw new Error("deliberate failure inside the scope");
    });
  });
  describe("the next file", () => {
    it("sees the variable gone again", () => {
      expect(process.env.RLS_GUARD_PROBE_UNSET).toBeUndefined();
    });
  });

  describe("a variable that already had a value", () => {
    process.env.RLS_GUARD_PROBE_SET = "original";
    scopeEnvToFile("RLS_GUARD_PROBE_SET", () => "temporary");
    it.fails("fails while the value is replaced", () => {
      throw new Error("deliberate failure");
    });
  });
  describe("afterwards", () => {
    it("sees the original value", () => {
      expect(process.env.RLS_GUARD_PROBE_SET).toBe("original");
      delete process.env.RLS_GUARD_PROBE_SET;
    });
  });
});
