import { describe, expect, it } from "vitest";

import {
  checkConnectedRole,
  decideExamWriteTarget,
  EXAM_WRITER_ROLE,
  type ConnectedRole,
  type TargetInput,
} from "@/server/exam-write/target";

const DEV = "mfglzabnayacssgertat";
const PROD = "uermhsptduikehuyceiz";
const PASSWORD = "p%40ss-word-that-must-never-surface";

const direct = (ref = DEV, user = EXAM_WRITER_ROLE) =>
  `postgresql://${user}:${PASSWORD}@db.${ref}.supabase.co:5432/postgres`;
const pooler = (user = `${EXAM_WRITER_ROLE}.${DEV}`, port = 6543) =>
  `postgresql://${user}:${PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:${port}/postgres`;
const loopback = (host = "127.0.0.1") => `postgresql://${EXAM_WRITER_ROLE}:local@${host}:56322/postgres`;

const hostedInput = (over: Partial<TargetInput> = {}): TargetInput => ({
  url: direct(),
  expectedRef: DEV,
  publicSupabaseUrl: `https://${DEV}.supabase.co`,
  allowLoopback: false,
  hostedRuntime: true,
  ...over,
});

const reasonOf = (input: TargetInput) => {
  const decision = decideExamWriteTarget(input);
  return decision.ok ? "ok" : decision.reason;
};

