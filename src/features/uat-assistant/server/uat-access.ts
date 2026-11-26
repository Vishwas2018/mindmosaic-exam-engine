import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";

import { isProfileRole, type ProfileRole } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { isUatAssistantEnvironmentAllowed, uatAssistantAvailability } from "../flags";

export const UAT_TESTER_COOKIE_NAME = "mm_uat_tester";
const COOKIE_TTL_SECONDS = 12 * 60 * 60; // 12 hours

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
    return { sub: parsed.sub, bind: parsed.bind, exp: parsed.exp };
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

/**
 * Verifies both that the deployment environment allows the UAT assistant and
 * that the current requester is an authorised admin or allowlisted tester (or
 * holds a valid server-signed tester session cookie minted after signing in as
 * an admin/tester in this browser, enabling seamless cross-portal testing across
 * Admin, Parent, and Student accounts).
 */
export async function verifyUatTesterAccess(
  request?: Request,
  env: EnvMap = process.env,
): Promise<UatAccessDecision> {
  const availability = uatAssistantAvailability(env);
  if (!availability.allowed) {
    return { enabled: false, status: 404, reason: availability.reason };
  }

  const githubConfigured = Boolean(env.MM_UAT_GITHUB_TOKEN?.trim());
  const githubRepo = resolveConfiguredGitHubRepo(env);
  const aiConfigured = isAiProviderConfiguredForUat(env);

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
    }
  } catch {
    // Continue to check signed tester cookie if transient auth lookup fails.
  }

  if (accessRevoked) {
    return { enabled: false, status: 403, reason: "access_revoked" };
  }

  // 1. Direct admin role verification.
  if (userId && activeRole === "admin") {
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
  if (userId && (parseAllowlistIds(env).has(userId) || (userEmail && parseAllowlistEmails(env).has(userEmail)))) {
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

  // 3. Cross-portal signed tester cookie (minted when an admin/tester signed in earlier in this browser).
  let badgeCookie: string | undefined;
  try {
    const jar = await cookies();
    badgeCookie = jar.get(UAT_TESTER_COOKIE_NAME)?.value;
  } catch {
    badgeCookie = undefined;
  }

  const verifiedBadge = verifyTesterBadgeToken(badgeCookie, env);
  if (verifiedBadge) {
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

export function attachTesterBadgeCookie(
  response: NextResponse,
  subject: string,
  env: EnvMap = process.env,
): void {
  if (!isUatAssistantEnvironmentAllowed(env)) return;
  const token = signTesterBadgeToken(subject, env);
  if (!token) return;
  const isHostedHttps = Boolean(env.VERCEL_ENV);
  response.cookies.set(UAT_TESTER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHostedHttps,
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export function clearTesterBadgeCookie(response: NextResponse): void {
  response.cookies.set(UAT_TESTER_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
