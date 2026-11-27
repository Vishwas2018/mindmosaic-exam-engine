import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";
import { WorkspaceSwitcher } from "@/features/auth/components/WorkspaceSwitcher";
import { safeNextPath } from "@/features/auth/safe-next";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";

/*
 * requireRole() only calls cookies() once Supabase is configured, so a build
 * without env vars would otherwise let Next statically prerender this layout
 * with the auth check baked out entirely — the exact bug this batch closes,
 * on the one route (/admin) that had no per-page dynamic export of its own.
 */
export const dynamic = "force-dynamic";

// Gated by requireRole above; robots.ts also disallows /admin, but this
// keeps a search engine from indexing it even if that rule is ever relaxed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function requestedAdminPath(): Promise<string | null> {
  try {
    return (await headers()).get("x-mm-requested-path");
  } catch {
    /* No request scope (unit tests): fall back to the admin root. */
    return null;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isPreview = await isAdminPreviewEnabled();
  if (!isPreview) {
    const requested = safeNextPath(await requestedAdminPath());
    const nextPath = requested && (requested === "/admin" || requested.startsWith("/admin/")) ? requested : "/admin";
    const gate = await requireRole("admin", nextPath);
    if (gate.configured && gate.roles.length > 1) {
      return (
        <>
          <WorkspaceSwitcher roles={gate.roles} current="admin" />
          {children}
        </>
      );
    }
  }
  return children;
}
