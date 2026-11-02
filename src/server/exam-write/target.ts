/**
 * POSITIVE TARGET IDENTITY for the exam write role (family-beta WP1).
 *
 * `legacy-exam-writes.ts` holds a database credential that can create exam sessions and record attempts. Before it
 * connects, the credential's URL must PROVE which database it points at and that the role is the restricted one. A
 * missing, ambiguous, conflicting or mismatched identity is a refusal, never a guess: a hosted write with no declared
 * expectation is exactly how a DEV rollout writes to the wrong project.
 *
 * Pure on purpose: no environment access, no I/O, no logging. The caller passes everything in, so every rule below is
 * unit-testable, and the credential is read in one place only (the boundary test asserts that).
 *
 * WHAT A DECISION CONTAINS. Only enumerated reason codes, a kind, and the project ref. The URL, the password and the
 * connection string never appear in a decision, an error message or a log: a project ref is an identifier, not a
 * secret, and a password is never copied out of the URL by this file.
 *
 * SUPPORTED FORMATS (Supabase documented):
 *   direct  postgresql://mindmosaic_exam_writer:<pw>@db.<ref>.supabase.co:5432/postgres
 *   pooler  postgresql://mindmosaic_exam_writer.<ref>:<pw>@<region>.pooler.supabase.com:{5432|6543}/postgres
 *   local   postgresql://mindmosaic_exam_writer:<pw>@{127.0.0.1|localhost|[::1]}:<port>/postgres
 * Local is accepted only when the caller says local use was explicitly enabled AND the process is not a hosted runtime.
 */

export const EXAM_WRITER_ROLE = "mindmosaic_exam_writer";

/** Supabase project refs are 20 lowercase alphanumerics. */
const REF = /^[a-z0-9]{20}$/;
const DIRECT_HOST = /^db\.([a-z0-9]{20})\.supabase\.co$/;
const POOLER_HOST = /^[a-z0-9-]+\.pooler\.supabase\.com$/;
const API_HOST = /^([a-z0-9]{20})\.supabase\.co$/;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Connection-string parameters that cannot redirect the connection. `pg` honours `host`, `hostaddr`, `user`, `dbname`
 * and others from the query, so an allow-list (not a block-list) is the only safe shape.
 */
const ALLOWED_PARAMETERS = new Set(["sslmode", "application_name", "connect_timeout", "pgbouncer"]);

export type TargetRejection =
  | "missing_url"
  | "unparseable_url"
  | "unsupported_scheme"
  | "unsupported_parameter"
  | "insecure_transport"
  | "unrecognised_host"
  | "wrong_role"
  | "ambiguous_identity"
  | "missing_expected_ref"
  | "invalid_expected_ref"
  | "ref_mismatch"
  | "missing_public_ref"
  | "public_ref_conflict"
  | "loopback_not_enabled"
  | "loopback_in_hosted_runtime"
  | "role_attributes";

export interface TargetInput {
  /** The credential URL exactly as configured; `undefined`/blank means "not configured". */
  readonly url: string | undefined;
  /** The project ref this deployment declares it must write to. Required for every hosted target. */
  readonly expectedRef: string | undefined;
  /** The deployment's public Supabase URL: the independent second witness of the project identity. */
  readonly publicSupabaseUrl: string | undefined;
  /** Explicit opt-in for a loopback database (local development, CI). Never inferred. */
  readonly allowLoopback: boolean;
  /** True on a hosted runtime (Vercel). A loopback target there is a misconfiguration, whatever the opt-in says. */
  readonly hostedRuntime: boolean;
}

export type TargetDecision =
  | { readonly ok: true; readonly kind: "hosted"; readonly ref: string; readonly via: "direct" | "pooler" }
  | { readonly ok: true; readonly kind: "loopback"; readonly ref: null; readonly via: "loopback" }
  | { readonly ok: false; readonly reason: TargetRejection };

const reject = (reason: TargetRejection): TargetDecision => ({ ok: false, reason });

