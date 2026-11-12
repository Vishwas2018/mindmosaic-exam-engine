import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Parent Workspace design-review fixtures are sample data for visual review only.
 * They must never stand in for a real family's records, so they are served only when
 * ALL of these hold:
 *
 *   1. PARENT_WORKSPACE_PREVIEW=1 is set explicitly (opt-in, never a default).
 *   2. Supabase is NOT configured, so there are no real accounts, children or
 *      auth boundary for a fixture to be mistaken for or to bypass.
 *   3. This is not a Vercel deployment (VERCEL / VERCEL_ENV unset).
 *   4. The request arrived on a loopback host (localhost, 127.0.0.1, ::1).
 *
 * In every other case the existing, real, authenticated pages are served and
 * fixture-only routes return 404. No fixture screen performs a network write.
 */
export async function isParentPreviewEnabled(): Promise<boolean> {
  if (process.env.PARENT_WORKSPACE_PREVIEW !== "1") return false;
  if (isSupabaseConfigured) return false;
  if (process.env.VERCEL || process.env.VERCEL_ENV) return false;

  const host = ((await headers()).get("host") ?? "").toLowerCase();
  const hostname = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** Fixture-only routes call this first; they 404 outside local preview. */
export async function requireParentPreview(): Promise<void> {
  if (!(await isParentPreviewEnabled())) notFound();
}
