import "server-only";

import {
  buildAllPatternReadiness,
  EXAM_PATTERNS,
  type ExamPattern,
  type PatternReadinessMap,
} from "@/features/exam-engine/exam-patterns";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { getExamBank, getPatternReadiness } from "./exam-bank";

/**
 * Preview-only delivery of the 12-question Year 6 Scholarship sample (owner-authorised, development only).
 *
 * This is NOT publication. The 12 questions are legacy imports of unverified origin; ADR-017 still refuses to
 * admit, stage or publish them, and nothing here touches that route, the governed bank, the manifests or the
 * publication approvals. Instead the existing server-authoritative exam journey (session -> submit -> results)
 * is given a second, narrowly gated question source for ONE pattern, for an explicit allowlist of accounts.
 *
 * Fail-closed by construction. The sample exists only when ALL of the following hold, checked on the server:
 *   1. SCHOLARSHIP_SAMPLE_PREVIEW is exactly "enabled";
 *   2. the deployment context is on an allowlist of non-production contexts: Vercel "preview" or "development", or no
 *      Vercel context at all (a local stack, which must then also be a loopback Supabase). Production, and any
 *      context this code has never heard of, is refused;
 *   3. SCHOLARSHIP_SAMPLE_SUPABASE_REF names the Supabase project this deployment is actually configured with
 *      (or "local" for a loopback stack), so the sample cannot be switched on against a database nobody chose;
 *   4. the signed-in user's id is in SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS.
 * and the 12 raw question objects still hash to the values pinned from the import manifest.
 * With the flag unset (production, every other environment today) every function below is a no-op and the
 * behaviour of the app is unchanged.
 */

export const SCHOLARSHIP_SAMPLE_PATTERN_ID = "scholarship-y6-comprehensive-sample-module";

/** Shown to every student who can see the sample. */
export const SCHOLARSHIP_SAMPLE_NOTICE = "Unreviewed practice sample — Development testing only";

const ALLOWED_DEPLOYMENT_CONTEXTS: ReadonlySet<string> = new Set(["preview", "development"]);

/** raw-question (D1) hashes from docs/reviews/legacy-content-provenance-phase1/sample-import-manifest.json. */
export const SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES: Readonly<Record<string, string>> = Object.freeze({
  "scholarship-y6-vr-001": "a66d7ab60d61007d5564a05ede8db156d96137de9db317467ce79d9119e3f86d",
  "scholarship-y6-vr-016": "3bc02a9b45da0f72701ce75501215e9d461218e39db2f5df65617e6a7fceb22a",
  "scholarship-y6-vr-032": "743f6164cdd5d000956615d2ab8674e8e75bb4b832cc6e53e454fdb14a6ef1aa",
  "scholarship-y6-nr-001": "e18ddd9625b44b4eedb5951cbc18c03c8de216e61930b0936a7276cb0f43cc81",
  "scholarship-y6-nr-022": "8758ac61587d966b235e83cd18564b1e0fa577485306054052487189bc4fa7c2",
  "scholarship-y6-nr-023": "52d196a6d5d1829e7695bc8833a19c87bf7cfec3a65117138d83de3bf1473b03",
  "scholarship-y6-rc-001": "8d09cf53874fc518060835d50b55025d19d2808c11e72d64bee7a9c2e4a02c0c",
  "scholarship-y6-rc-002": "88ae673686bc79d65cb76c76bb52aa5145d089f5e8b727ad7f776f34d9e2be67",
  "scholarship-y6-rc-003": "39ae557efa78dfdd1425b3ee60677dbb04c928579dc9b7591176509192cf6680",
  "scholarship-y6-maths-004": "8aeef3fbabe39264200fbff733fc111ccb56f8761a003492374e611184d797d2",
  "scholarship-y6-maths-007": "93bfea7f835eaf40d2b37b34f8c63977d22fb51fec67dc421ba46fc8b8c97808",
  "scholarship-y6-maths-014": "71d11fa2c35f6551f230f3d018eaa0c7ef06932f1a60ccb1a4734d6867c2995c",
});

type Env = Readonly<Record<string, string | undefined>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Flag is on in a non-production deployment: Scholarship is then hidden from everyone not allowlisted. */
export function isScholarshipSampleModeActive(env: Env = process.env): boolean {
  if (env.SCHOLARSHIP_SAMPLE_PREVIEW !== "enabled") return false;
  if (env.VERCEL_TARGET_ENV === "production") return false;
  const context = env.VERCEL_ENV?.trim().toLowerCase();
  if (context) return ALLOWED_DEPLOYMENT_CONTEXTS.has(context);
  /* No Vercel context: only a loopback Supabase may be paired with it (unknown hosting never qualifies). */
  return configuredSupabaseRef(env) === "local";
}