describe("hosted targets need a positive identity match", () => {
  it("accepts the documented direct format when URL, declaration and public URL all name DEV", () => {
    expect(decideExamWriteTarget(hostedInput())).toEqual({ ok: true, kind: "hosted", ref: DEV, via: "direct" });
  });

  it("accepts the documented pooler format, taking the ref from the username suffix", () => {
    expect(decideExamWriteTarget(hostedInput({ url: pooler() }))).toEqual({
      ok: true,
      kind: "hosted",
      ref: DEV,
      via: "pooler",
    });
  });

  it("requires the expected ref: it is not optional for a hosted write", () => {
    expect(reasonOf(hostedInput({ expectedRef: undefined }))).toBe("missing_expected_ref");
    expect(reasonOf(hostedInput({ expectedRef: "" }))).toBe("missing_expected_ref");
    expect(reasonOf(hostedInput({ expectedRef: "   " }))).toBe("missing_expected_ref");
    expect(reasonOf(hostedInput({ url: pooler(), expectedRef: undefined }))).toBe("missing_expected_ref");
  });

  it("rejects an expected ref that is not a project ref", () => {
    expect(reasonOf(hostedInput({ expectedRef: "dev" }))).toBe("invalid_expected_ref");
    expect(reasonOf(hostedInput({ expectedRef: DEV.toUpperCase() }))).toBe("invalid_expected_ref");
  });

  it("rejects a URL that names a different project than declared (direct and pooler)", () => {
    expect(reasonOf(hostedInput({ url: direct(PROD) }))).toBe("ref_mismatch");
    expect(reasonOf(hostedInput({ url: pooler(`${EXAM_WRITER_ROLE}.${PROD}`) }))).toBe("ref_mismatch");
  });

  it("rejects the production ref when DEV is declared, and DEV when production is declared", () => {
    expect(reasonOf(hostedInput({ url: direct(PROD), publicSupabaseUrl: `https://${PROD}.supabase.co` }))).toBe(
      "ref_mismatch",
    );
    expect(reasonOf(hostedInput({ expectedRef: PROD }))).toBe("ref_mismatch");
  });

  it("requires the public Supabase URL as an independent second witness", () => {
    expect(reasonOf(hostedInput({ publicSupabaseUrl: undefined }))).toBe("missing_public_ref");
    expect(reasonOf(hostedInput({ publicSupabaseUrl: "" }))).toBe("missing_public_ref");
  });

  it("rejects a public URL that names another project, a local server, or something unrecognisable", () => {
    expect(reasonOf(hostedInput({ publicSupabaseUrl: `https://${PROD}.supabase.co` }))).toBe("public_ref_conflict");
    expect(reasonOf(hostedInput({ publicSupabaseUrl: "http://127.0.0.1:56321" }))).toBe("public_ref_conflict");
    expect(reasonOf(hostedInput({ publicSupabaseUrl: "https://example.com" }))).toBe("public_ref_conflict");
    expect(reasonOf(hostedInput({ publicSupabaseUrl: "not a url" }))).toBe("public_ref_conflict");
    expect(reasonOf(hostedInput({ publicSupabaseUrl: `http://${DEV}.supabase.co` }))).toBe("public_ref_conflict");
  });

  it("rejects a pooler URL whose username carries no ref (the project would be ambiguous)", () => {
    expect(reasonOf(hostedInput({ url: pooler(EXAM_WRITER_ROLE) }))).toBe("ambiguous_identity");
    expect(reasonOf(hostedInput({ url: pooler(`${EXAM_WRITER_ROLE}.dev`) }))).toBe("ambiguous_identity");
    expect(reasonOf(hostedInput({ url: pooler(`${EXAM_WRITER_ROLE}.`) }))).toBe("ambiguous_identity");
  });

  it("rejects a direct URL whose username also carries a ref (two identities in one URL)", () => {
    expect(reasonOf(hostedInput({ url: direct(DEV, `${EXAM_WRITER_ROLE}.${PROD}`) }))).toBe("ambiguous_identity");
  });

  it("rejects the wrong role, including the privileged ones", () => {
    for (const user of ["postgres", "service_role", "authenticated", "mindmosaic_scoring", "supabase_admin", "x"]) {
      expect(reasonOf(hostedInput({ url: direct(DEV, user) })), user).toBe("wrong_role");
      expect(reasonOf(hostedInput({ url: pooler(`${user}.${DEV}`) })), user).toBe("wrong_role");
    }
    expect(reasonOf(hostedInput({ url: `postgresql://:pw@db.${DEV}.supabase.co:5432/postgres` }))).toBe("wrong_role");
  });

  it("rejects hosts that are neither documented direct nor pooler hosts", () => {
    for (const host of [
      "evil.example.com",
      `db.${DEV}.supabase.co.evil.example`,
      `db.${DEV}.supabase.com`,
      "db.short.supabase.co",
      `db.${DEV},db.${PROD}.supabase.co`,
      `${DEV}.supabase.co`,
    ]) {
      expect(reasonOf(hostedInput({ url: `postgresql://${EXAM_WRITER_ROLE}:pw@${host}:5432/postgres` })), host).toBe(
        "unrecognised_host",
      );
    }
  });

  it("rejects connection-string parameters that can redirect the connection", () => {
    for (const query of ["host=evil.example.com", "hostaddr=10.0.0.1", "user=postgres", "dbname=other", "port=1"]) {
      expect(reasonOf(hostedInput({ url: `${direct()}?${query}` })), query).toBe("unsupported_parameter");
    }
    expect(reasonOf(hostedInput({ url: `${direct()}?sslmode=verify-full` }))).toBe("ok");
    expect(reasonOf(hostedInput({ url: `${pooler()}?pgbouncer=true&sslmode=verify-full` }))).toBe("ok");
  });

  it("rejects every sslmode except verify-full on a hosted target", () => {
    for (const mode of ["disable", "allow", "prefer", "DISABLE", "require", "verify-ca", "no-verify", "VERIFY-FULL"]) {
      expect(reasonOf(hostedInput({ url: `${direct()}?sslmode=${mode}` })), mode).toBe("insecure_transport");
    }
  });

  it("rejects a missing, blank, unparseable or non-postgres URL", () => {
    expect(reasonOf(hostedInput({ url: undefined }))).toBe("missing_url");
    expect(reasonOf(hostedInput({ url: "  " }))).toBe("missing_url");
    expect(reasonOf(hostedInput({ url: "not a url" }))).toBe("unparseable_url");
    expect(reasonOf(hostedInput({ url: `https://db.${DEV}.supabase.co` }))).toBe("unsupported_scheme");
    expect(reasonOf(hostedInput({ url: `mysql://${EXAM_WRITER_ROLE}:pw@db.${DEV}.supabase.co/x` }))).toBe(
      "unsupported_scheme",
    );
  });

  it("accepts the postgres:// scheme as well as postgresql://", () => {
    expect(reasonOf(hostedInput({ url: direct().replace("postgresql:", "postgres:") }))).toBe("ok");
  });
});

