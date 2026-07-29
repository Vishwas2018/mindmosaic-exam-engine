import type { ReactNode } from "react";

import { PermissionDenied } from "@/components/ui";
import type { ProfileRole } from "@/features/auth";

/**
 * Platform-admin-only gate for operations content. The real security
 * boundary is src/app/admin/layout.tsx (requireRole("admin", "/admin")),
 * which redirects anyone else before this ever renders; this is the
 * presentational, prop-driven half — defense in depth that also makes the
 * denied state trivial to render and test without touching Supabase.
 */
export function AdminAccessGate({
  role,
  children,
}: {
  role: ProfileRole | null;
  children: ReactNode;
}) {
  if (role !== "admin") {
    return (
      <PermissionDenied
        title="Operations is restricted to platform admins"
        description="Background job controls and platform operations aren't available for your role. If you believe this is a mistake, contact your platform administrator."
      />
    );
  }
  return <>{children}</>;
}
