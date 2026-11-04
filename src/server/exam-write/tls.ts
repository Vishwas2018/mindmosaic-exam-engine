import { X509Certificate } from "node:crypto";
import { isIP } from "node:net";
import { checkServerIdentity } from "node:tls";

import type { ClientConfig } from "pg";

/**
 * VERIFIED TLS for the hosted exam-write connection (family-beta WP1).
 *
 * The writer credential is a database password sent over the network. Encryption without verification protects it
 * from a passive observer only; an on-path attacker presenting any certificate would receive it. So a hosted
 * connection is made only when ALL of the following hold, and otherwise the write is refused (`not_configured`,
 * nothing connects):
 *
 *   1. a trust anchor was supplied by the operator (`EXAM_WRITE_DB_CA`, PEM): there is deliberately no fallback to
 *      "trust whatever the platform trusts" and none to "trust nothing, skip checks";
 *   2. every certificate in it parses, is a CA (basicConstraints CA:TRUE) and is within its validity period, and no
 *      private key material was pasted in by mistake;
 *   3. `NODE_TLS_REJECT_UNAUTHORIZED=0` is not set (it switches certificate checking off for the whole process, whatever
 *      a client asks for);
 *   4. the connection string carries no `sslmode` other than `verify-full` (decided in ./target.ts).
 *
 * WHY THE CONNECTION IS BUILT FROM PARTS RATHER THAN HANDED TO `pg` AS A STRING. Measured against the installed
 * driver (pg 8.22 / pg-connection-string 2.14): a connection string is parsed AFTER the explicit options and overrides
 * them. Any `sslmode` in the string replaces `ssl` with a fresh object (dropping our CA), `sslmode=no-verify` sets
 * `rejectUnauthorized: false`, and `sslrootcert`/`sslcert`/`sslkey` read files from disk. So the URL is decomposed here
 * (host, port, user, password, database) and the `ssl` option is ours alone. Hostname verification is Node's default
 * `checkServerIdentity` against the URL's host; it is never replaced.
 *
 * Pure: no environment access, no logging. Nothing in a result contains the URL, the password or the certificate text.
 */

export type TlsRejection = "tls_ca_missing" | "tls_ca_invalid" | "tls_verification_disabled";

export type TlsDecision =
  | { readonly ok: true; readonly ca: readonly string[] }
  | { readonly ok: false; readonly reason: TlsRejection };

export interface TlsInput {
  /** `EXAM_WRITE_DB_CA`: one or more PEM certificates; a literal `\n` (single-line env value) is accepted. */
  readonly caPem: string | undefined;
  /** `process.env.NODE_TLS_REJECT_UNAUTHORIZED`, passed in so this stays pure. */
  readonly nodeRejectUnauthorized: string | undefined;
  readonly nowMs: number;
}

const CERTIFICATE = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const MAX_CERTIFICATES = 8;

const reject = (reason: TlsRejection): TlsDecision => ({ ok: false, reason });

export function decideHostedTls(input: TlsInput): TlsDecision {
  if (input.nodeRejectUnauthorized?.trim() === "0") return reject("tls_verification_disabled");

  const raw = input.caPem?.trim();
  if (!raw) return reject("tls_ca_missing");
  /* A value pasted into a single-line env var carries literal "\n" sequences; real newlines pass through untouched. */
  const pem = raw.replace(/\\n/g, "\n");
  if (/PRIVATE KEY-----/.test(pem)) return reject("tls_ca_invalid");

  const blocks = pem.match(CERTIFICATE) ?? [];
  if (blocks.length === 0 || blocks.length > MAX_CERTIFICATES) return reject("tls_ca_invalid");

  const ca: string[] = [];
  for (const block of blocks) {
    let cert: X509Certificate;
    try {
      cert = new X509Certificate(block);
    } catch {
      return reject("tls_ca_invalid");
    }
    if (!cert.ca) return reject("tls_ca_invalid");
    if (input.nowMs < Date.parse(cert.validFrom) || input.nowMs >= Date.parse(cert.validTo)) {
      return reject("tls_ca_invalid");
    }
    ca.push(block);
  }
  return { ok: true, ca };
}

/** The decoded parts of a validated `postgres(ql)://` URL. Never logged. */
function decodePart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The `pg` client configuration for a hosted target. The URL's host has already been matched against the documented
 * Supabase direct and pooler hosts by `decideExamWriteTarget`; this only turns it into options, with certificate and
 * hostname verification mandatory and the trust anchor restricted to the supplied CA.
 */
export function hostedClientConfig(url: string, ca: readonly string[]): ClientConfig {
  const parsed = new URL(url);
  const host = parsed.hostname;
  return {
    host,
    port: parsed.port ? Number(parsed.port) : 5432,
    user: decodePart(parsed.username),
    password: decodePart(parsed.password),
    database: decodePart(parsed.pathname.replace(/^\//, "")) || "postgres",
    connectionTimeoutMillis: 8_000,
    ssl: {
      ca: [...ca],
      rejectUnauthorized: true,
      ...(isIP(host) === 0 ? { servername: host } : {}),
      minVersion: "TLSv1.2",
      /* Pin the name being verified to the URL host. Left to the default, Node derives it from servername/host/socket and
         falls back to "localhost" when pg supplies none (it supplies none for an IP host): measured, the password reached a
         server whose certificate named only "localhost" while connecting to 127.0.0.1. */
      checkServerIdentity: (_name, cert) => checkServerIdentity(host, cert),
    },
  };
}
