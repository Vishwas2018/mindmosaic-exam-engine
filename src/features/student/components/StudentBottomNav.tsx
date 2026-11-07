import Link from "next/link";

import { SIDEBAR_NAV_ITEMS, type StudentSidebarKey } from "./StudentSidebar";

/**
 * Bottom navigation for the signed-in student app below 1024px (docs/design.md
 * §8.2 scope rule). Same five destinations as the sidebar, from the same list,
 * with short labels; the full name is the accessible name. Help Centre is not
 * one of the five and stays in the sidebar foot / menu.
 *
 * Every target is at least 44px tall and wide. The landmark name differs from
 * the sidebar's "Student navigation" so a screen reader can tell them apart.
 */
export function StudentBottomNav({ active }: { active: StudentSidebarKey }) {
  const items = SIDEBAR_NAV_ITEMS.filter((item) => item.shortLabel);
  return (
    <nav
      aria-label="Main sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-mm-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl items-stretch">
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                  isActive ? "bg-mm-tint text-primary" : "text-mm-ink-soft hover:text-primary"
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
