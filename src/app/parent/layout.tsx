import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await requireRole("parent", "/parent");
  return children;
}
