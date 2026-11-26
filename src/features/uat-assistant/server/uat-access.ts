import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";

import { isProfileRole, type ProfileRole } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { isUatAssistantEnvironmentAllowed, uatAssistantAvailability } from "../flags";
import { resolveNvidiaChatCompletionsUrl } from "./ai-improver";
import {
  checkUatAdminMfa,
  createUatServiceClient,
  loadUatGrants,
  resolveUatAdminStanding,
  revalidateTesterSubject,
} from "./uat-entitlement";

export const UAT_TESTER_COOKIE_NAME = "mm_uat_tester";
export const UAT_TESTER_HINT_COOKIE_NAME = "mm_uat_hint";
/** Set by "End UAT session": the assistant stays off in this browser until the tester explicitly starts a new session. */
export const UAT_SESSION_ENDED_COOKIE_NAME = "mm_uat_ended";
export const COOKIE_TTL_SECONDS = 4 * 60 * 60; // 4 hours (was 12): a tester session is a working shift, not a day.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface VerifiedUatTester {
  readonly enabled: true;
  readonly activeRole: ProfileRole | "guest";
  readonly authorizedVia: "admin_role" | "tester_allowlist" | "tester_cookie" | "local_preview";
  readonly shouldIssueTesterCookie: boolean;
  readonly testerSubject: string;
  readonly githubConfigured: boolean;
  readonly githubRepo: string;
  readonly aiConfigured: boolean;
}

export type UatAccessDecision =
  | VerifiedUatTester
  | {
      readonly enabled: false;
      readonly status: 403 | 404;
      readonly reason: string;
      /** True when the browser's tester credential must be discarded (revoked, MFA lapsed, ...). */
      readonly clearCredentials?: boolean;
    };

type EnvMap = Readonly<Record<string, string | undefined>>;

function parseAllowlistIds(env: EnvMap): ReadonlySet<string> {
  return new Set(
    (env.MM_UAT_TESTER_USER_IDS ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => UUID_PATTERN.test(item)),
  );
}

function parseAllowlistEmails(env: EnvMap): ReadonlySet<string> {
  return new Set(
    (env.MM_UAT_TESTER_EMAILS ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.includes("@")),
  );
}

function resolveSigningSecret(env: EnvMap): string | null {
  const dedicated = env.MM_UAT_SESSION_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey && serviceKey.length >= 16) {
    return createHmac("sha256", serviceKey).update("mindmosaic-uat-tester-cookie-v1").digest("hex");
  }
  return null;
}

function resolveSupabaseBinding(env: EnvMap): string {
  const raw = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return "unconfigured";
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return "invalid";
  }
}

interface TesterBadgePayload {
  readonly sub: string;
  readonly bind: string;
  readonly exp: number;
  /** Random per-session id (audit/traceability; also makes every minted cookie distinct). */
  readonly sid: string;
  /** Rotating MM_UAT_SESSION_EPOCH lets an owner invalidate every outstanding tester cookie at once. */
  readonly epoch: string;
}

function currentEpoch(env: EnvMap): string {
  return env.MM_UAT_SESSION_EPOCH?.trim() || "0";
}

