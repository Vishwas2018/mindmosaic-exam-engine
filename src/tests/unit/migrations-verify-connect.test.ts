import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "../../../scripts/migrations/verify";

/**
 * The operator CLI that reads the migration ledger (`npm run migrations:status`) used to disable certificate verification
 * for every non-local database. It must now refuse before sending anything unless TLS is verified against an operator CA,
 * and its notion of "local" must not be fooled by a hosted URL that merely contains the word.
 */
const KEYS = ["SUPABASE_DB_URL", "SUPABASE_DB_CA", "SUPABASE_DB_CA_FILE", "NODE_TLS_REJECT_UNAUTHORIZED"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});
afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

const HOSTED = "postgresql://postgres:secret-value@db.abcdefghijklmnopqrst.supabase.co:5432/postgres";

describe("migrations ledger connection", () => {
  it("refuses a hosted database with no CA, naming the reason and never the URL or password", async () => {
    process.env.SUPABASE_DB_URL = HOSTED;
    const error = await connect().then(
      () => null,
      (e: Error) => e,
    );
    expect(error?.message).toMatch(/Refusing to connect to db\.abcdefghijklmnopqrst\.supabase\.co without verified TLS \(tls_ca_missing\)/);
    expect(error?.message).not.toContain("secret-value");
  });

  it("refuses a hosted database when certificate checking is switched off process-wide", async () => {
    process.env.SUPABASE_DB_URL = HOSTED;
    process.env.SUPABASE_DB_CA = "-----BEGIN CERTIFICATE-----\nnot-a-real-cert\n-----END CERTIFICATE-----";
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await expect(connect()).rejects.toThrow(/tls_verification_disabled/);
  });

  it("refuses an unparseable CA", async () => {
    process.env.SUPABASE_DB_URL = HOSTED;
    process.env.SUPABASE_DB_CA = "-----BEGIN CERTIFICATE-----\nnot-a-real-cert\n-----END CERTIFICATE-----";
    await expect(connect()).rejects.toThrow(/tls_ca_invalid/);
  });

  it("is not fooled by 'localhost' or '127.0.0.1' appearing elsewhere in a hosted URL", async () => {
    for (const url of [
      "postgresql://postgres:localhost@db.abcdefghijklmnopqrst.supabase.co:5432/postgres",
      "postgresql://postgres:x@db.abcdefghijklmnopqrst.supabase.co:5432/postgres?application_name=127.0.0.1",
      "postgresql://postgres:x@localhost.evil.example:5432/postgres",
    ]) {
      process.env.SUPABASE_DB_URL = url;
      await expect(connect()).rejects.toThrow(/Refusing to connect .* without verified TLS \(tls_ca_missing\)/);
    }
  });

  it("an sslmode in the URL does not bypass the check (sslmode=disable / no-verify)", async () => {
    for (const mode of ["disable", "no-verify", "require"]) {
      process.env.SUPABASE_DB_URL = `${HOSTED}?sslmode=${mode}`;
      await expect(connect()).rejects.toThrow(/tls_ca_missing/);
    }
  });

  it("rejects a URL that cannot be parsed, without echoing it", async () => {
    process.env.SUPABASE_DB_URL = "postgresql://postgres:pa ss#word@@db.x.supabase.co/postgres";
    const error = await connect().then(
      () => null,
      (e: Error) => e,
    );
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).not.toContain("pa ss");
  });

  it("treats a loopback host as local: it tries to connect (and fails on a closed port) instead of demanding a CA", async () => {
    process.env.SUPABASE_DB_URL = "postgresql://postgres:postgres@127.0.0.1:1/postgres";
    const error = await connect().then(
      () => null,
      (e: Error) => e,
    );
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).not.toMatch(/Refusing|verified TLS/);
  });
});