describe("loopback is allowed only through explicit local configuration", () => {
  const local = (over: Partial<TargetInput> = {}): TargetInput => ({
    url: loopback(),
    expectedRef: undefined,
    publicSupabaseUrl: "http://127.0.0.1:56321",
    allowLoopback: true,
    hostedRuntime: false,
    ...over,
  });

  it("accepts 127.0.0.1, localhost and [::1] only with the explicit opt-in", () => {
    for (const host of ["127.0.0.1", "localhost", "[::1]"]) {
      expect(decideExamWriteTarget(local({ url: loopback(host) })), host).toEqual({
        ok: true,
        kind: "loopback",
        ref: null,
        via: "loopback",
      });
    }
  });

  it("refuses loopback without the opt-in", () => {
    expect(reasonOf(local({ allowLoopback: false }))).toBe("loopback_not_enabled");
  });

  it("refuses loopback on a hosted runtime even with the opt-in", () => {
    expect(reasonOf(local({ hostedRuntime: true }))).toBe("loopback_in_hosted_runtime");
  });

  it("refuses a loopback database beside a hosted public URL, and the privileged role on loopback", () => {
    expect(reasonOf(local({ publicSupabaseUrl: `https://${DEV}.supabase.co` }))).toBe("public_ref_conflict");
    expect(reasonOf(local({ url: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" }))).toBe("wrong_role");
  });

  it("does not treat a lookalike host as loopback", () => {
    expect(reasonOf(local({ url: loopback("127.0.0.1.evil.example") }))).toBe("unrecognised_host");
    expect(reasonOf(local({ url: loopback("localhost.evil.example") }))).toBe("unrecognised_host");
  });
});

describe("a decision never contains the credential", () => {
  it("carries only enumerated reasons, a kind and a ref for every outcome", () => {
    const inputs: TargetInput[] = [
      hostedInput(),
      hostedInput({ url: direct(PROD) }),
      hostedInput({ url: pooler(`${EXAM_WRITER_ROLE}.dev`) }),
      hostedInput({ expectedRef: undefined }),
      hostedInput({ url: `${direct()}?host=evil` }),
    ];
    for (const input of inputs) {
      const serialised = JSON.stringify(decideExamWriteTarget(input));
      expect(serialised).not.toContain(PASSWORD);
      expect(serialised).not.toContain("p%40ss");
      expect(serialised).not.toContain("postgresql://");
      expect(serialised).not.toContain("supabase.co");
    }
  });
});

describe("the connected role is checked against pg_roles, not the URL's claim", () => {
  const clean: ConnectedRole = {
    currentUser: EXAM_WRITER_ROLE,
    sessionUser: EXAM_WRITER_ROLE,
    superuser: false,
    bypassRls: false,
    createRole: false,
    createDb: false,
    replication: false,
  };

  it("accepts the restricted writer", () => {
    expect(checkConnectedRole(clean)).toBeNull();
  });

  it("rejects no row, another current_user, or another session_user", () => {
    expect(checkConnectedRole(null)).toBe("wrong_role");
    expect(checkConnectedRole({ ...clean, currentUser: "postgres" })).toBe("wrong_role");
    expect(checkConnectedRole({ ...clean, sessionUser: "postgres" })).toBe("wrong_role");
  });

  it.each(["superuser", "bypassRls", "createRole", "createDb", "replication"] as const)(
    "rejects the writer role when %s is set",
    (attribute) => {
      expect(checkConnectedRole({ ...clean, [attribute]: true })).toBe("role_attributes");
    },
  );
});
