import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin", "/admin");
  return children;
}