function decode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** The ref of a hosted Supabase API URL (`https://<ref>.supabase.co`), `"loopback"` for a local one, else null. */
function publicIdentity(raw: string): string | "loopback" | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (LOOPBACK_HOSTS.has(parsed.hostname)) return "loopback";
  if (parsed.protocol !== "https:") return null;
  const match = API_HOST.exec(parsed.hostname);
  return match ? match[1]! : null;
}

export function decideExamWriteTarget(input: TargetInput): TargetDecision {
  const raw = input.url?.trim();
  if (!raw) return reject("missing_url");

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return reject("unparseable_url");
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") return reject("unsupported_scheme");
  for (const name of url.searchParams.keys()) {
    if (!ALLOWED_PARAMETERS.has(name)) return reject("unsupported_parameter");
  }

  const user = decode(url.username);
  if (user === null || user.length === 0) return reject("wrong_role");
  const host = url.hostname.toLowerCase();

  /* ---- loopback ------------------------------------------------------------------------------------------ */
  if (LOOPBACK_HOSTS.has(host)) {
    if (input.hostedRuntime) return reject("loopback_in_hosted_runtime");
    if (!input.allowLoopback) return reject("loopback_not_enabled");
    if (user !== EXAM_WRITER_ROLE) return reject("wrong_role");
    /* A loopback database next to a hosted public URL is two different identities. */
    const publicSide = input.publicSupabaseUrl?.trim() ? publicIdentity(input.publicSupabaseUrl) : "loopback";
    if (publicSide !== "loopback") return reject("public_ref_conflict");
    return { ok: true, kind: "loopback", ref: null, via: "loopback" };
  }

  /* ---- hosted: derive the ref from the URL itself ---------------------------------------------------------- */
  let urlRef: string;
  let via: "direct" | "pooler";
  const direct = DIRECT_HOST.exec(host);
  if (direct) {
    via = "direct";
    urlRef = direct[1]!;
    if (user !== EXAM_WRITER_ROLE) return reject(user.startsWith(`${EXAM_WRITER_ROLE}.`) ? "ambiguous_identity" : "wrong_role");
  } else if (POOLER_HOST.test(host)) {
    via = "pooler";
    /* The pooler multiplexes projects: the project is named by the username suffix and by nothing else. */
    const prefix = `${EXAM_WRITER_ROLE}.`;
    if (!user.startsWith(prefix)) return reject(user === EXAM_WRITER_ROLE ? "ambiguous_identity" : "wrong_role");
    const suffix = user.slice(prefix.length);
    if (!REF.test(suffix)) return reject("ambiguous_identity");
    urlRef = suffix;
  } else {
    return reject("unrecognised_host");
  }

  /* A hosted connection must not be configured to fall back to plaintext. */
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode !== null && ["disable", "allow", "prefer"].includes(sslmode.toLowerCase())) {
    return reject("insecure_transport");
  }

  /* Hosted writes need a declared expectation. It is deliberately not optional. */
  const expected = input.expectedRef?.trim();
  if (!expected) return reject("missing_expected_ref");
  if (!REF.test(expected)) return reject("invalid_expected_ref");
  if (expected !== urlRef) return reject("ref_mismatch");

  /* The second, independent witness: the public API URL must name the same project. */
  const publicRaw = input.publicSupabaseUrl?.trim();
  if (!publicRaw) return reject("missing_public_ref");
  if (publicIdentity(publicRaw) !== expected) return reject("public_ref_conflict");

  return { ok: true, kind: "hosted", ref: urlRef, via };
}

/** What `pg_roles` says about the connected role. Any elevated attribute disqualifies it. */
export interface ConnectedRole {
  readonly currentUser: string;
  readonly sessionUser: string;
  readonly superuser: boolean;
  readonly bypassRls: boolean;
  readonly createRole: boolean;
  readonly createDb: boolean;
  readonly replication: boolean;
}

/** Checked after connecting: the credential must really be the restricted writer, whatever the URL claimed. */
export function checkConnectedRole(role: ConnectedRole | null): TargetRejection | null {
  if (!role) return "wrong_role";
  if (role.currentUser !== EXAM_WRITER_ROLE || role.sessionUser !== EXAM_WRITER_ROLE) return "wrong_role";
  if (role.superuser || role.bypassRls || role.createRole || role.createDb || role.replication) return "role_attributes";
  return null;
}
