/**
 * Profile roles, mirroring the check constraint on public.profiles (see
 * docs/DATA_MODEL_AND_ROLES.md). Student and parent are self-service at
 * sign-up; teacher and admin are assigned manually in the database.
 */
export type ProfileRole = "student" | "parent" | "teacher" | "admin";

export type SignUpRole = Extract<ProfileRole, "student" | "parent">;

export function isProfileRole(value: unknown): value is ProfileRole {
  return (
    value === "student" || value === "parent" || value === "teacher" || value === "admin"
  );
}

/**
 * Where each role lands after signing in. These are Phase 0 placeholder
 * routes — the real screens are later phases. Guests never pass through
 * here: without a session there is no role and no redirect.
 */
export const ROLE_HOME_PATHS: Record<ProfileRole, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/teacher",
  admin: "/admin",
};

export function roleHomePath(role: ProfileRole | null | undefined): string {
  return role ? ROLE_HOME_PATHS[role] : "/";
}