/** The project ref the deployment's Supabase URL points at, or "local" for a loopback stack. */
function configuredSupabaseRef(env: Env): string | null {
  const raw = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host === "127.0.0.1" || host === "localhost") return "local";
    return host.endsWith(".supabase.co") ? host.split(".")[0]! : null;
  } catch {
    return null;
  }
}

function allowedUserIds(env: Env): ReadonlySet<string> {
  return new Set(
    (env.SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => UUID.test(entry)),
  );
}

export function isScholarshipSampleAllowedFor(userId: string | null | undefined, env: Env = process.env): boolean {
  if (!userId || !isScholarshipSampleModeActive(env)) return false;
  const ref = configuredSupabaseRef(env);
  if (!ref || env.SCHOLARSHIP_SAMPLE_SUPABASE_REF?.trim().toLowerCase() !== ref) return false;
  /* Belt and braces: refs the owner has listed as production can never be bound, even by mistake. */
  const forbidden = (env.SCHOLARSHIP_SAMPLE_FORBIDDEN_SUPABASE_REFS ?? "").split(",").map((entry) => entry.trim().toLowerCase());
  if (forbidden.includes(ref)) return false;
  return allowedUserIds(env).has(userId.toLowerCase());
}

/** True for every Scholarship pattern while the mode is active and the viewer is not allowlisted. */
export function isScholarshipHiddenFor(
  pattern: Pick<ExamPattern, "examStyle">,
  userId: string | null | undefined,
  env: Env = process.env,
): boolean {
  if (pattern.examStyle !== "scholarship_style") return false;
  return isScholarshipSampleModeActive(env) && !isScholarshipSampleAllowedFor(userId, env);
}

let sampleCache: Promise<readonly AuthoringQuestion[]> | undefined;

/**
 * The 12 questions, built exactly as the publication builder would render them, after checking each raw object
 * against its pinned hash. Any drift, missing item or build problem yields an EMPTY list (the sample then
 * simply does not exist), never a partial or altered paper.
 */
export function loadScholarshipSampleQuestions(): Promise<readonly AuthoringQuestion[]> {
  sampleCache ??= buildSample().catch((error: unknown) => {
    console.error("[scholarship-sample] refusing to serve the sample:", error instanceof Error ? error.message : error);
    return Object.freeze([]) as readonly AuthoringQuestion[];
  });
  return sampleCache;
}

async function buildSample(): Promise<readonly AuthoringQuestion[]> {
  const packet = await import("./scholarship-sample-questions.json");
  const raws = (packet.default as { questions: Record<string, unknown>[] }).questions;
  const built: AuthoringQuestion[] = [];
  for (const [id, pinned] of Object.entries(SCHOLARSHIP_SAMPLE_PINNED_RAW_HASHES)) {
    const matches = raws.filter((raw) => raw.id === id);
    if (matches.length !== 1) throw new Error(`${id}: expected exactly one source question`);
    if (hashJson(matches[0]) !== pinned) throw new Error(`${id}: source no longer matches its pinned hash`);
    const result = buildPublishedQuestion(candidateQuestionSchema.parse(matches[0]));
    if (!result.ok) throw new Error(`${id}: ${result.issues.join("; ")}`);
    built.push(result.question as unknown as AuthoringQuestion);
  }
  return Object.freeze(built);
}

/**
 * `bank` plus the sample, only for an allowlisted user in an active, correctly bound preview. For everyone else
 * the very same array comes back untouched, so no caller can tell the difference.
 */
export async function withScholarshipSample(
  bank: readonly AuthoringQuestion[],
  userId: string | null | undefined,
  env: Env = process.env,
): Promise<readonly AuthoringQuestion[]> {
  if (!isScholarshipSampleAllowedFor(userId, env)) return bank;
  const sample = await loadScholarshipSampleQuestions();
  if (sample.length === 0) return bank;
  const have = new Set(bank.map((question) => question.id));
  return [...bank, ...sample.filter((question) => !have.has(question.id))];
}

/** Server readiness for the picker: unchanged for everyone except an allowlisted user. */
export async function getPatternReadinessFor(userId: string | null | undefined): Promise<PatternReadinessMap> {
  if (!isScholarshipSampleAllowedFor(userId)) return getPatternReadiness();
  return buildAllPatternReadiness(await withScholarshipSample(getExamBank("published"), userId));
}

/** Patterns this viewer may see in the picker. Production (flag unset) returns the registry untouched. */
export function visibleExamPatterns(userId: string | null | undefined, env: Env = process.env): readonly ExamPattern[] {
  return EXAM_PATTERNS.filter((pattern) => !isScholarshipHiddenFor(pattern, userId, env));
}

/** The signed-in user's id, read only when the preview mode is active (so production pages stay static). */
export async function getViewerIdForSamplePreview(): Promise<string | null> {
  if (!isScholarshipSampleModeActive() || !isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
