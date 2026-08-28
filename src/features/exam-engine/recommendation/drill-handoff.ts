import { z } from "zod";
import { type ExamStyle, type YearLevel, examStyleSchema, yearLevelSchema } from "@/schemas/question.schema";
import { SUBJECT_IDS, type SubjectId } from "@/features/taxonomy/subject-registry";
import { hashSeed } from "@/features/exam-engine/selection/seeded-random";

export const DRILL_LAUNCH_SCHEMA_VERSION = 1;
export const DRILL_STORAGE_PREFIX = "mm:drill-launch:";
export const DRILL_LAUNCH_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
export const DRILL_LAUNCH_MAX_FUTURE_DRIFT_MS = 60 * 1000; // 1 minute max clock drift

export const drillLaunchRequestSchema = z.object({
  version: z.literal(DRILL_LAUNCH_SCHEMA_VERSION),
  launchId: z.string().min(1).max(100),
  subject: z.enum(SUBJECT_IDS, {
    message: "Subject must be a canonical bank subject",
  }),
  skillOrTopic: z.string().trim().min(1).max(100),
  source: z.enum(["skill", "topic"]),
  yearLevel: z.union([yearLevelSchema, z.literal("mixed")]),
  examStyle: z.union([examStyleSchema, z.literal("mixed")]),
  previousQuestionIds: z.array(z.string().trim().min(1).max(100)).max(1000),
  seed: z.string().trim().min(1).max(200),
  createdAt: z.number().int().positive(),
});

export type DrillLaunchRequest = z.infer<typeof drillLaunchRequestSchema>;

export type SaveDrillLaunchResult =
  | { ok: true; launchId: string }
  | { ok: false; reason: string };

/**
 * Build a compact, deterministic, fixed-length seed for drill generation.
 * Hashes the combined configuration and ordered prior-question IDs using FNV-1a
 * to prevent unbounded URL/storage payloads while guaranteeing reproducibility.
 */
export function buildDrillSeed(params: {
  subject: SubjectId;
  skillOrTopic: string;
  yearLevel: YearLevel | "mixed";
  examStyle: ExamStyle | "mixed";
  previousQuestionIds: readonly string[];
}): string {
  const payload = [
    params.subject,
    params.skillOrTopic,
    String(params.yearLevel),
    params.examStyle,
    ...params.previousQuestionIds,
  ].join("\0");

  const hash = hashSeed(payload).toString(16).padStart(8, "0");
  return `drill-${params.subject}-${hash}`;
}

/**
 * Safe accessor for window.sessionStorage that protects against SecurityError,
 * disabled storage, and environments where accessing window.sessionStorage throws.
 */
function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function generateLaunchId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `drill-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

/**
 * Clean up expired launch records from sessionStorage to avoid storage leaks.
 * Completely exception-safe against iteration and item removal failures.
 */
function cleanupExpiredDrillLaunches(storage: Storage): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    const count = storage.length;

    for (let i = 0; i < count; i++) {
      try {
        const key = storage.key(i);
        if (key?.startsWith(DRILL_STORAGE_PREFIX)) {
          const item = storage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (
              !parsed.createdAt ||
              now - parsed.createdAt > DRILL_LAUNCH_MAX_AGE_MS ||
              parsed.createdAt > now + DRILL_LAUNCH_MAX_FUTURE_DRIFT_MS
            ) {
              keysToRemove.push(key);
            }
          }
        }
      } catch {
        // Continue iterating safely
      }
    }

    for (const key of keysToRemove) {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    }
  } catch {
    // Protect against length or key enumeration throws
  }
}

/**
 * Save a drill launch request in sessionStorage and return a discriminated result.
 * Fails safely if browser storage is unavailable, blocked, or full.
 */
export function saveDrillLaunchRequest(
  data: Omit<DrillLaunchRequest, "version" | "createdAt">,
): SaveDrillLaunchResult {
  const storage = getSessionStorage();
  if (!storage) {
    return {
      ok: false,
      reason: "Browser storage is unavailable in this environment.",
    };
  }

  const launchId = data.launchId || generateLaunchId();
  const recordToValidate = {
    version: DRILL_LAUNCH_SCHEMA_VERSION,
    launchId,
    subject: data.subject,
    skillOrTopic: data.skillOrTopic,
    source: data.source,
    yearLevel: data.yearLevel,
    examStyle: data.examStyle,
    previousQuestionIds: data.previousQuestionIds,
    seed: data.seed,
    createdAt: Date.now(),
  };

  const parsed = drillLaunchRequestSchema.safeParse(recordToValidate);
  if (!parsed.success) {
    return {
      ok: false,
      reason: `Invalid launch parameters: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
    };
  }

  cleanupExpiredDrillLaunches(storage);

  const storageKey = `${DRILL_STORAGE_PREFIX}${launchId}`;
  try {
    const serialized = JSON.stringify(parsed.data);
    storage.setItem(storageKey, serialized);

    // Verify storage write succeeded
    let verified: string | null = null;
    try {
      verified = storage.getItem(storageKey);
    } catch {
      // verification read failed
    }

    if (verified !== serialized) {
      // Best-effort cleanup of partial or failed record
      try {
        storage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return {
        ok: false,
        reason: "Failed to persist drill launch session to browser storage.",
      };
    }

    return { ok: true, launchId };
  } catch (error) {
    // Best-effort cleanup if setItem threw
    try {
      storage.removeItem(storageKey);
    } catch {
      // ignore
    }
    return {
      ok: false,
      reason:
        error instanceof Error
          ? error.message
          : "Browser storage quota exceeded or storage blocked.",
    };
  }
}

/**
 * Read and validate a drill launch request from sessionStorage.
 * Returns null if missing, expired, future-dated, malformed, or if launchId mismatch occurs.
 */
export function getDrillLaunchRequest(launchId: string): DrillLaunchRequest | null {
  if (!launchId) return null;
  const storage = getSessionStorage();
  if (!storage) return null;

  const storageKey = `${DRILL_STORAGE_PREFIX}${launchId}`;
  let raw: string | null = null;
  try {
    raw = storage.getItem(storageKey);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const json = JSON.parse(raw);
    const parsed = drillLaunchRequestSchema.safeParse(json);
    if (!parsed.success) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return null;
    }

    // Verify embedded launchId matches the requested key
    if (parsed.data.launchId !== launchId) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return null;
    }

    const now = Date.now();
    // Reject expired
    if (now - parsed.data.createdAt > DRILL_LAUNCH_MAX_AGE_MS) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return null;
    }

    // Reject future-dated timestamps
    if (parsed.data.createdAt > now + DRILL_LAUNCH_MAX_FUTURE_DRIFT_MS) {
      try {
        storage.removeItem(storageKey);
      } catch {
        // ignore
      }
      return null;
    }

    return parsed.data;
  } catch {
    try {
      storage.removeItem(storageKey);
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Explicitly clear a drill launch record.
 */
export function clearDrillLaunchRequest(launchId: string): void {
  if (!launchId) return;
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${DRILL_STORAGE_PREFIX}${launchId}`);
  } catch {
    // ignore
  }
}
