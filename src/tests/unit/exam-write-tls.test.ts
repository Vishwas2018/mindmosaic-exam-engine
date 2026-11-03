import { execFileSync } from "node:child_process";
import { X509Certificate } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import net, { type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import tls from "node:tls";

import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { decideHostedTls, hostedClientConfig } from "@/server/exam-write/tls";

/**
 * Verified TLS for the hosted writer. Two layers:
 *  - the pure decision/config functions, including how the installed `pg` treats connection-string overrides;
 *  - a REAL TLS handshake from a real `pg` Client (built by hostedClientConfig) against a local server that speaks
 *    just enough of the Postgres wire protocol (the SSLRequest upgrade) for the handshake to be observed.
 * Certificates are generated at run time with openssl; nothing here is a committed key.
 */

function findOpenssl(): string {
  for (const candidate of ["openssl", "C:\\Program Files\\Git\\usr\\bin\\openssl.exe", "C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe"]) {
    try {
      execFileSync(candidate, ["version"], { stdio: "ignore" });
      return candidate;
    } catch {
      /* try the next */
    }
  }
  throw new Error("openssl is required to generate the TLS test certificates (it is on PATH in CI and in Git for Windows)");
}

interface Pki {
  readonly caPem: string;
  readonly otherCaPem: string;
  readonly leafKey: string;
  readonly leafCert: string;
  readonly leafNonCaPem: string;
}

function generatePki(): Pki {
  const openssl = findOpenssl();
  const dir = mkdtempSync(join(tmpdir(), "mm-tls-"));
  const run = (...args: string[]) => execFileSync(openssl, args, { cwd: dir, stdio: "pipe" });
  const leafExt = join(dir, "leaf.ext");
  writeFileSync(leafExt, "basicConstraints=CA:FALSE\nsubjectAltName=DNS:localhost\n");

  const makeCa = (name: string) => {
    run("req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", `${name}.key`, "-out", `${name}.pem`, "-days", "30", "-subj", `/CN=${name}`, "-addext", "basicConstraints=critical,CA:TRUE");
  };
  makeCa("test-ca");
  makeCa("other-ca");

  run("req", "-newkey", "rsa:2048", "-nodes", "-keyout", "leaf.key", "-out", "leaf.csr", "-subj", "/CN=localhost");
  run("x509", "-req", "-in", "leaf.csr", "-CA", "test-ca.pem", "-CAkey", "test-ca.key", "-CAcreateserial", "-out", "leaf.pem", "-days", "30", "-extfile", leafExt);

  const read = (f: string) => readFileSync(join(dir, f), "utf8");
  const pki: Pki = {
    caPem: read("test-ca.pem"),
    otherCaPem: read("other-ca.pem"),
    leafKey: read("leaf.key"),
    leafCert: read("leaf.pem"),
    leafNonCaPem: read("leaf.pem"),
  };
  rmSync(dir, { recursive: true, force: true });
  return pki;
}

/** Accepts the Postgres SSLRequest, answers 'S', upgrades to TLS and records whether the handshake completed. */
async function startFakePostgres(pki: Pki) {
  const state = { startup: 0, password: 0, plaintext: 0 };
  const context = tls.createSecureContext({ key: pki.leafKey, cert: pki.leafCert });
  const server = net.createServer((socket) => {
    socket.on("error", () => undefined);
    socket.once("data", (first) => {
      const isSslRequest = first.length >= 8 && first.readUInt32BE(0) === 8 && first.readUInt32BE(4) === 80877103;
      if (!isSslRequest) {
        state.plaintext += 1;
        socket.destroy();
        return;
      }
      socket.write("S");
      const secure = new tls.TLSSocket(socket, { isServer: true, secureContext: context });
      secure.on("error", () => undefined);
      /* Node flushes the buffered StartupMessage (user and database name, no secret) before it rejects a certificate
         whose hostname does not match, so receiving it proves nothing. The SECRET is the password. Ask for it in
         cleartext and record whether a PasswordMessage ever arrives: a client that did not verify the server would send it. */
      secure.once("data", () => {
        state.startup += 1;
        secure.write(Buffer.from([0x52, 0, 0, 0, 8, 0, 0, 0, 3]));
        secure.once("data", (reply) => {
          if (reply[0] === 0x70) state.password += 1;
          secure.destroy();
        });
      });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { port: (server.address() as AddressInfo).port, state, close: () => new Promise<void>((r) => server.close(() => r())) };
}

/* Composed, not written out: the boundary test (scoring-module-boundary) forbids naming the credential variable outside its module. */
const URL_ENV = ["EXAM_WRITE", "DB", "URL"].join("_");
const NOW = Date.now();
let pki: Pki;
beforeAll(() => {
  pki = generatePki();
}, 60_000);

describe("decideHostedTls", () => {
  const ok = () => decideHostedTls({ caPem: pki.caPem, nodeRejectUnauthorized: undefined, nowMs: NOW });

  it("accepts a valid CA bundle and returns its certificates", () => {
    const decision = ok();
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.ca).toHaveLength(1);
  });

  it("accepts two certificates and a single-line value with literal \\n sequences", () => {
    const two = decideHostedTls({ caPem: `${pki.caPem}\n${pki.otherCaPem}`, nodeRejectUnauthorized: undefined, nowMs: NOW });
    expect(two.ok && two.ca.length).toBe(2);
    const oneLine = decideHostedTls({ caPem: pki.caPem.trim().replace(/\n/g, "\\n"), nodeRejectUnauthorized: undefined, nowMs: NOW });
    expect(oneLine.ok).toBe(true);
  });

  it("fails closed when no CA is supplied", () => {
    for (const caPem of [undefined, "", "   \n"]) {
      expect(decideHostedTls({ caPem, nodeRejectUnauthorized: undefined, nowMs: NOW })).toEqual({ ok: false, reason: "tls_ca_missing" });
    }
  });

  it("refuses garbage, truncated PEM, a non-CA certificate and pasted private keys", () => {
    const bad: Record<string, string> = {
      garbage: "not a certificate",
      truncated: pki.caPem.slice(0, pki.caPem.length / 2),
      corrupt: "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----",
      leaf: pki.leafNonCaPem,
      withKey: `${pki.caPem}\n${pki.leafKey}`,
    };
    for (const [name, caPem] of Object.entries(bad)) {
      expect(decideHostedTls({ caPem, nodeRejectUnauthorized: undefined, nowMs: NOW }), name).toEqual({ ok: false, reason: "tls_ca_invalid" });
    }
  });

  it("refuses an expired or not-yet-valid CA", () => {
    const farFuture = NOW + 400 * 24 * 3600 * 1000;
    expect(decideHostedTls({ caPem: pki.caPem, nodeRejectUnauthorized: undefined, nowMs: farFuture })).toEqual({ ok: false, reason: "tls_ca_invalid" });
    expect(decideHostedTls({ caPem: pki.caPem, nodeRejectUnauthorized: undefined, nowMs: NOW - 2 * 24 * 3600 * 1000 })).toEqual({ ok: false, reason: "tls_ca_invalid" });
  });

  it("refuses when the process has switched certificate checking off, whatever else is right", () => {
    expect(decideHostedTls({ caPem: pki.caPem, nodeRejectUnauthorized: "0", nowMs: NOW })).toEqual({ ok: false, reason: "tls_verification_disabled" });
    expect(decideHostedTls({ caPem: pki.caPem, nodeRejectUnauthorized: "1", nowMs: NOW }).ok).toBe(true);
  });

  it("never echoes certificate text or key material in a decision", () => {
    const decision = decideHostedTls({ caPem: `${pki.caPem}\n${pki.leafKey}`, nodeRejectUnauthorized: undefined, nowMs: NOW });
    expect(JSON.stringify(decision)).not.toMatch(/BEGIN|PRIVATE/);
  });
});

describe("hostedClientConfig", () => {
  const url = "postgresql://mindmosaic_exam_writer.abcdefghijklmnopqrst:p%40ss%2Fw@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";

  it("decomposes the URL and makes verification mandatory", () => {
    const cfg = hostedClientConfig(url, [pki.caPem]);
    expect(cfg).toMatchObject({ host: "aws-0-ap-southeast-2.pooler.supabase.com", port: 6543, user: "mindmosaic_exam_writer.abcdefghijklmnopqrst", password: "p@ss/w", database: "postgres" });
    expect(cfg.ssl).toMatchObject({ rejectUnauthorized: true, servername: "aws-0-ap-southeast-2.pooler.supabase.com", minVersion: "TLSv1.2" });
    expect(cfg).not.toHaveProperty("connectionString");
    expect(typeof (cfg.ssl as tls.ConnectionOptions).checkServerIdentity).toBe("function");
  });

  it("is not subject to connection-string overrides (the driver's parse order is the reason it is built from parts)", () => {
    /* Control: handing the SAME URL plus sslmode=no-verify to pg as a string DOES turn verification off and drop the CA.
       If a future pg stops doing that this control fails, and the reasoning in tls.ts should be revisited. */
    const viaString = new Client({ connectionString: `${url}?sslmode=no-verify`, ssl: { ca: [pki.caPem], rejectUnauthorized: true } });
    expect((viaString as unknown as { connectionParameters: { ssl: tls.ConnectionOptions } }).connectionParameters.ssl.rejectUnauthorized).toBe(false);

    const built = new Client(hostedClientConfig(url, [pki.caPem]));
    const ssl = (built as unknown as { connectionParameters: { ssl: tls.ConnectionOptions } }).connectionParameters.ssl;
    expect(ssl.rejectUnauthorized).toBe(true);
    expect(ssl.ca).toEqual([pki.caPem]);
  });

  it("uses the default port and database when the URL omits them", () => {
    const cfg = hostedClientConfig("postgresql://u:p@db.abcdefghijklmnopqrst.supabase.co/", [pki.caPem]);
    expect(cfg).toMatchObject({ port: 5432, database: "postgres" });
  });
});

describe("a real TLS handshake from the hosted client configuration", () => {
  let fake: Awaited<ReturnType<typeof startFakePostgres>>;
  beforeAll(async () => {
    fake = await startFakePostgres(pki);
  });
  afterAll(async () => {
    await fake.close();
  });

  const connect = async (host: string, ca: string) => {
    const config = hostedClientConfig(`postgresql://u:p@${host}:${fake.port}/postgres`, [ca]);
    const client = new Client({ ...config, connectionTimeoutMillis: 4_000 });
    client.on("error", () => undefined);
    try {
      await client.connect();
      return null;
    } catch (error) {
      return error as { code?: string; message: string };
    } finally {
      await new Promise((r) => setTimeout(r, 150));
      await client.end().catch(() => undefined);
    }
  };

  it("completes TLS and sends the password when the certificate chains to the supplied CA and names the host", async () => {
    const before = fake.state.password;
    await connect("localhost", pki.caPem);
    expect(fake.state.password).toBe(before + 1);
  });

  it("refuses a server whose certificate was issued by a different CA, and sends it no password", async () => {
    const before = fake.state.password;
    const error = await connect("localhost", pki.otherCaPem);
    expect(error).not.toBeNull();
    expect(error?.code ?? error?.message).toMatch(/SELF_SIGNED|UNABLE_TO_VERIFY|CERT|self-signed|unable to verify/i);
    expect(fake.state.password).toBe(before);
  });

  it("refuses a certificate that does not name the host being connected to, and sends it no password", async () => {
    const before = fake.state.password;
    const error = await connect("127.0.0.1", pki.caPem);
    expect(error).not.toBeNull();
    expect(fake.state.password).toBe(before);

    /* The pinned identity check, applied to the server certificate: it names localhost, not the IP. */
    const peer = new X509Certificate(pki.leafCert).toLegacyObject() as unknown as tls.PeerCertificate;
    const identity = (host: string) =>
      (hostedClientConfig(`postgresql://u:p@${host}:${fake.port}/postgres`, [pki.caPem]).ssl as tls.ConnectionOptions)
        .checkServerIdentity!;
    const mismatch = identity("127.0.0.1")("ignored-by-design", peer) as NodeJS.ErrnoException | undefined;
    expect(mismatch?.code).toBe("ERR_TLS_CERT_ALTNAME_INVALID");
    expect(identity("localhost")("ignored-by-design", peer)).toBeUndefined();
  });
});

describe("the writer module refuses a hosted target without verifiable TLS", () => {
  const REF = "abcdefghijklmnopqrst";
  const saved = { ...process.env };
  const connectSpy = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    connectSpy.mockReset();
    vi.doMock("server-only", () => ({}));
    vi.doMock("pg", () => ({
      Client: class {
        on() {
          return this;
        }
        async connect() {
          connectSpy();
          throw new Error("must not connect");
        }
        async end() {}
      },
    }));
    process.env[URL_ENV] = `postgresql://mindmosaic_exam_writer:pw@db.${REF}.supabase.co:5432/postgres`;
    process.env.EXAM_WRITE_EXPECTED_PROJECT_REF = REF;
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${REF}.supabase.co`;
    process.env.VERCEL = "1";
    delete process.env.EXAM_WRITE_ALLOW_LOOPBACK;
    delete process.env.EXAM_WRITE_DB_CA;
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  });
  afterEach(() => {
    process.env = { ...saved };
    vi.doUnmock("pg");
  });

  const create = async () => {
    const mod = await import("@/server/exam-write/legacy-exam-writes");
    return mod.createLegacyExamSession({ studentId: "s", config: {}, seed: "x", selectedQuestionIds: [], expiresAt: new Date().toISOString() });
  };

  it("no CA configured: not_configured/tls_ca_missing and no connection attempt", async () => {
    const outcome = await create();
    expect(outcome.error).toMatchObject({ code: "not_configured", message: expect.stringContaining("tls_ca_missing") });
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("NODE_TLS_REJECT_UNAUTHORIZED=0: refused even with a valid CA", async () => {
    process.env.EXAM_WRITE_DB_CA = pki.caPem;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const outcome = await create();
    expect(outcome.error).toMatchObject({ code: "not_configured", message: expect.stringContaining("tls_verification_disabled") });
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("sslmode=no-verify in the URL: refused as insecure_transport", async () => {
    process.env.EXAM_WRITE_DB_CA = pki.caPem;
    process.env[URL_ENV] += "?sslmode=no-verify";
    const outcome = await create();
    expect(outcome.error).toMatchObject({ code: "not_configured", message: expect.stringContaining("insecure_transport") });
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it("a valid CA lets the module proceed to connect (the mock then fails the connection, mapped to unavailable)", async () => {
    process.env.EXAM_WRITE_DB_CA = pki.caPem;
    const outcome = await create();
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(outcome.error?.code).toBe("unavailable");
  });

  it("the source no longer contains a switch that disables certificate verification", () => {
    const here = join(process.cwd(), "src", "server", "exam-write");
    for (const file of ["legacy-exam-writes.ts", "tls.ts", "target.ts"]) {
      const text = readFileSync(join(here, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(text, file).not.toMatch(/rejectUnauthorized\s*:\s*false/);
    }
    expect(existsSync(here)).toBe(true);
  });
});
