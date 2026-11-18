import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Checks whether the Admin Workspace visual preview mode is active.
 *
 * NON-NEGOTIABLE SAFETY GATE:
 * 1. Opt-in via explicit ADMIN_WORKSPACE_PREVIEW === "1".
 * 2. Supabase must be unconfigured (!isSupabaseConfigured).
 * 3. Never active in hosted environments (!process.env.VERCEL && !process.env.VERCEL_ENV).
 * 4. Request Host header must be loopback (localhost, 127.0.0.1, or [::1]).
 */
export async function isAdminPreviewEnabled(): Promise<boolean> {
  if (process.env.ADMIN_WORKSPACE_PREVIEW !== "1") {
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

export async function requireAdminPreview(): Promise<void> {
  const allowed = await isAdminPreviewEnabled();
  if (!allowed) {
    notFound();
  }
}