export function signTesterBadgeToken(
  subject: string,
  env: EnvMap = process.env,
  nowMs: number = Date.now(),
): string | null {
  const secret = resolveSigningSecret(env);
  if (!secret) return null;
  const payload: TesterBadgePayload = {
    sub: subject,
    bind: resolveSupabaseBinding(env),
    exp: Math.floor(nowMs / 1000) + COOKIE_TTL_SECONDS,
    sid: randomUUID(),
    epoch: currentEpoch(env),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyTesterBadgeToken(
  token: string | undefined,
  env: EnvMap = process.env,
  nowMs: number = Date.now(),
): TesterBadgePayload | null {
  if (!token) return null;
  const secret = resolveSigningSecret(env);
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = createHmac("sha256", secret).update(encoded).digest("base64url");
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<TesterBadgePayload>;
    if (typeof parsed.sub !== "string" || !parsed.sub) return null;
    if (typeof parsed.bind !== "string" || parsed.bind !== resolveSupabaseBinding(env)) return null;
    if (typeof parsed.exp !== "number" || parsed.exp <= Math.floor(nowMs / 1000)) return null;
    if (typeof parsed.sid !== "string" || !parsed.sid) return null;
    if (parsed.epoch !== currentEpoch(env)) return null;
    return { sub: parsed.sub, bind: parsed.bind, exp: parsed.exp, sid: parsed.sid, epoch: parsed.epoch };
  } catch {
    return null;
  }
}

export function isAiProviderConfiguredForUat(env: EnvMap = process.env): boolean {
  const provider = (env.MM_UAT_AI_PROVIDER ?? env.QF_AI_PROVIDER)?.trim().toLowerCase();
  if (provider === "anthropic") return Boolean(env.ANTHROPIC_API_KEY?.trim());
  if (provider === "openai") return Boolean(env.OPENAI_API_KEY?.trim());
  if (provider === "gemini") {
    return Boolean((env.GEMINI_API_KEY || env.GOOGLE_API_KEY)?.trim() && env.QF_AI_GEMINI_MODEL?.trim());
  }
  if (provider === "nvidia") {
    return Boolean(
      env.NVIDIA_API_KEY?.trim() &&
        env.QF_AI_NVIDIA_MODEL?.trim() &&
        resolveNvidiaChatCompletionsUrl(env).ok,
    );
  }
  return false;
}

export function resolveConfiguredGitHubRepo(env: EnvMap = process.env): string {
  const candidate = env.MM_UAT_GITHUB_REPO?.trim() || "Vishwas2018/mindmosaic-exam-engine";
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(candidate)
    ? candidate
    : "Vishwas2018/mindmosaic-exam-engine";
}

async function isLoopbackRequest(request?: Request): Promise<boolean> {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return false;
  try {
    const hostHeader = request ? request.headers.get("host") : (await headers()).get("host");
    const hostname = (hostHeader ?? "").split(":")[0]?.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
  } catch {
    return false;
  }
}

export interface VerifyOptions {
  /** Used only by the explicit "Start UAT session" action, which must work while the ended marker is present. */
  readonly ignoreEnded?: boolean;
}

/**
 * Verifies both that the deployment environment allows the UAT assistant and that the requester may use it:
 *   1. an administrator by the multi-role entitlement model (active admin grant; MFA honoured), or
 *   2. an explicitly allowlisted tester, or
 *   3. holder of a server-signed tester cookie whose minting subject is RE-VALIDATED on every request.
 * It never bypasses Admin MFA: an account with an admin entitlement that lacks the required aal2 level is refused
 * outright, even if it is also allowlisted or holds a cookie. Lookup failures fail closed.
 */
export async function verifyUatTesterAccess(
  request?: Request,
  env: EnvMap = process.env,
  options: VerifyOptions = {},
): Promise<UatAccessDecision> {
  const availability = uatAssistantAvailability(env);
  if (!availability.allowed) {
    return { enabled: false, status: 404, reason: availability.reason };
  }

  const githubConfigured = Boolean(env.MM_UAT_GITHUB_TOKEN?.trim());
  const githubRepo = resolveConfiguredGitHubRepo(env);
  const aiConfigured = isAiProviderConfiguredForUat(env);

  let jar: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    jar = await cookies();
  } catch {
    jar = null;
  }
  if (!options.ignoreEnded && jar?.get(UAT_SESSION_ENDED_COOKIE_NAME)?.value === "1") {
    return { enabled: false, status: 403, reason: "session_ended" };
  }

  // Unconfigured-Supabase local preview harness on loopback only.
  if (!isSupabaseConfigured) {
    if (await isLoopbackRequest(request)) {
      return {
        enabled: true,
        activeRole: "guest",
        authorizedVia: "local_preview",
        shouldIssueTesterCookie: false,
        testerSubject: "local-preview",
        githubConfigured,
        githubRepo,
        aiConfigured,
      };
    }
    return { enabled: false, status: 403, reason: "supabase_not_configured" };
  }

  let activeRole: ProfileRole | "guest" = "guest";
  let userId: string | null = null;
  let userEmail: string | null = null;
  let accessRevoked = false;
  let standing: ReturnType<typeof resolveUatAdminStanding> = { kind: "not_admin" };
  let mfaOutcome: "ok" | "step_up" | "deny" = "ok";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id.toLowerCase();
      userEmail = user.email?.toLowerCase() ?? null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, access_revoked_at")
        .eq("id", user.id)
        .single();

      accessRevoked = Boolean(profile?.access_revoked_at);
      if (!accessRevoked && isProfileRole(profile?.role)) {
        activeRole = profile.role;
      }
      const grants = await loadUatGrants(supabase, user.id);
      standing = resolveUatAdminStanding(profile?.role, grants, accessRevoked);
      if (standing.kind === "admin" && standing.mfaApplies) {
        mfaOutcome = await checkUatAdminMfa(supabase);
      }
    }
  } catch {
    // Could not establish who this is: nothing below grants admin from an unknown state.
    if (userId) standing = { kind: "unknown" };
  }

  if (accessRevoked) {
    return { enabled: false, status: 403, reason: "access_revoked", clearCredentials: true };
  }
  // Fail closed: a signed-in account whose entitlement could not be read gets nothing, not even via allowlist/cookie.
  if (userId && standing.kind === "unknown") {
    return { enabled: false, status: 403, reason: "entitlement_lookup_failed" };
  }
  // Admin MFA is never bypassed: an admin without aal2 gets no UAT access by any path (and any old cookie is dropped).
  if (userId && standing.kind === "admin" && mfaOutcome !== "ok") {
    return { enabled: false, status: 403, reason: "admin_mfa_required", clearCredentials: true };
  }

  // 1. Active administrator (entitlement + MFA already enforced above).
  if (userId && standing.kind === "admin") {
    return {
      enabled: true,
      activeRole,
      authorizedVia: "admin_role",
      shouldIssueTesterCookie: true,
      testerSubject: userId,
      githubConfigured,
      githubRepo,
      aiConfigured,
    };
  }

  // 2. Explicit tester allowlist (user ID or email).
  const allowIds = parseAllowlistIds(env);
  const allowEmails = parseAllowlistEmails(env);
  if (userId && (allowIds.has(userId) || (userEmail && allowEmails.has(userEmail)))) {
    return {
      enabled: true,
      activeRole,
      authorizedVia: "tester_allowlist",
      shouldIssueTesterCookie: true,
      testerSubject: userId,
      githubConfigured,
      githubRepo,
      aiConfigured,
    };
  }

  // 3. Cross-portal signed tester cookie (lets an admin/tester switch into Student/Parent test accounts).
  const verifiedBadge = verifyTesterBadgeToken(jar?.get(UAT_TESTER_COOKIE_NAME)?.value, env);
  if (verifiedBadge) {
    // The cookie alone is never enough: its minting subject must still be entitled right now.
    const service = createUatServiceClient(env);
    if (!service) {
      return { enabled: false, status: 403, reason: "revalidation_unavailable" };
    }
    const outcome = await revalidateTesterSubject(service, verifiedBadge.sub, {
      ids: allowIds,
      emails: allowEmails,
    });
    if (!outcome.ok) {
      return {
        enabled: false,
        status: 403,
        reason: outcome.reason === "lookup_failed" ? "entitlement_lookup_failed" : "tester_revoked",
        clearCredentials: outcome.reason !== "lookup_failed",
      };
    }
    return {
      enabled: true,
      activeRole,
      authorizedVia: "tester_cookie",
      shouldIssueTesterCookie: false,
      testerSubject: verifiedBadge.sub,
      githubConfigured,
      githubRepo,
      aiConfigured,
    };
  }

  return { enabled: false, status: 403, reason: "tester_role_required" };
}

