import Link from "next/link";

import { ROLE_HOME_PATHS, WORKSPACE_LABELS, type ProfileRole } from "@/features/auth/roles";

/**
 * Workspace switcher for a login that holds more than one role (Parent + Admin).
 *
 * Renders nothing for a single-role login, so every existing account looks exactly as before. It is plain links: the
 * target workspace's own layout re-runs requireRole() (entitlement + MFA step-up), and the database re-checks
 * is_admin(), so the switcher is navigation only and carries no authority of its own.
 */
export function WorkspaceSwitcher({
  roles,
  current,
}: {
  roles: readonly ProfileRole[];
  current: ProfileRole;
}) {
  if (roles.length < 2) return null;

  return (
    <nav
      aria-label="Workspace switcher"
      data-testid="workspace-switcher"
      className="flex flex-wrap items-center gap-2 border-b border-mm-line bg-mm-tint-soft px-4 py-2 text-sm"
    >
      <span className="font-semibold text-mm-ink-soft">Workspace</span>
      <ul className="flex flex-wrap items-center gap-2">
        {roles.map((role) => {
          const active = role === current;
          return (
            <li key={role}>
              <Link
                href={ROLE_HOME_PATHS[role]}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex min-h-11 items-center rounded-lg bg-mm-brand px-4 font-bold text-white"
                    : "inline-flex min-h-11 items-center rounded-lg border border-mm-line bg-white px-4 font-semibold text-mm-ink hover:border-mm-brand hover:text-mm-brand"
                }
              >
                {WORKSPACE_LABELS[role] ?? role}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
