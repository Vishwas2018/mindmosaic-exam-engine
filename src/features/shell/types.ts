import type { ReactNode } from "react";

export type AppRole = "student" | "parent" | "teacher" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  student: "Student",
  parent: "Parent",
  teacher: "Teacher",
  admin: "Admin",
};

export interface ShellNavItem {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface ShellUser {
  name: string;
  email?: string;
  avatarUrl?: string;
}
