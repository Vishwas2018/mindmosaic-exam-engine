import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Checks whether the Student Workspace visual preview mode is active.
 *
 * NON-NEGOTIABLE SAFETY GATE:
 * 1. Opt-in via explicit STUDENT_WORKSPACE_PREVIEW === "1".
 * 2. Supabase must be unconfigured (!isSupabaseConfigured) to ensure fixtures
 *    can NEVER run against or contaminate real student databases or bypass real auth.
 * 3. Never active in hosted environments (!process.env.VERCEL && !process.env.VERCEL_ENV).
 * 4. Request Host header must be loopback (localhost, 127.0.0.1, or [::1]).
 */
export async function isStudentPreviewEnabled(): Promise<boolean> {
  if (process.env.STUDENT_WORKSPACE_PREVIEW !== "1") {
    return false;
  }

  if (isSupabaseConfigured) {
    return false;
  }

  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return false;
  }

  try {
    const headerList = await headers();
    const host = headerList.get("host") ?? "";
    const hostname = host.split(":")[0]?.toLowerCase();
    const isLoopback =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

    return isLoopback;
  } catch {
    return false;
  }
}

/**
 * Enforces that a preview-only student route is only viewable in local preview mode.
 * Fails closed (returns 404) in all other environments.
 */
export async function requireStudentPreview(): Promise<void> {
  const allowed = await isStudentPreviewEnabled();
  if (!allowed) {
    notFound();
  }
}
