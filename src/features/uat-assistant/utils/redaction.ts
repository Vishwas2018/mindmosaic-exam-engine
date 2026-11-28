import type { UatPortalSurface } from "../types";

/**
 * Query and hash parameter names that may carry auth tokens, reset codes,
 * secrets, or session identifiers and must never be recorded in defect reports.
 */
const SENSITIVE_PARAM_PATTERN =
  /^(token|token_hash|access_token|refresh_token|provider_token|id_token|code|apikey|api_key|key|secret|client_secret|password|passwd|pin|otp|auth|signature|sig|nonce)$/i;

/**
 * Secret-like token patterns redacted from free-text notes, DOM snippets, and
 * outbound AI / GitHub payloads.
 */
const SECRET_PATTERNS: readonly { pattern: RegExp; replacement: string }[] = [
  // JWT tokens (three base64url segments starting with eyJ)
  {
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    replacement: "[REDACTED_JWT]",
  },
  // Bearer / Basic authorization headers
  {
    pattern: /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/gi,
    replacement: "$1 [REDACTED_TOKEN]",
  },
  // Stripe, Supabase, GitHub, OpenAI, Anthropic, Google API key shapes
  {
    pattern:
      /\b(sk_(?:live|test)_[A-Za-z0-9]{10,}|rk_(?:live|test)_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|sbp_[A-Za-z0-9]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{20,}|sk-ant-[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{25,})\b/g,
    replacement: "[REDACTED_KEY]",
  },
  // Explicit key/password/pin assignments in text (e.g. password=..., pin: 123456)
  {
    pattern: /\b(password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|pin)\s*([:=])\s*([^\s,;'"`]{3,})/gi,
    replacement: "$1$2[REDACTED]",
  },
];

/**
 * Sanitizes a full or relative URL so auth codes, recovery hashes, and tokens
 * are never captured in local storage, exports, AI prompts, or GitHub issues.
 */
export function sanitizeUrlForReport(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "/";

  const isRelative = trimmed.startsWith("/");
  try {
    const parsed = new URL(trimmed, "https://mindmosaic.local");

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (SENSITIVE_PARAM_PATTERN.test(key)) {
        parsed.searchParams.set(key, "[REDACTED]");
      }
    }

    if (parsed.hash && parsed.hash.length > 1) {
      const hashBody = parsed.hash.slice(1);
      if (hashBody.includes("=")) {
        const hashParams = new URLSearchParams(hashBody);
        let hadSensitive = false;
        for (const key of Array.from(hashParams.keys())) {
          if (SENSITIVE_PARAM_PATTERN.test(key)) {
            hashParams.set(key, "[REDACTED]");
            hadSensitive = true;
          }
        }
        parsed.hash = hadSensitive ? `#${hashParams.toString()}` : parsed.hash;
      }
    }

    const cleanSearch = parsed.search.replace(/%5BREDACTED%5D/g, "[REDACTED]");
    const cleanHash = parsed.hash.replace(/%5BREDACTED%5D/g, "[REDACTED]");

    if (isRelative) {
      return `${parsed.pathname}${cleanSearch}${cleanHash}`;
    }
    return `${parsed.origin}${parsed.pathname}${cleanSearch}${cleanHash}`;
  } catch {
    return redactSensitiveText(trimmed).slice(0, 500);
  }
}

/**
 * Redacts credentials, tokens, API keys, and explicit password/PIN values from
 * free-form text while preserving genuine defect observations.
 */
export function redactSensitiveText(input: string): string {
  let result = input;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Classifies the MindMosaic portal surface from a route pathname.
 */
export function detectPortalSurface(pathname: string): UatPortalSurface {
  const clean = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (clean === "/admin" || clean.startsWith("/admin/")) return "admin";
  if (
    clean === "/student" ||
    clean.startsWith("/student/") ||
    clean === "/exam" ||
    clean.startsWith("/exam/") ||
    clean === "/practice/session" ||
    clean.startsWith("/practice/session/") ||
    clean === "/results" ||
    clean.startsWith("/results/")
  ) {
    return "student";
  }
  if (
    clean === "/parent" ||
    clean.startsWith("/parent/") ||
    clean === "/billing" ||
    clean.startsWith("/billing/")
  ) {
    return "parent";
  }
  if (clean === "/teacher" || clean.startsWith("/teacher/")) return "teacher";
  if (clean === "/dev" || clean.startsWith("/dev/") || clean === "/showcase") return "dev";
  return "public";
}

/**
 * Routes where draft / unpublished question bank content or answer keys may be
 * rendered for human review (e.g. `/admin/review`). On these surfaces, visible
 * text snippets inside question/answer containers are redacted so unpublished
 * answers are never automatically scraped into reports or sent to AI/GitHub.
 */
export function isUnpublishedReviewSurface(pathname: string): boolean {
  const clean = pathname.split("?")[0] ?? "";
  return (
    clean === "/admin/review" ||
    clean.startsWith("/admin/review/") ||
    clean.startsWith("/admin/questions") ||
    clean.startsWith("/admin/publication") ||
    clean.startsWith("/dev/writing") ||
    clean.startsWith("/dev/bar-model")
  );
}

const SENSITIVE_SELECTOR = [
  'input[type="password"]',
  'input[type="hidden"]',
  'input[autocomplete*="password"]',
  'input[autocomplete="one-time-code"]',
  'input[autocomplete^="cc-"]',
  'input[name*="password" i]',
  'input[name*="secret" i]',
  'input[name*="token" i]',
  'input[name*="pin" i]',
  "[data-sensitive]",
  "[data-uat-redact]",
  "[data-correct]",
  "[data-answer]",
  "[data-solution]",
  "[data-explanation]",
  ".worked-solution",
].join(", ");

const QUESTION_ANSWER_REVIEW_SELECTOR = [
  "[data-question-answer]",
  "[data-correct-answer]",
  "[data-rationale]",
  "[data-rubric]",
  "[data-draft-question]",
  "article",
  "pre",
  "code",
].join(", ");

/**
 * Determines whether an element or one of its ancestors carries credentials,
 * tokens, or answer-key material whose text must never be scraped.
 */
export function isSensitiveDomElement(element: Element, pathname: string = "/"): boolean {
  try {
    if (element.matches(SENSITIVE_SELECTOR) || element.closest(SENSITIVE_SELECTOR)) {
      return true;
    }
    if (isUnpublishedReviewSurface(pathname)) {
      const text = (element.textContent ?? "").toLowerCase();
      if (
        /\b(correct answer|answer key|model answer|worked solution|marking guide|distractor rationale)\b/.test(
          text,
        )
      ) {
        return true;
      }
      if (
        element.matches(QUESTION_ANSWER_REVIEW_SELECTOR) &&
        /\b(correct|answer|explanation|rationale|solution)\b/i.test(element.className || element.id || "")
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Summarises a browser User-Agent string into a clean, non-identifying label.
 */
export function summarizeBrowserUserAgent(userAgent: string): string {
  if (!userAgent) return "Unknown browser";
  const os = /Windows NT/i.test(userAgent)
    ? "Windows"
    : /Mac OS X|Macintosh/i.test(userAgent)
      ? "macOS"
      : /Android/i.test(userAgent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(userAgent)
          ? "iOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "Unknown OS";

  const edge = /Edg\/(\d+)/.exec(userAgent);
  if (edge) return `Edge ${edge[1]} · ${os}`;
  const firefox = /Firefox\/(\d+)/.exec(userAgent);
  if (firefox) return `Firefox ${firefox[1]} · ${os}`;
  const chrome = /Chrome\/(\d+)/.exec(userAgent);
  if (chrome) return `Chrome ${chrome[1]} · ${os}`;
  const safari = /Version\/(\d+).*Safari\//.exec(userAgent);
  if (safari) return `Safari ${safari[1]} · ${os}`;
  return os;
}

export interface UatWorkspaceContext {
  readonly portal: UatPortalSurface;
  readonly activeWorkspace: "admin" | "student" | "parent" | "teacher" | null;
  readonly workspaceEntitled: boolean;
  readonly activeRole: string | null;
}

/**
 * Labels a report with the workspace it was filed from. Pure and advisory: the route is client-observed, so the result
 * is only ever stored on a defect, never used to authorise anything. `entitledRoles` comes from the server.
 */
export function resolveWorkspaceContext(
  pathname: string,
  primaryRole: string | null,
  entitledRoles: readonly string[],
): UatWorkspaceContext {
  const portal = detectPortalSurface(pathname);
  const activeWorkspace =
    portal === "admin" || portal === "student" || portal === "parent" || portal === "teacher" ? portal : null;
  const workspaceEntitled = activeWorkspace === null ? true : entitledRoles.includes(activeWorkspace);
  return {
    portal,
    activeWorkspace,
    workspaceEntitled,
    activeRole: activeWorkspace && workspaceEntitled ? activeWorkspace : primaryRole,
  };
}
