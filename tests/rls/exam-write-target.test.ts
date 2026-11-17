/**
 * The exam writer's positive target validation, against the real local database (family-beta WP1).
 *
 * tests/unit covers the decision matrix as pure functions. This file proves the same rules are wired into the module
 * that actually connects, and that the role check after connecting is real: it reads pg_roles from the live
 * connection. Nothing here is mocked. The only mutation is a transient role attribute on the local test role, made
 * and reverted inside try/finally (the RLS run is serial, so nothing else uses the role meanwhile).
 */
import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLegacyExamSession } from "@/server/exam-write/legacy-exam-writes";

import { connect, examWriterDbUrl } from "./db";

const KEYS = [
  "EXAM_WRITE_DB_URL",
  "EXAM_WRITE_EXPECTED_PROJECT_REF",
  "EXAM_WRITE_ALLOW_LOOPBACK",
  "NEXT_PUBLIC_SUPABASE_URL",
  "VERCEL",
] as const;
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of KEYS) saved[key] = process.env[key];
  process.env.EXAM_WRITE_DB_URL = examWriterDbUrl();
  process.env.EXAM_WRITE_ALLOW_LOOPBACK = "1";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:56321";
  delete process.env.VERCEL;
  delete process.env.EXAM_WRITE_EXPECTED_PROJECT_REF;
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

const attempt = () =>
  createLegacyExamSession({
    studentId: randomUUID(), // not a user: the database's own gate (MM002) must answer, proving we got that far
    config: {},
    seed: "target-validation",
    selectedQuestionIds: ["q1"],
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  });

describe("exam write target validation, live", () => {
  it("connects as the restricted writer when loopback is explicitly enabled (reaches the database's own role gate)", async () => {
    const outcome = await attempt();
    expect(outcome.error?.code).toBe("MM002");
  });

  it("refuses a loopback target without the explicit opt-in, before connecting", async () => {
    delete process.env.EXAM_WRITE_ALLOW_LOOPBACK;
    const outcome = await attempt();
    expect(outcome.error?.code).toBe("not_configured");
    expect(outcome.error?.message).toContain("loopback_not_enabled");
  });

  it("refuses loopback on a hosted runtime even with the opt-in", async () => {
    process.env.VERCEL = "1";
    const outcome = await attempt();
    expect(outcome.error?.code).toBe("not_configured");
    expect(outcome.error?.message).toContain("loopback_in_hosted_runtime");
  });

  it("refuses the privileged postgres role named in the URL, before connecting", async () => {
    process.env.EXAM_WRITE_DB_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";
    const outcome = await attempt();
    expect(outcome.error?.code).toBe("not_configured");
    expect(outcome.error?.message).toContain("wrong_role");
  });

  it("refuses a hosted URL with no declared expected ref, without any network attempt", async () => {
    process.env.EXAM_WRITE_DB_URL =
      "postgresql://mindmosaic_exam_writer:secret-that-must-not-leak@db.mfglzabnayacssgertat.supabase.co:5432/postgres";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mfglzabnayacssgertat.supabase.co";
    const outcome = await attempt();
    /* `not_configured` (decided before connecting) rather than `unavailable` (a connection attempt that failed). */
    expect(outcome.error?.code).toBe("not_configured");
    expect(outcome.error?.message).toContain("missing_expected_ref");
  });

  it("refuses a conflicting declaration, and no outcome ever contains the password or the URL", async () => {
    process.env.EXAM_WRITE_DB_URL =
      "postgresql://mindmosaic_exam_writer:secret-that-must-not-leak@db.mfglzabnayacssgertat.supabase.co:5432/postgres";
    process.env.EXAM_WRITE_EXPECTED_PROJECT_REF = "uermhsptduikehuyceiz";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mfglzabnayacssgertat.supabase.co";
    const outcome = await attempt();
    expect(outcome.error?.code).toBe("not_configured");
    expect(outcome.error?.message).toContain("ref_mismatch");
    const serialised = JSON.stringify(outcome);
    expect(serialised).not.toContain("secret-that-must-not-leak");
    expect(serialised).not.toContain("postgresql://");
  });

  it("refuses a connection whose role gained an elevated attribute, read back from pg_roles", async () => {
    const admin = await connect();
    try {
      await admin.query("alter role mindmosaic_exam_writer createdb");
      const outcome = await attempt();
      expect(outcome.error?.code).toBe("not_configured");
      expect(outcome.error?.message).toContain("role_attributes");
    } finally {
      await admin.query("alter role mindmosaic_exam_writer nocreatedb");
      await admin.end();
    }
    const restored = await attempt();
    expect(restored.error?.code).toBe("MM002");
  });
});
