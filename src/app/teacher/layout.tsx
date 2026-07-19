import type { ReactNode } from "react";

import { requireRole } from "@/features/auth/require-role";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await requireRole("teacher", "/teacher");
  return children;
}
