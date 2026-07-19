import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRole("student", "/student");
  return children;
}