function cookieSecurity(env: EnvMap): { secure: boolean } {
  return { secure: Boolean(env.VERCEL_ENV) };
}

export function attachTesterBadgeCookie(
  response: NextResponse,
  subject: string,
  env: EnvMap = process.env,
): void {
  if (!isUatAssistantEnvironmentAllowed(env)) return;
  const { secure } = cookieSecurity(env);
  const token = signTesterBadgeToken(subject, env);
  if (token) {
    response.cookies.set(UAT_TESTER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: COOKIE_TTL_SECONDS,
    });
  }
  // Non-sensitive presence hint so client bootstrap skips `/api/uat/session` on ordinary anonymous visitors.
  response.cookies.set(UAT_TESTER_HINT_COOKIE_NAME, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
  // A fresh, explicit start supersedes an earlier "ended" marker.
  response.cookies.set(UAT_SESSION_ENDED_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
}

/** Drops the tester credential. With `ended`, also leaves a marker so the assistant stays off until explicitly restarted. */
export function clearTesterBadgeCookie(
  response: NextResponse,
  options: { ended?: boolean; env?: EnvMap } = {},
): void {
  const { secure } = cookieSecurity(options.env ?? process.env);
  response.cookies.set(UAT_TESTER_COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
  response.cookies.set(UAT_TESTER_HINT_COOKIE_NAME, "", {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  if (options.ended) {
    response.cookies.set(UAT_SESSION_ENDED_COOKIE_NAME, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: COOKIE_TTL_SECONDS,
    });
  }
}
