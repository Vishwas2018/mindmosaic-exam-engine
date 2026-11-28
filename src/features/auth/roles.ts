/**
 * Profile roles, mirroring the check constraint on public.profiles (see
 * docs/DATA_MODEL_AND_ROLES.md). Only parent is self-service at public
 * sign-up (D1: students are parent-provisioned via a code+PIN, never
 * self-registered — see ./provision-child.ts); teacher and admin are
 * assigned manually in the database.
 */
export type ProfileRole = "student" | "parent" | "teacher" | "admin";

export type SignUpRole = Extract<ProfileRole, "parent">;

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

/**
 * Link text for each role's home, for headers that offer a signed-in user a
 * way into their own area (the marketing SiteNav). Kept beside
 * ROLE_HOME_PATHS so a label and its destination can never drift apart, and
 * so no caller has to re-derive "where does this role belong" for itself.
 */
/*
 * "Dashboard" for student, not "My learning": /student is already labelled
 * "Dashboard" by STUDENT_NAV_ITEMS (features/student/components/student-nav.ts),
 * and one destination carrying two names in the same product is how a
 * signed-in student ends up unsure the two links go to the same place.
 */
export const ROLE_HOME_LABELS: Record<ProfileRole, string> = {
  student: "Dashboard",
  parent: "Parent dashboard",
  teacher: "Teacher dashboard",
  admin: "Admin dashboard",
};

export function roleHomeLabel(role: ProfileRole | null | undefined): string {
  return role ? ROLE_HOME_LABELS[role] : "Dashboard";
}

/**
 * Roles a signed-in user may ENTER. `profiles.role` is the primary role. Admin is entitled only through an active
 * `user_roles` row (service-role-granted, audited, revocable): that is what lets one login hold Parent + Admin without
 * touching billing, child links or any parent policy.
 *
 * `adminGrants` states what the lookup returned:
 *   - an array: the multi-role migration is applied. Strict: only an unrevoked grant confers admin; a profile that
 *     merely says admin does not (the database makes the same decision, see has_active_admin_role()).
 *   - "missing": the entitlement table does not exist (a database that predates the migration). Only then does the legacy
 *     profile-role rule apply, so deploy order cannot lock existing admins out.
 *   - "error": any other failure. Fail CLOSED: no admin, regardless of profile role. Parent/teacher/student are unaffected.
 */
export interface AdminGrantRow {
  readonly role: string;
  readonly revoked_at: string | null;
}

export type AdminGrantLookup = readonly AdminGrantRow[] | "missing" | "error";

export function resolveEntitledRoles(
  primary: ProfileRole | null,
  adminGrants: AdminGrantLookup,
): ProfileRole[] {
  const roles: ProfileRole[] = [];
  if (primary && primary !== "admin") roles.push(primary);
  let adminEntitled = false;
  if (adminGrants === "missing") adminEntitled = primary === "admin";
  else if (adminGrants !== "error") {
    adminEntitled = adminGrants.some((grant) => grant.role === "admin" && grant.revoked_at === null);
  }
  if (adminEntitled) roles.push("admin");
  return roles;
}

/**
 * Where to send someone who is not entitled to the route they asked for. Always an entitled home (or "/"), so a
 * revoked admin whose profile still says admin cannot be bounced between /admin and itself.
 */
export function landingForEntitled(
  roles: readonly ProfileRole[],
  primary: ProfileRole | null,
): string {
  if (primary && roles.includes(primary)) return roleHomePath(primary);
  const first = roles[0];
  return first ? roleHomePath(first) : "/";
}

export const WORKSPACE_LABELS: Partial<Record<ProfileRole, string>> = {
  parent: "Parent",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};
